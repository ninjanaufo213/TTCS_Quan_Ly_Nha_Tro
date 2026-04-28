package com.example.demo.service;

import com.example.demo.dto.RentedRoomRequest;
import com.example.demo.dto.RentedRoomResponse;
import com.example.demo.dto.RoomResponse;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RentedRoomService {

    private final RentedRoomRepository rentedRoomRepository;
    private final ContractServiceRepository contractServiceRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RoomService roomService;

    /**
     * Lấy tất cả hợp đồng
     */
    public List<RentedRoomResponse> getAllRentedRooms() {
        syncExpiredContractsAndRoomAvailability();
        return rentedRoomRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy hợp đồng theo phòng
     */
    public List<RentedRoomResponse> getRentedRoomsByRoom(Integer roomId) {
        syncExpiredContractsAndRoomAvailability();
        if (!roomRepository.existsById(roomId)) {
            throw new IllegalArgumentException("Phòng không tồn tại!");
        }
        return rentedRoomRepository.findByRoom_RoomId(roomId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy hợp đồng theo ID
     */
    public RentedRoomResponse getRentedRoomById(Integer id) {
        syncExpiredContractsAndRoomAvailability();
        return rentedRoomRepository.findById(id)
                .map(this::convertToResponse)
                .orElseThrow(() -> new IllegalArgumentException("Hợp đồng không tồn tại!"));
    }

    /**
     * Tạo hợp đồng mới
     */
    public RentedRoomResponse createRentedRoom(RentedRoomRequest request) {
        syncExpiredContractsAndRoomAvailability();

        // Validate
        validateRentedRoomRequest(request);

        // Lấy Room
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Phòng không tồn tại!"));

        validateNoOverlappingContract(room.getRoomId(), request.getStartDate(), request.getEndDate(), null);

        // Tạo hoặc lấy Tenant
        Tenant tenant = null;
        if (request.getTenantId() != null) {
            tenant = tenantRepository.findById(request.getTenantId())
                    .orElseThrow(() -> new IllegalArgumentException("Khách thuê không tồn tại!"));
        } else if (request.getTenantName() != null && request.getTenantPhone() != null) {
            // Tự động tạo Tenant từ thông tin trong request
            tenant = createTenantFromRequest(request);
        }

        // Tạo RentedRoom
        RentedRoom rentedRoom = RentedRoom.builder()
                .room(room)
                .tenant(tenant)
                .numberOfTenants(request.getNumberOfTenants())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .monthlyRent(request.getMonthlyRent())
                .deposit(request.getDeposit() != null ? request.getDeposit() : BigDecimal.ZERO)
                .contractUrl(request.getContractUrl())
                .isActive(!request.getEndDate().isBefore(LocalDate.now()))
                .build();

        RentedRoom saved = rentedRoomRepository.save(rentedRoom);

        // Tạo Contract Services (nước, điện, wifi, dịch vụ chung)
        createContractServices(saved, request);

        refreshRoomAvailability(room.getRoomId());

        return convertToResponse(saved);
    }

    /**
     * Tạo Tenant từ thông tin request
     */
    private Tenant createTenantFromRequest(RentedRoomRequest request) {
        // Kiểm tra xem User đã tồn tại không dựa trên số điện thoại
        User existingUser = userRepository.findByPhone(request.getTenantPhone()).orElse(null);

        User user;
        if (existingUser != null) {
            user = existingUser;
        } else {
            // Tạo User mới
            user = User.builder()
                    .email(request.getTenantPhone() + "@tenant.local")
                    .phone(request.getTenantPhone())
                    .password("temp_password") // Sẽ được reset sau
                    .role("TENANT")
                    .isActive(true)
                    .build();
            user = userRepository.save(user);
        }

        // Tạo Tenant mới nếu chưa tồn tại
        Tenant existingTenant = tenantRepository.findByUser_UserId(user.getUserId()).orElse(null);
        if (existingTenant != null) {
            return existingTenant;
        }

        Tenant tenant = Tenant.builder()
                .user(user)
                .fullname(request.getTenantName())
                .identityCard("") // Sẽ cập nhật sau
                .build();
        return tenantRepository.save(tenant);
    }

    /**
     * Cập nhật hợp đồng
     */
    public RentedRoomResponse updateRentedRoom(Integer id, RentedRoomRequest request) {
        syncExpiredContractsAndRoomAvailability();

        RentedRoom rentedRoom = rentedRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Hợp đồng không tồn tại!"));

        // Validate
        validateUpdateRequest(request, rentedRoom);

        LocalDate effectiveEndDate = request.getEndDate() != null ? request.getEndDate() : rentedRoom.getEndDate();
        validateNoOverlappingContract(rentedRoom.getRoom().getRoomId(), rentedRoom.getStartDate(), effectiveEndDate, rentedRoom.getRrId());

        // Cập nhật thông tin
        if (request.getNumberOfTenants() != null) {
            rentedRoom.setNumberOfTenants(request.getNumberOfTenants());
        }
        if (request.getEndDate() != null) {
            rentedRoom.setEndDate(request.getEndDate());
            if (request.getEndDate().isBefore(LocalDate.now())) {
                rentedRoom.setIsActive(false);
            }
        }
        if (request.getMonthlyRent() != null) {
            rentedRoom.setMonthlyRent(request.getMonthlyRent());
        }
        if (request.getDeposit() != null) {
            rentedRoom.setDeposit(request.getDeposit());
        }
        if (request.getContractUrl() != null) {
            rentedRoom.setContractUrl(request.getContractUrl());
        }
        if (request.getTenantId() != null) {
            Tenant tenant = tenantRepository.findById(request.getTenantId())
                    .orElseThrow(() -> new IllegalArgumentException("Khách thuê không tồn tại!"));
            rentedRoom.setTenant(tenant);
        } else if (request.getTenantName() != null && request.getTenantPhone() != null) {
            Tenant tenant = createTenantFromRequest(request);
            rentedRoom.setTenant(tenant);
        }

        RentedRoom updated = rentedRoomRepository.save(rentedRoom);

        // Cập nhật hoặc tạo Contract Services nếu có thay đổi
        if (request.getWaterPrice() != null || request.getInternetPrice() != null || 
            request.getGeneralPrice() != null || request.getElectricityUnitPrice() != null) {
            // Xóa services cũ
            contractServiceRepository.deleteAll(contractServiceRepository.findByRentedRoom(updated));
            // Tạo services mới
            createContractServices(updated, request);
        }

        if (updated.getRoom() != null) {
            refreshRoomAvailability(updated.getRoom().getRoomId());
        }

        return convertToResponse(updated);
    }

    /**
     * Chấm dứt hợp đồng
     */
    public RentedRoomResponse terminateRentedRoom(Integer id) {
        syncExpiredContractsAndRoomAvailability();

        RentedRoom rentedRoom = rentedRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Hợp đồng không tồn tại!"));

        rentedRoom.setIsActive(false);
        RentedRoom updated = rentedRoomRepository.save(rentedRoom);

        if (updated.getRoom() != null) {
            refreshRoomAvailability(updated.getRoom().getRoomId());
        }

        return convertToResponse(updated);
    }

    /**
     * Xóa hợp đồng
     */
    public void deleteRentedRoom(Integer id) {
        RentedRoom rentedRoom = rentedRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Hợp đồng không tồn tại!"));
        Integer roomId = rentedRoom.getRoom() != null ? rentedRoom.getRoom().getRoomId() : null;

        rentedRoomRepository.deleteById(id);

        if (roomId != null) {
            refreshRoomAvailability(roomId);
        }
    }

    private void validateNoOverlappingContract(Integer roomId, LocalDate startDate, LocalDate endDate, Integer excludeRrId) {
        LocalDate requestedEnd = endDate != null ? endDate : LocalDate.MAX;

        for (RentedRoom existing : rentedRoomRepository.findByRoom_RoomIdAndIsActiveTrue(roomId)) {
            if (excludeRrId != null && excludeRrId.equals(existing.getRrId())) {
                continue;
            }

            LocalDate existingStart = existing.getStartDate();
            LocalDate existingEnd = existing.getEndDate() != null ? existing.getEndDate() : LocalDate.MAX;

            boolean isOverlapping = !startDate.isAfter(existingEnd) && !requestedEnd.isBefore(existingStart);
            if (isOverlapping) {
                throw new IllegalArgumentException("Phòng này đã có hợp đồng còn hiệu lực trong khoảng thời gian đã chọn!");
            }
        }
    }

    private void syncExpiredContractsAndRoomAvailability() {
        LocalDate today = LocalDate.now();
        List<RentedRoom> activeContracts = rentedRoomRepository.findByIsActiveTrue();
        Set<Integer> changedRoomIds = new HashSet<>();

        for (RentedRoom contract : activeContracts) {
            if (contract.getEndDate() != null && contract.getEndDate().isBefore(today)) {
                contract.setIsActive(false);
                if (contract.getRoom() != null) {
                    changedRoomIds.add(contract.getRoom().getRoomId());
                }
            }
        }

        rentedRoomRepository.saveAll(activeContracts);

        for (Integer roomId : changedRoomIds) {
            refreshRoomAvailability(roomId);
        }
    }

    private void refreshRoomAvailability(Integer roomId) {
        roomRepository.findById(roomId).ifPresent(room -> {
            LocalDate today = LocalDate.now();
            boolean hasEffectiveActiveContract = rentedRoomRepository
                    .existsByRoom_RoomIdAndIsActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                            roomId,
                            today,
                            today
                    );
            room.setIsAvailable(!hasEffectiveActiveContract);
            roomRepository.save(room);
        });
    }

    /**
     * Tạo hoặc cập nhật Contract Services
     */
    private void createContractServices(RentedRoom rentedRoom, RentedRoomRequest request) {
        // Nước
        if (request.getWaterPrice() != null && request.getWaterPrice().compareTo(BigDecimal.ZERO) > 0) {
            ContractService water = ContractService.builder()
                    .rentedRoom(rentedRoom)
                    .serviceName("Nước")
                    .unitPrice(request.getWaterPrice())
                    .build();
            contractServiceRepository.save(water);
        }

        // Wifi/Internet
        if (request.getInternetPrice() != null && request.getInternetPrice().compareTo(BigDecimal.ZERO) > 0) {
            ContractService internet = ContractService.builder()
                    .rentedRoom(rentedRoom)
                    .serviceName("Wifi")
                    .unitPrice(request.getInternetPrice())
                    .build();
            contractServiceRepository.save(internet);
        }

        // Dịch vụ chung
        if (request.getGeneralPrice() != null && request.getGeneralPrice().compareTo(BigDecimal.ZERO) > 0) {
            ContractService general = ContractService.builder()
                    .rentedRoom(rentedRoom)
                    .serviceName("Dịch vụ chung")
                    .unitPrice(request.getGeneralPrice())
                    .build();
            contractServiceRepository.save(general);
        }

        // Điện
        if (request.getElectricityUnitPrice() != null && request.getElectricityUnitPrice().compareTo(BigDecimal.ZERO) > 0) {
            ContractService electricity = ContractService.builder()
                    .rentedRoom(rentedRoom)
                    .serviceName("Điện")
                    .unitPrice(request.getElectricityUnitPrice())
                    .initialNumber(request.getInitialElectricityNum() != null ? request.getInitialElectricityNum() : 0)
                    .build();
            contractServiceRepository.save(electricity);
        }
    }

    /**
     * Convert RentedRoom to RentedRoomResponse
     */
    private RentedRoomResponse convertToResponse(RentedRoom rentedRoom) {
        RoomResponse roomResponse = null;
        if (rentedRoom.getRoom() != null) {
            roomResponse = roomService.getRoomById(rentedRoom.getRoom().getRoomId())
                    .orElse(null);
        }

        String tenantName = null;
        String tenantPhone = null;
        if (rentedRoom.getTenant() != null && rentedRoom.getTenant().getUser() != null) {
            tenantName = rentedRoom.getTenant().getFullname();
            tenantPhone = rentedRoom.getTenant().getUser().getPhone();
        }

        BigDecimal waterPrice = null;
        BigDecimal internetPrice = null;
        BigDecimal generalPrice = null;
        Integer initialElectricityNum = null;
        BigDecimal electricityUnitPrice = null;

        List<ContractService> contractServices = rentedRoom.getContractServices();
        if (contractServices != null) {
            for (ContractService service : contractServices) {
                if (service == null || service.getServiceName() == null) {
                    continue;
                }
                switch (service.getServiceName()) {
                    case "Nước" -> waterPrice = service.getUnitPrice();
                    case "Wifi" -> internetPrice = service.getUnitPrice();
                    case "Dịch vụ chung" -> generalPrice = service.getUnitPrice();
                    case "Điện" -> {
                        electricityUnitPrice = service.getUnitPrice();
                        initialElectricityNum = service.getInitialNumber();
                    }
                    default -> {
                        // Ignore unknown service names
                    }
                }
            }
        }

        return RentedRoomResponse.builder()
                .rrId(rentedRoom.getRrId())
                .roomId(rentedRoom.getRoom() != null ? rentedRoom.getRoom().getRoomId() : null)
                .room(roomResponse)
                .tenantId(rentedRoom.getTenant() != null ? rentedRoom.getTenant().getTenantId() : null)
                .tenantName(tenantName)
                .tenantPhone(tenantPhone)
                .numberOfTenants(rentedRoom.getNumberOfTenants())
                .startDate(rentedRoom.getStartDate())
                .endDate(rentedRoom.getEndDate())
                .monthlyRent(rentedRoom.getMonthlyRent())
                .deposit(rentedRoom.getDeposit())
                .contractUrl(rentedRoom.getContractUrl())
                .waterPrice(waterPrice)
                .internetPrice(internetPrice)
                .generalPrice(generalPrice)
                .initialElectricityNum(initialElectricityNum)
                .electricityUnitPrice(electricityUnitPrice)
                .isActive(rentedRoom.getIsActive())
                .createdAt(rentedRoom.getCreatedAt())
                .updatedAt(rentedRoom.getUpdatedAt())
                .build();
    }

    /**
     * Validate RentedRoomRequest
     */
    private void validateRentedRoomRequest(RentedRoomRequest request) {
        if (request.getRoomId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn phòng!");
        }
        if (request.getNumberOfTenants() == null || request.getNumberOfTenants() <= 0) {
            throw new IllegalArgumentException("Số người thuê phải lớn hơn 0!");
        }
        if (request.getStartDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày bắt đầu!");
        }
        if (request.getEndDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày kết thúc!");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu!");
        }
        if (request.getMonthlyRent() == null || request.getMonthlyRent().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Tiền thuê phải lớn hơn 0!");
        }

        // Kiểm tra capacity của phòng
        Room room = roomRepository.findById(request.getRoomId()).orElse(null);
        if (room != null) {
            Integer capacity = room.getCapacity() != null ? room.getCapacity() : 1;
            if (request.getNumberOfTenants() > capacity) {
                throw new IllegalArgumentException("Số người thuê không được vượt quá sức chứa của phòng (" + capacity + " người)!");
            }
        }
    }

    /**
     * Validate update request
     */
    private void validateUpdateRequest(RentedRoomRequest request, RentedRoom rentedRoom) {
        if (request.getNumberOfTenants() != null && request.getNumberOfTenants() <= 0) {
            throw new IllegalArgumentException("Số người thuê phải lớn hơn 0!");
        }
        if (request.getEndDate() != null && request.getEndDate().isBefore(rentedRoom.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu!");
        }
        if (request.getMonthlyRent() != null && request.getMonthlyRent().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Tiền thuê phải lớn hơn 0!");
        }

        // Kiểm tra capacity của phòng
        if (request.getNumberOfTenants() != null) {
            Room room = rentedRoom.getRoom();
            if (room != null) {
                Integer capacity = room.getCapacity() != null ? room.getCapacity() : 1;
                if (request.getNumberOfTenants() > capacity) {
                    throw new IllegalArgumentException("Số người thuê không được vượt quá sức chứa của phòng (" + capacity + " người)!");
                }
            }
        }
    }
}

