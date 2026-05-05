package com.example.demo.controller;

import com.example.demo.model.RentRequest;
import com.example.demo.model.Room;
import com.example.demo.model.Tenant;
import com.example.demo.repository.RentRequestRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.TenantRepository;
import com.example.demo.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
public class RentRequestController {

    private final RentRequestRepository rentRequestRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final AuthService authService;

    public RentRequestController(RentRequestRepository rentRequestRepository,
                                 RoomRepository roomRepository,
                                 TenantRepository tenantRepository,
                                 AuthService authService) {
        this.rentRequestRepository = rentRequestRepository;
        this.roomRepository = roomRepository;
        this.tenantRepository = tenantRepository;
        this.authService = authService;
    }

    /**
     * Tenant gửi yêu cầu xem phòng (qua listing → roomId)
     * POST /api/tenant/rent-requests
     */
    @PostMapping("/api/tenant/rent-requests")
    public ResponseEntity<?> createRequest(@RequestBody Map<String, Object> body) {
        try {
            Integer userId = authService.getCurrentUserId();
            Tenant tenant = tenantRepository.findByUser_UserId(userId)
                    .orElseThrow(() -> new IllegalStateException("Tài khoản này không phải Tenant"));

            Integer roomId = (Integer) body.get("room_id");
            Room room = roomRepository.findById(roomId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng"));

            String expectedDateStr = (String) body.get("expected_start_date");
            LocalDate expectedDate = expectedDateStr != null ? LocalDate.parse(expectedDateStr) : null;

            RentRequest request = RentRequest.builder()
                    .tenant(tenant)
                    .room(room)
                    .visitDate(expectedDate)
                    .status("PENDING")
                    .build();

            RentRequest saved = rentRequestRepository.save(request);
            return ResponseEntity.ok(Map.of(
                "request_id", saved.getRequestId(),
                "message", "Gửi yêu cầu xem phòng thành công!"
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("detail", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("detail", "Lỗi: " + e.getMessage()));
        }
    }

    /**
     * Landlord xem danh sách yêu cầu xem phòng của mình
     * GET /api/landlord/rent-requests
     */
    @GetMapping("/api/landlord/rent-requests")
    public ResponseEntity<?> getLandlordRequests() {
        try {
            Integer landlordId = authService.getCurrentLandlordId();
            List<RentRequest> requests = rentRequestRepository.findByRoom_House_Landlord_LandlordId(landlordId);

            List<Map<String, Object>> result = requests.stream().map(r -> {
                Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("request_id", r.getRequestId());
                m.put("status", r.getStatus());
                m.put("expected_start_date", r.getVisitDate());
                m.put("created_at", r.getCreatedAt());
                if (r.getTenant() != null) {
                    m.put("tenant_name", r.getTenant().getFullname());
                    m.put("tenant_phone", r.getTenant().getUser() != null ? r.getTenant().getUser().getPhone() : "");
                }
                if (r.getRoom() != null) {
                    m.put("room_name", r.getRoom().getName());
                    m.put("room_id", r.getRoom().getRoomId());
                    if (r.getRoom().getHouse() != null) {
                        m.put("house_name", r.getRoom().getHouse().getName());
                    }
                }
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("detail", "Lỗi: " + e.getMessage()));
        }
    }

    /**
     * Landlord cập nhật trạng thái yêu cầu (CONFIRMED / CANCELLED)
     * PATCH /api/landlord/rent-requests/{id}/status
     */
    @PatchMapping("/api/landlord/rent-requests/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            Integer landlordId = authService.getCurrentLandlordId();
            RentRequest request = rentRequestRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu"));

            // Verify ownership
            if (!request.getRoom().getHouse().getLandlord().getLandlordId().equals(landlordId)) {
                return ResponseEntity.status(403).body(Map.of("detail", "Bạn không có quyền cập nhật yêu cầu này"));
            }

            String newStatus = body.get("status");
            if (!"CONFIRMED".equals(newStatus) && !"CANCELLED".equals(newStatus)) {
                return ResponseEntity.badRequest().body(Map.of("detail", "Trạng thái không hợp lệ"));
            }

            request.setStatus(newStatus);
            rentRequestRepository.save(request);
            return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái thành công", "status", newStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("detail", "Lỗi: " + e.getMessage()));
        }
    }
}
