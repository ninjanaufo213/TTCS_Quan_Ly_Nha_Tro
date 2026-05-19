package com.example.demo.service;

import com.example.demo.dto.ContractRequestResponse;
import com.example.demo.dto.RentedRoomRequest;
import com.example.demo.model.ContractRequest;
import com.example.demo.model.RentRequest;
import com.example.demo.model.Room;
import com.example.demo.model.Tenant;
import com.example.demo.repository.ContractRequestRepository;
import com.example.demo.repository.RentRequestRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.TenantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ContractRequestService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_CANCELED = "CANCELED";

    private final ContractRequestRepository contractRequestRepository;
    private final RentRequestRepository rentRequestRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final AuthService authService;
    private final RentedRoomService rentedRoomService;
    private final NotificationService notificationService;
    private final ViewingService viewingService;

    public ContractRequestService(ContractRequestRepository contractRequestRepository,
                                  RentRequestRepository rentRequestRepository,
                                  RoomRepository roomRepository,
                                  TenantRepository tenantRepository,
                                  AuthService authService,
                                  RentedRoomService rentedRoomService,
                                  NotificationService notificationService,
                                  ViewingService viewingService) {
        this.contractRequestRepository = contractRequestRepository;
        this.rentRequestRepository = rentRequestRepository;
        this.roomRepository = roomRepository;
        this.tenantRepository = tenantRepository;
        this.authService = authService;
        this.rentedRoomService = rentedRoomService;
        this.notificationService = notificationService;
        this.viewingService = viewingService;
    }

    public ContractRequestResponse createForViewing(Integer viewingId, RentedRoomRequest request) {
        RentRequest rentRequest = rentRequestRepository.findById(viewingId)
                .orElseThrow(() -> new IllegalArgumentException("Lịch xem phòng không tồn tại"));

        Integer landlordId = authService.getCurrentLandlordId();
        if (rentRequest.getRoom() == null || rentRequest.getRoom().getHouse() == null
                || rentRequest.getRoom().getHouse().getLandlord() == null
                || !rentRequest.getRoom().getHouse().getLandlord().getLandlordId().equals(landlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền tạo hợp đồng cho lịch xem này");
        }

        if (ViewingService.STATUS_CANCELED.equals(rentRequest.getStatus())
                || ViewingService.STATUS_CONTRACTED.equals(rentRequest.getStatus())) {
            throw new IllegalArgumentException("Lịch xem không hợp lệ để tạo hợp đồng");
        }

        if (!ViewingService.STATUS_APPROVED.equals(rentRequest.getStatus())) {
            throw new IllegalArgumentException("Lịch xem phòng chưa được xác nhận");
        }

        if (!contractRequestRepository.findByRentRequest_RequestIdAndStatusIn(viewingId, List.of(STATUS_PENDING)).isEmpty()) {
            throw new IllegalArgumentException("Lịch xem này đã có yêu cầu hợp đồng đang chờ xác nhận");
        }

        Room room = rentRequest.getRoom();
        if (request.getRoomId() != null && !request.getRoomId().equals(room.getRoomId())) {
            throw new IllegalArgumentException("Phòng trong yêu cầu hợp đồng không khớp với lịch xem");
        }

        validateContractRequest(room, request);

        Tenant tenant = rentRequest.getTenant();
        if (tenant == null) {
            throw new IllegalArgumentException("Không tìm thấy thông tin người thuê");
        }

        ContractRequest contractRequest = ContractRequest.builder()
                .rentRequest(rentRequest)
                .room(room)
                .tenant(tenant)
                .status(STATUS_PENDING)
                .numberOfTenants(request.getNumberOfTenants())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .monthlyRent(request.getMonthlyRent() != null ? request.getMonthlyRent() : room.getPrice())
                .deposit(request.getDeposit() != null ? request.getDeposit() : BigDecimal.ZERO)
                .contractUrl(request.getContractUrl())
                .waterPrice(request.getWaterPrice())
                .internetPrice(request.getInternetPrice())
                .generalPrice(request.getGeneralPrice())
                .initialElectricityNum(request.getInitialElectricityNum())
                .electricityUnitPrice(request.getElectricityUnitPrice())
                .build();

        rentRequest.setStatus(ViewingService.STATUS_CONTRACT_PENDING);
        rentRequestRepository.save(rentRequest);

        ContractRequest saved = contractRequestRepository.save(contractRequest);

        notificationService.notifyUser(
                tenant.getUser(),
                room.getHouse() != null && room.getHouse().getLandlord() != null ? room.getHouse().getLandlord().getUser() : null,
                "Yêu cầu xác nhận hợp đồng",
                "Chủ trọ đã gửi yêu cầu hợp đồng cho phòng " + room.getName() + ". Vui lòng xác nhận.",
                "CONTRACT_REQUESTED",
                saved.getContractRequestId()
        );

        return mapToResponse(saved);
    }

    public List<ContractRequestResponse> getTenantContractRequests() {
        Integer tenantId = authService.getCurrentTenantId();
        return contractRequestRepository.findByTenant_TenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ContractRequestResponse> getLandlordContractRequests() {
        Integer landlordId = authService.getCurrentLandlordId();
        return contractRequestRepository.findByRoom_House_Landlord_LandlordIdOrderByCreatedAtDesc(landlordId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ContractRequestResponse confirmContractRequest(Integer contractRequestId) {
        ContractRequest contractRequest = contractRequestRepository.findById(contractRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Yêu cầu hợp đồng không tồn tại"));

        Integer tenantId = authService.getCurrentTenantId();
        if (contractRequest.getTenant() == null || !contractRequest.getTenant().getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Bạn không có quyền xác nhận yêu cầu này");
        }

        if (!STATUS_PENDING.equals(contractRequest.getStatus())) {
            throw new IllegalArgumentException("Yêu cầu hợp đồng đã được xử lý");
        }

        RentRequest rentRequest = contractRequest.getRentRequest();
        if (rentRequest != null) {
            rentRequest.setStatus(ViewingService.STATUS_CONTRACTED);
            rentRequestRepository.save(rentRequest);
        }

        contractRequest.setStatus(STATUS_CONFIRMED);
        contractRequestRepository.save(contractRequest);

        RentedRoomRequest rentedRoomRequest = RentedRoomRequest.builder()
                .roomId(contractRequest.getRoom() != null ? contractRequest.getRoom().getRoomId() : null)
                .tenantId(contractRequest.getTenant() != null ? contractRequest.getTenant().getTenantId() : null)
                .numberOfTenants(contractRequest.getNumberOfTenants())
                .startDate(contractRequest.getStartDate())
                .endDate(contractRequest.getEndDate())
                .monthlyRent(contractRequest.getMonthlyRent())
                .deposit(contractRequest.getDeposit())
                .contractUrl(contractRequest.getContractUrl())
                .waterPrice(contractRequest.getWaterPrice())
                .internetPrice(contractRequest.getInternetPrice())
                .generalPrice(contractRequest.getGeneralPrice())
                .initialElectricityNum(contractRequest.getInitialElectricityNum())
                .electricityUnitPrice(contractRequest.getElectricityUnitPrice())
                .build();

        rentedRoomService.createRentedRoom(rentedRoomRequest);
        viewingService.cancelOtherViewingsForTenant(
                contractRequest.getTenant() != null ? contractRequest.getTenant().getTenantId() : null,
                rentRequest != null ? rentRequest.getRequestId() : null
        );

        if (contractRequest.getRoom() != null && contractRequest.getRoom().getHouse() != null
                && contractRequest.getRoom().getHouse().getLandlord() != null) {
            notificationService.notifyUser(
                    contractRequest.getRoom().getHouse().getLandlord().getUser(),
                    contractRequest.getTenant() != null ? contractRequest.getTenant().getUser() : null,
                    "Hợp đồng đã được xác nhận",
                    "Người thuê đã xác nhận hợp đồng cho phòng " + contractRequest.getRoom().getName(),
                    "CONTRACT_CONFIRMED",
                    contractRequest.getContractRequestId()
            );
        }

        return mapToResponse(contractRequest);
    }

    public ContractRequestResponse cancelContractRequestByTenant(Integer contractRequestId) {
        ContractRequest contractRequest = contractRequestRepository.findById(contractRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Yêu cầu hợp đồng không tồn tại"));

        Integer tenantId = authService.getCurrentTenantId();
        if (contractRequest.getTenant() == null || !contractRequest.getTenant().getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Bạn không có quyền hủy yêu cầu này");
        }

        if (!STATUS_PENDING.equals(contractRequest.getStatus())) {
            throw new IllegalArgumentException("Yêu cầu hợp đồng đã được xử lý");
        }

        contractRequest.setStatus(STATUS_CANCELED);
        contractRequestRepository.save(contractRequest);

        RentRequest rentRequest = contractRequest.getRentRequest();
        if (rentRequest != null && !ViewingService.STATUS_CONTRACTED.equals(rentRequest.getStatus())) {
            rentRequest.setStatus(ViewingService.STATUS_CANCELED);
            rentRequestRepository.save(rentRequest);
        }

        if (contractRequest.getRoom() != null && contractRequest.getRoom().getHouse() != null
                && contractRequest.getRoom().getHouse().getLandlord() != null) {
            notificationService.notifyUser(
                    contractRequest.getRoom().getHouse().getLandlord().getUser(),
                    contractRequest.getTenant() != null ? contractRequest.getTenant().getUser() : null,
                    "Hủy yêu cầu hợp đồng",
                    "Người thuê đã hủy yêu cầu hợp đồng cho phòng " + contractRequest.getRoom().getName(),
                    "CONTRACT_CANCELED",
                    contractRequest.getContractRequestId()
            );
        }

        return mapToResponse(contractRequest);
    }

    private void validateContractRequest(Room room, RentedRoomRequest request) {
        if (request.getNumberOfTenants() == null || request.getNumberOfTenants() <= 0) {
            throw new IllegalArgumentException("Số người thuê phải lớn hơn 0");
        }
        if (request.getStartDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày bắt đầu");
        }
        if (request.getEndDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày kết thúc");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        if (room != null) {
            Integer capacity = room.getCapacity() != null ? room.getCapacity() : 1;
            if (request.getNumberOfTenants() > capacity) {
                throw new IllegalArgumentException("Số người thuê không được vượt quá sức chứa của phòng (" + capacity + " người)");
            }
            if (!Boolean.TRUE.equals(room.getIsAvailable())) {
                throw new IllegalArgumentException("Phòng đang không khả dụng để tạo hợp đồng");
            }
        }

        BigDecimal rent = request.getMonthlyRent();
        if (rent != null && rent.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Tiền thuê phải lớn hơn 0");
        }
    }

    private ContractRequestResponse mapToResponse(ContractRequest request) {
        String houseName = "";
        if (request.getRoom() != null && request.getRoom().getHouse() != null) {
            houseName = request.getRoom().getHouse().getName();
        }
        String tenantName = request.getTenant() != null ? request.getTenant().getFullname() : "";
        String tenantPhone = (request.getTenant() != null && request.getTenant().getUser() != null)
                ? request.getTenant().getUser().getPhone()
                : "";

        return ContractRequestResponse.builder()
                .contractRequestId(request.getContractRequestId())
                .requestId(request.getRentRequest() != null ? request.getRentRequest().getRequestId() : null)
                .roomId(request.getRoom() != null ? request.getRoom().getRoomId() : null)
                .roomName(request.getRoom() != null ? request.getRoom().getName() : null)
                .houseName(houseName)
                .tenantName(tenantName)
                .tenantPhone(tenantPhone)
                .numberOfTenants(request.getNumberOfTenants())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .monthlyRent(request.getMonthlyRent())
                .deposit(request.getDeposit())
                .waterPrice(request.getWaterPrice())
                .internetPrice(request.getInternetPrice())
                .generalPrice(request.getGeneralPrice())
                .initialElectricityNum(request.getInitialElectricityNum())
                .electricityUnitPrice(request.getElectricityUnitPrice())
                .contractUrl(request.getContractUrl())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .build();
    }
}

