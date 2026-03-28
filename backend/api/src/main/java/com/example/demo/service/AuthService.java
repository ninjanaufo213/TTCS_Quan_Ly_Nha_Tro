package com.example.demo.service;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.model.Landlord;
import com.example.demo.model.Tenant;
import com.example.demo.model.User;
import com.example.demo.repository.LandlordRepository;
import com.example.demo.repository.TenantRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final LandlordRepository landlordRepository;
    private final TenantRepository tenantRepository;

    public AuthService(UserRepository userRepository, LandlordRepository landlordRepository, TenantRepository tenantRepository) {
        this.userRepository = userRepository;
        this.landlordRepository = landlordRepository;
        this.tenantRepository = tenantRepository;
    }

    public LoginResponse authenticate(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Email không tồn tại trong hệ thống");
        }

        User user = userOpt.get();

        if (!user.getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu không chính xác");
        }
        
        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new IllegalStateException("Tài khoản đã bị khóa");
        }

        return LoginResponse.builder()
                .success(true)
                .message("Đăng nhập thành công")
                .userId(user.getUserId())
                .role(user.getRole())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new IllegalArgumentException("Phone already registered");
        }

        String role = request.getRole() != null ? request.getRole().toUpperCase() : "LANDLORD"; // Default to LANDLORD
        
        User user = User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(request.getPassword())
                .role(role)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        if ("TENANT".equals(role)) {
            Tenant tenant = Tenant.builder()
                    .user(user)
                    .fullname(request.getFullname())
                    // Use phone as temporary identity card for fallback
                    .identityCard(request.getPhone()) 
                    .build();
            tenantRepository.save(tenant);
        } else {
            // Assume LANDLORD or ADMIN
            Landlord landlord = Landlord.builder()
                    .user(user)
                    .brandName(request.getFullname())
                    .build();
            landlordRepository.save(landlord);
        }
    }
}
