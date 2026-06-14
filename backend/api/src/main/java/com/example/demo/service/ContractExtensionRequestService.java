package com.example.demo.service;

import com.example.demo.dto.ContractExtensionRequestCreate;
import com.example.demo.dto.ContractExtensionRequestResponse;
import com.example.demo.model.ContractExtensionRequest;
import com.example.demo.model.RentedRoom;
import com.example.demo.model.Tenant;
import com.example.demo.repository.ContractExtensionRequestRepository;
import com.example.demo.repository.RentedRoomRepository;
import com.example.demo.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ContractExtensionRequestService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";

    private final ContractExtensionRequestRepository contractExtensionRequestRepository;
    private final RentedRoomRepository rentedRoomRepository;
    private final TenantRepository tenantRepository;
    private final AuthService authService;
    private final NotificationService notificationService;

    public ContractExtensionRequestResponse createRequest(ContractExtensionRequestCreate request) {
        Integer tenantId = authService.getCurrentTenantId();
        RentedRoom rentedRoom = rentedRoomRepository.findById(request.rentedRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Hợp đồng không tồn tại"));

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin người thuê"));

        if (rentedRoom.getTenant() == null || !rentedRoom.getTenant().getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Bạn không có quyền yêu cầu gia hạn hợp đồng này");
        }

        if (!Boolean.TRUE.equals(rentedRoom.getIsActive())) {
            throw new IllegalArgumentException("Hợp đồng đã kết thúc, không thể gia hạn");
        }

        if (rentedRoom.getEndDate() == null) {
            throw new IllegalArgumentException("Hợp đồng không có ngày kết thúc, không thể gia hạn");
        }

        if (request.requestedEndDate() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày kết thúc mới");
        }

        if (!request.requestedEndDate().isAfter(rentedRoom.getEndDate())) {
            throw new IllegalArgumentException("Ngày gia hạn phải sau ngày kết thúc hiện tại");
        }

        if (request.requestedEndDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Ngày gia hạn phải từ hôm nay trở đi");
        }

        if (contractExtensionRequestRepository.existsByRentedRoom_RrIdAndStatus(rentedRoom.getRrId(), STATUS_PENDING)) {
            throw new IllegalArgumentException("Hợp đồng này đã có yêu cầu gia hạn đang chờ duyệt");
        }

        ContractExtensionRequest extensionRequest = ContractExtensionRequest.builder()
                .rentedRoom(rentedRoom)
                .tenant(tenant)
                .currentEndDate(rentedRoom.getEndDate())
                .requestedEndDate(request.requestedEndDate())
                .status(STATUS_PENDING)
                .build();

        ContractExtensionRequest saved = contractExtensionRequestRepository.save(extensionRequest);

        if (rentedRoom.getRoom() != null && rentedRoom.getRoom().getHouse() != null
                && rentedRoom.getRoom().getHouse().getLandlord() != null
                && rentedRoom.getRoom().getHouse().getLandlord().getUser() != null) {
            notificationService.notifyUserWithTemplate(
                    rentedRoom.getRoom().getHouse().getLandlord().getUser(),
                    tenant.getUser(),
                    "CONTRACT_EXTENSION_REQUESTED",
                    saved.getExtensionRequestId(),
                    "noti.extension.requested.title",
                    "noti.extension.requested.message",
                    rentedRoom.getRoom().getName()
            );
        }

        return mapToResponse(saved);
    }

    public List<ContractExtensionRequestResponse> getTenantRequests() {
        Integer tenantId = authService.getCurrentTenantId();
        return contractExtensionRequestRepository.findByTenant_TenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ContractExtensionRequestResponse> getLandlordRequests() {
        Integer landlordId = authService.getCurrentLandlordId();
        return contractExtensionRequestRepository.findByRentedRoom_Room_House_Landlord_LandlordIdOrderByCreatedAtDesc(landlordId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ContractExtensionRequestResponse approveRequest(Integer requestId) {
        ContractExtensionRequest extensionRequest = contractExtensionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Yêu cầu gia hạn không tồn tại"));

        validateLandlordPermission(extensionRequest);

        if (!STATUS_PENDING.equals(extensionRequest.getStatus())) {
            throw new IllegalArgumentException("Yêu cầu gia hạn đã được xử lý");
        }

        RentedRoom rentedRoom = extensionRequest.getRentedRoom();
        rentedRoom.setEndDate(extensionRequest.getRequestedEndDate());
        rentedRoom.setIsActive(!extensionRequest.getRequestedEndDate().isBefore(LocalDate.now()));
        rentedRoomRepository.save(rentedRoom);

        extensionRequest.setStatus(STATUS_APPROVED);
        ContractExtensionRequest saved = contractExtensionRequestRepository.save(extensionRequest);

        if (extensionRequest.getTenant() != null && extensionRequest.getTenant().getUser() != null
                && rentedRoom.getRoom() != null && rentedRoom.getRoom().getHouse() != null
                && rentedRoom.getRoom().getHouse().getLandlord() != null) {
            notificationService.notifyUserWithTemplate(
                    extensionRequest.getTenant().getUser(),
                    rentedRoom.getRoom().getHouse().getLandlord().getUser(),
                    "CONTRACT_EXTENSION_APPROVED",
                    saved.getExtensionRequestId(),
                    "noti.extension.approved.title",
                    "noti.extension.approved.message",
                    rentedRoom.getRoom().getName()
            );
        }

        return mapToResponse(saved);
    }

    public ContractExtensionRequestResponse rejectRequest(Integer requestId) {
        ContractExtensionRequest extensionRequest = contractExtensionRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Yêu cầu gia hạn không tồn tại"));

        validateLandlordPermission(extensionRequest);

        if (!STATUS_PENDING.equals(extensionRequest.getStatus())) {
            throw new IllegalArgumentException("Yêu cầu gia hạn đã được xử lý");
        }

        extensionRequest.setStatus(STATUS_REJECTED);
        ContractExtensionRequest saved = contractExtensionRequestRepository.save(extensionRequest);

        RentedRoom rentedRoom = extensionRequest.getRentedRoom();
        if (extensionRequest.getTenant() != null && extensionRequest.getTenant().getUser() != null
                && rentedRoom != null && rentedRoom.getRoom() != null && rentedRoom.getRoom().getHouse() != null
                && rentedRoom.getRoom().getHouse().getLandlord() != null) {
            notificationService.notifyUserWithTemplate(
                    extensionRequest.getTenant().getUser(),
                    rentedRoom.getRoom().getHouse().getLandlord().getUser(),
                    "CONTRACT_EXTENSION_REJECTED",
                    saved.getExtensionRequestId(),
                    "noti.extension.rejected.title",
                    "noti.extension.rejected.message",
                    rentedRoom.getRoom().getName()
            );
        }

        return mapToResponse(saved);
    }

    private void validateLandlordPermission(ContractExtensionRequest extensionRequest) {
        Integer landlordId = authService.getCurrentLandlordId();
        if (extensionRequest.getRentedRoom() == null || extensionRequest.getRentedRoom().getRoom() == null
                || extensionRequest.getRentedRoom().getRoom().getHouse() == null
                || extensionRequest.getRentedRoom().getRoom().getHouse().getLandlord() == null
                || !extensionRequest.getRentedRoom().getRoom().getHouse().getLandlord().getLandlordId().equals(landlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền xử lý yêu cầu này");
        }
    }

    private ContractExtensionRequestResponse mapToResponse(ContractExtensionRequest request) {
        String roomName = request.getRentedRoom() != null && request.getRentedRoom().getRoom() != null
                ? request.getRentedRoom().getRoom().getName()
                : null;
        String houseName = request.getRentedRoom() != null && request.getRentedRoom().getRoom() != null
                && request.getRentedRoom().getRoom().getHouse() != null
                ? request.getRentedRoom().getRoom().getHouse().getName()
                : null;
        String tenantName = request.getTenant() != null ? request.getTenant().getFullname() : null;
        String tenantPhone = request.getTenant() != null && request.getTenant().getUser() != null
                ? request.getTenant().getUser().getPhone()
                : null;

        return ContractExtensionRequestResponse.builder()
                .extensionRequestId(request.getExtensionRequestId())
                .rentedRoomId(request.getRentedRoom() != null ? request.getRentedRoom().getRrId() : null)
                .roomId(request.getRentedRoom() != null && request.getRentedRoom().getRoom() != null
                        ? request.getRentedRoom().getRoom().getRoomId()
                        : null)
                .roomName(roomName)
                .houseName(houseName)
                .tenantName(tenantName)
                .tenantPhone(tenantPhone)
                .currentEndDate(request.getCurrentEndDate())
                .requestedEndDate(request.getRequestedEndDate())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .build();
    }
}

