package com.example.demo.service;

import com.example.demo.dto.ViewingRequest;
import com.example.demo.dto.ViewingResponse;
import com.example.demo.integration.esms.EsmsSmsSender;
import com.example.demo.model.RentRequest;
import com.example.demo.model.Room;
import com.example.demo.model.Tenant;
import com.example.demo.model.User;
import com.example.demo.repository.RentRequestRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.TenantRepository;
import com.example.demo.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ViewingService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_SCHEDULED = "SCHEDULED";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_CANCELED = "CANCELED";
    public static final String STATUS_CONTRACT_PENDING = "CONTRACT_PENDING";
    public static final String STATUS_CONTRACTED = "CONTRACTED";

    private final RentRequestRepository rentRequestRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final AuthService authService;
    private final NotificationService notificationService;
    private final EsmsSmsSender esmsSmsSender;

    public ViewingService(RentRequestRepository rentRequestRepository,
                          RoomRepository roomRepository,
                          TenantRepository tenantRepository,
                          AuthService authService,
                          NotificationService notificationService,
                          EsmsSmsSender esmsSmsSender) {
        this.rentRequestRepository = rentRequestRepository;
        this.roomRepository = roomRepository;
        this.tenantRepository = tenantRepository;
        this.authService = authService;
        this.notificationService = notificationService;
        this.esmsSmsSender = esmsSmsSender;
    }

    public ViewingResponse createViewing(ViewingRequest request) {
        if (request.roomId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn phòng");
        }
        if (request.visitDate() == null || request.visitTime() == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày và giờ");
        }

        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new IllegalArgumentException("Phòng không tồn tại"));

        if (!Boolean.TRUE.equals(room.getIsAvailable())) {
            throw new IllegalArgumentException("Phòng đã được thuê, không thể đặt lịch xem");
        }

        Integer userId = authService.getCurrentUserId();
        Tenant tenant = tenantRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin người thuê"));

        RentRequest rentRequest = RentRequest.builder()
                .room(room)
                .tenant(tenant)
                .visitDate(request.visitDate())
                .visitTime(request.visitTime())
                .status(STATUS_PENDING)
                .build();

        RentRequest saved = rentRequestRepository.save(rentRequest);

        notificationService.notifyUserWithTemplate(
                room.getHouse() != null && room.getHouse().getLandlord() != null ? room.getHouse().getLandlord().getUser() : null,
                tenant.getUser(),
                "VIEWING_REQUESTED",
                saved.getRequestId(),
                "noti.viewing.requested.title",
                "noti.viewing.requested.message",
                tenant.getFullname(),
                room.getName()
        );

        return mapToResponse(saved);
    }

    public List<ViewingResponse> getMyViewings() {
        Integer userId = authService.getCurrentUserId();
        Tenant tenant = tenantRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin người thuê"));

        return rentRequestRepository.findByTenant_TenantIdOrderByVisitDateAscVisitTimeAsc(tenant.getTenantId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ViewingResponse> getLandlordViewings() {
        Integer landlordId = authService.getCurrentLandlordId();
        return rentRequestRepository.findByRoom_House_Landlord_LandlordIdOrderByVisitDateAscVisitTimeAsc(landlordId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ViewingResponse cancelByTenant(Integer requestId) {
        RentRequest rentRequest = rentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lịch xem phòng không tồn tại"));

        Integer userId = authService.getCurrentUserId();
        Tenant tenant = tenantRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin người thuê"));

        if (!rentRequest.getTenant().getTenantId().equals(tenant.getTenantId())) {
            throw new IllegalArgumentException("Bạn không có quyền hủy lịch này");
        }

        if (STATUS_CONTRACTED.equals(rentRequest.getStatus())) {
            throw new IllegalArgumentException("Lịch xem đã được tạo hợp đồng, không thể hủy");
        }

        rentRequest.setStatus(STATUS_CANCELED);
        RentRequest saved = rentRequestRepository.save(rentRequest);

        notificationService.notifyUserWithTemplate(
                rentRequest.getRoom() != null && rentRequest.getRoom().getHouse() != null
                        && rentRequest.getRoom().getHouse().getLandlord() != null
                        ? rentRequest.getRoom().getHouse().getLandlord().getUser()
                        : null,
                tenant.getUser(),
                "VIEWING_CANCELED",
                rentRequest.getRequestId(),
                "noti.viewing.canceled.title",
                "noti.viewing.canceled.message",
                tenant.getFullname(),
                rentRequest.getRoom() != null ? rentRequest.getRoom().getName() : ""
        );

        return mapToResponse(saved);
    }

    public ViewingResponse cancelByLandlord(Integer requestId) {
        RentRequest rentRequest = rentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lịch xem phòng không tồn tại"));

        Integer landlordId = authService.getCurrentLandlordId();
        if (rentRequest.getRoom() == null || rentRequest.getRoom().getHouse() == null
                || rentRequest.getRoom().getHouse().getLandlord() == null
                || !rentRequest.getRoom().getHouse().getLandlord().getLandlordId().equals(landlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền hủy lịch này");
        }

        if (STATUS_CONTRACTED.equals(rentRequest.getStatus())) {
            throw new IllegalArgumentException("Lịch xem đã được tạo hợp đồng, không thể hủy");
        }

        rentRequest.setStatus(STATUS_CANCELED);
        RentRequest saved = rentRequestRepository.save(rentRequest);

        notificationService.notifyUserWithTemplate(
                rentRequest.getTenant() != null ? rentRequest.getTenant().getUser() : null,
                rentRequest.getRoom() != null && rentRequest.getRoom().getHouse() != null
                        && rentRequest.getRoom().getHouse().getLandlord() != null
                        ? rentRequest.getRoom().getHouse().getLandlord().getUser()
                        : null,
                "VIEWING_CANCELED",
                rentRequest.getRequestId(),
                "noti.viewing.canceled_by_landlord.title",
                "noti.viewing.canceled_by_landlord.message",
                rentRequest.getRoom() != null ? rentRequest.getRoom().getName() : ""
        );

        return mapToResponse(saved);
    }

    public ViewingResponse approveByLandlord(Integer requestId) {
        RentRequest rentRequest = rentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lịch xem phòng không tồn tại"));

        Integer landlordId = authService.getCurrentLandlordId();
        if (rentRequest.getRoom() == null || rentRequest.getRoom().getHouse() == null
                || rentRequest.getRoom().getHouse().getLandlord() == null
                || !rentRequest.getRoom().getHouse().getLandlord().getLandlordId().equals(landlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền xác nhận lịch này");
        }

        if (!STATUS_PENDING.equals(rentRequest.getStatus())) {
            throw new IllegalArgumentException("Yêu cầu này đã được xử lý");
        }

        rentRequest.setStatus(STATUS_APPROVED);
        RentRequest saved = rentRequestRepository.save(rentRequest);

        notificationService.notifyUserWithTemplate(
                rentRequest.getTenant() != null ? rentRequest.getTenant().getUser() : null,
                rentRequest.getRoom() != null && rentRequest.getRoom().getHouse() != null
                        && rentRequest.getRoom().getHouse().getLandlord() != null
                        ? rentRequest.getRoom().getHouse().getLandlord().getUser()
                        : null,
                "VIEWING_APPROVED",
                rentRequest.getRequestId(),
                "noti.viewing.approved.title",
                "noti.viewing.approved.message",
                rentRequest.getRoom() != null ? rentRequest.getRoom().getName() : ""
        );

        if (saved.getTenant() != null && saved.getTenant().getUser() != null) {
            esmsSmsSender.sendViewingApprovedSms(
                    saved.getTenant().getUser().getPhone(),
                    saved.getRoom() != null ? saved.getRoom().getName() : "",
                    saved.getVisitDate(),
                    saved.getVisitTime()
            );
        }

        return mapToResponse(saved);
    }

    public ViewingResponse rejectByLandlord(Integer requestId) {
        RentRequest rentRequest = rentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lịch xem phòng không tồn tại"));

        Integer landlordId = authService.getCurrentLandlordId();
        if (rentRequest.getRoom() == null || rentRequest.getRoom().getHouse() == null
                || rentRequest.getRoom().getHouse().getLandlord() == null
                || !rentRequest.getRoom().getHouse().getLandlord().getLandlordId().equals(landlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền từ chối lịch này");
        }

        if (!STATUS_PENDING.equals(rentRequest.getStatus())) {
            throw new IllegalArgumentException("Yêu cầu này đã được xử lý");
        }

        rentRequest.setStatus(STATUS_CANCELED);
        RentRequest saved = rentRequestRepository.save(rentRequest);

        notificationService.notifyUserWithTemplate(
                rentRequest.getTenant() != null ? rentRequest.getTenant().getUser() : null,
                rentRequest.getRoom() != null && rentRequest.getRoom().getHouse() != null
                        && rentRequest.getRoom().getHouse().getLandlord() != null
                        ? rentRequest.getRoom().getHouse().getLandlord().getUser()
                        : null,
                "VIEWING_REJECTED",
                rentRequest.getRequestId(),
                "noti.viewing.rejected.title",
                "noti.viewing.rejected.message",
                rentRequest.getRoom() != null ? rentRequest.getRoom().getName() : ""
        );

        return mapToResponse(saved);
    }

    public void cancelScheduledByRoom(Integer roomId) {
        List<RentRequest> requests = rentRequestRepository.findByRoom_RoomIdAndStatusIn(
                roomId,
                List.of(STATUS_PENDING, STATUS_SCHEDULED, STATUS_APPROVED, STATUS_CONTRACT_PENDING)
        );
        if (requests.isEmpty()) {
            return;
        }
        for (RentRequest request : requests) {
            request.setStatus(STATUS_CANCELED);
            
            User landlordUser = null;
            if (request.getRoom() != null && request.getRoom().getHouse() != null && request.getRoom().getHouse().getLandlord() != null) {
                landlordUser = request.getRoom().getHouse().getLandlord().getUser();
            }
            notificationService.notifyUserWithTemplate(
                    request.getTenant() != null ? request.getTenant().getUser() : null,
                    landlordUser,
                    "VIEWING_CANCELED",
                    request.getRequestId(),
                    "noti.viewing.canceled_by_system.tenant.title",
                    "noti.viewing.canceled_by_system.tenant.message",
                    request.getRoom() != null ? request.getRoom().getName() : ""
            );
        }
        rentRequestRepository.saveAll(requests);
    }

    public void markContracted(Integer requestId) {
        RentRequest rentRequest = rentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lịch xem phòng không tồn tại"));
        rentRequest.setStatus(STATUS_CONTRACTED);
        rentRequestRepository.save(rentRequest);
    }

    public void cancelOtherViewingsForTenant(Integer tenantId, Integer keepRequestId) {
        if (tenantId == null) {
            return;
        }
        List<RentRequest> requests = rentRequestRepository.findByTenant_TenantId(tenantId);
        List<RentRequest> toCancel = requests.stream()
                .filter(req -> keepRequestId == null || !keepRequestId.equals(req.getRequestId()))
                .filter(req -> List.of(STATUS_PENDING, STATUS_APPROVED, STATUS_SCHEDULED, STATUS_CONTRACT_PENDING)
                        .contains(req.getStatus()))
                .peek(req -> {
                    req.setStatus(STATUS_CANCELED);
                    
                    User tenantUser = req.getTenant() != null ? req.getTenant().getUser() : null;
                    User landlordUser = null;
                    if (req.getRoom() != null && req.getRoom().getHouse() != null && req.getRoom().getHouse().getLandlord() != null) {
                        landlordUser = req.getRoom().getHouse().getLandlord().getUser();
                    }
                    String tenantName = req.getTenant() != null ? req.getTenant().getFullname() : "Khách thuê";
                    
                    if (landlordUser != null) {
                        notificationService.notifyUserWithTemplate(
                                landlordUser,
                                tenantUser,
                                "VIEWING_CANCELED",
                                req.getRequestId(),
                                "noti.viewing.canceled_by_system.landlord.title",
                                "noti.viewing.canceled_by_system.landlord.message",
                                tenantName,
                                req.getRoom() != null ? req.getRoom().getName() : ""
                        );
                    }
                })
                .collect(Collectors.toList());
        if (!toCancel.isEmpty()) {
            rentRequestRepository.saveAll(toCancel);
        }
    }

    private ViewingResponse mapToResponse(RentRequest request) {
        String houseName = "";
        String addressLine = "";
        String landlordName = "";
        String landlordPhone = "";
        if (request.getRoom() != null && request.getRoom().getHouse() != null) {
            houseName = request.getRoom().getHouse().getName();
            addressLine = request.getRoom().getHouse().getAddressLine();
            if (request.getRoom().getHouse().getLandlord() != null) {
                landlordName = request.getRoom().getHouse().getLandlord().getBrandName();
                if (request.getRoom().getHouse().getLandlord().getUser() != null) {
                    landlordPhone = request.getRoom().getHouse().getLandlord().getUser().getPhone();
                }
            }
        }

        String tenantName = request.getTenant() != null ? request.getTenant().getFullname() : "";
        String tenantPhone = (request.getTenant() != null && request.getTenant().getUser() != null)
                ? request.getTenant().getUser().getPhone()
                : "";

        return ViewingResponse.builder()
                .requestId(request.getRequestId())
                .roomId(request.getRoom() != null ? request.getRoom().getRoomId() : null)
                .roomName(request.getRoom() != null ? request.getRoom().getName() : null)
                .houseName(houseName)
                .addressLine(addressLine)
                .tenantName(tenantName)
                .tenantPhone(tenantPhone)
                .landlordName(landlordName)
                .landlordPhone(landlordPhone)
                .visitDate(request.getVisitDate())
                .visitTime(request.getVisitTime())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
