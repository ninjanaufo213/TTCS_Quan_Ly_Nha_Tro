package com.example.demo.service;

import com.example.demo.dto.AdminUserResponse;
import com.example.demo.dto.AdminUserUpdateRequest;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final AuthService authService;

    public AdminService(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
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

