package com.example.demo.service;

import com.example.demo.dto.AdminUserResponse;
import com.example.demo.dto.AdminUserUpdateRequest;
import com.example.demo.dto.AreaDemandResponse;
import com.example.demo.model.User;
import com.example.demo.repository.ListingRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final ListingRepository listingRepository;

    public AdminService(UserRepository userRepository, AuthService authService, ListingRepository listingRepository) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.listingRepository = listingRepository;
    }

    public List<AdminUserResponse> getAllUsers() {
        assertAdmin();
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse toggleUserStatus(Integer userId) {
        assertAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tìm thấy"));

        boolean current = user.getIsActive() == null || user.getIsActive();
        user.setIsActive(!current);
        userRepository.save(user);

        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse updateUser(Integer userId, AdminUserUpdateRequest request) {
        assertAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tìm thấy"));

        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
                if (!existing.getUserId().equals(userId)) {
                    throw new IllegalArgumentException("Email đã tồn tại");
                }
            });
            user.setEmail(request.getEmail());
        }

        if (request.getPhone() != null && !request.getPhone().equals(user.getPhone())) {
            userRepository.findByPhone(request.getPhone()).ifPresent(existing -> {
                if (!existing.getUserId().equals(userId)) {
                    throw new IllegalArgumentException("Số điện thoại đã tồn tại");
                }
            });
            user.setPhone(request.getPhone());
        }

        if (request.getRole() != null && !request.getRole().equalsIgnoreCase(user.getRole())) {
            String role = request.getRole().toUpperCase();
            if (!role.equals("ADMIN") && !role.equals("LANDLORD") && !role.equals("TENANT")) {
                throw new IllegalArgumentException("Vai trò không hợp lệ");
            }
            user.setRole(role);
        }

        userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public void deleteUser(Integer userId) {
        assertAdmin();
        Integer currentUserId = authService.getCurrentUserId();
        if (userId != null && userId.equals(currentUserId)) {
            throw new IllegalArgumentException("Không thể xóa tài khoản đang đăng nhập");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tìm thấy"));
        userRepository.delete(user);
    }

    // ===== AREA DEMAND STATS =====
    public List<AreaDemandResponse> getAreaDemandStats() {
        assertAdmin();

        List<Object[]> districtRows = listingRepository.aggregateByDistrict();
        List<Object[]> wardRows = listingRepository.topWardPerDistrict();

        // Build ward lookup: district -> top ward
        Map<String, String> topWardMap = new LinkedHashMap<>();
        for (Object[] row : wardRows) {
            String district = (String) row[0];
            String ward = (String) row[1];
            topWardMap.putIfAbsent(district, ward); // first one per district = highest count
        }

        // Color palette for visual distinction
        String[] colors = {
            "#e94560", "#f5a623", "#0f3460", "#7b61ff",
            "#00c9a7", "#febc2e", "#ff6b6b", "#43b89c",
            "#1677ff", "#722ed1"
        };

        List<AreaDemandResponse> result = new ArrayList<>();

        for (int i = 0; i < districtRows.size(); i++) {
            Object[] row = districtRows.get(i);
            String district = (String) row[0];
            Long totalViews = ((Number) row[1]).longValue();
            Long listings = ((Number) row[2]).longValue();
            Double avgPrice = ((Number) row[3]).doubleValue();

            result.add(AreaDemandResponse.builder()
                    .district(district)
                    .ward(topWardMap.getOrDefault(district, ""))
                    .totalViews(totalViews)
                    .listings(listings)
                    .avgPrice(avgPrice)
                    .color(colors[i % colors.length])
                    .build());
        }

        return result;
    }

    private void assertAdmin() {
        Integer currentUserId = authService.getCurrentUserId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalStateException("User không tìm thấy"));
        if (user.getRole() == null || !"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new SecurityException("Bạn không có quyền truy cập");
        }
    }

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .isActive(user.getIsActive() == null || user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
