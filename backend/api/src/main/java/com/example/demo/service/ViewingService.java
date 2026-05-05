package com.example.demo.service;

import com.example.demo.dto.ViewingRequest;
import com.example.demo.dto.ViewingResponse;
import com.example.demo.model.RentRequest;
import com.example.demo.model.Room;
import com.example.demo.model.Tenant;
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

    public ViewingService(RentRequestRepository rentRequestRepository,
                          RoomRepository roomRepository,
                          TenantRepository tenantRepository,
                          AuthService authService,
                          NotificationService notificationService) {
        this.rentRequestRepository = rentRequestRepository;
        this.roomRepository = roomRepository;
        this.tenantRepository = tenantRepository;
        this.authService = authService;
        this.notificationService = notificationService;
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
                .status(STATUS_APPROVED)
                .build();

        RentRequest saved = rentRequestRepository.save(rentRequest);

        notificationService.notifyUser(
                room.getHouse() != null && room.getHouse().getLandlord() != null ? room.getHouse().getLandlord().getUser() : null,
                tenant.getUser(),
                "Lịch xem phòng mới",
                "Bạn có lịch xem phòng mới từ " + tenant.getFullname() + " cho phòng " + room.getName(),
                "VIEWING_CREATED",
                saved.getRequestId()
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

        notificationService.notifyUser(
                rentRequest.getRoom() != null && rentRequest.getRoom().getHouse() != null
                        && rentRequest.getRoom().getHouse().getLandlord() != null
                        ? rentRequest.getRoom().getHouse().getLandlord().getUser()
                        : null,
                tenant.getUser(),
                "Hủy lịch xem phòng",
                tenant.getFullname() + " đã hủy lịch xem phòng " + (rentRequest.getRoom() != null ? rentRequest.getRoom().getName() : ""),
                "VIEWING_CANCELED",
                rentRequest.getRequestId()
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

        notificationService.notifyUser(
                rentRequest.getTenant() != null ? rentRequest.getTenant().getUser() : null,
                rentRequest.getRoom() != null && rentRequest.getRoom().getHouse() != null
                        && rentRequest.getRoom().getHouse().getLandlord() != null
                        ? rentRequest.getRoom().getHouse().getLandlord().getUser()
                        : null,
                "Hủy lịch xem phòng",
                "Chủ trọ đã hủy lịch xem phòng " + (rentRequest.getRoom() != null ? rentRequest.getRoom().getName() : ""),
                "VIEWING_CANCELED",
                rentRequest.getRequestId()
        );

        return mapToResponse(saved);
    }

    public void cancelScheduledByRoom(Integer roomId) {
        List<RentRequest> requests = rentRequestRepository.findByRoom_RoomIdAndStatusIn(
                roomId,
                List.of(STATUS_SCHEDULED, STATUS_APPROVED, STATUS_CONTRACT_PENDING)
        );
        if (requests.isEmpty()) {
            return;
        }
        for (RentRequest request : requests) {
            request.setStatus(STATUS_CANCELED);
        }
        rentRequestRepository.saveAll(requests);
    }

    public void markContracted(Integer requestId) {
        RentRequest rentRequest = rentRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Lịch xem phòng không tồn tại"));
        rentRequest.setStatus(STATUS_CONTRACTED);
        rentRequestRepository.save(rentRequest);
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

