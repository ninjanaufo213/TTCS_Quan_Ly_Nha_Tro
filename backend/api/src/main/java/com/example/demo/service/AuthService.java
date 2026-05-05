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
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;
import jakarta.servlet.http.HttpServletRequest;

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
                    .bankAccountNumber(request.getBankAccountNumber())
                    .bankName(request.getBankName())
                    .bankAccountName(request.getBankAccountName())
                    .bankCode(request.getBankCode())
                    .build();
            landlordRepository.save(landlord);
        }
    }

    /**
     * Get current user's landlord ID from request header
     * Expected header: X-User-Email
     */
    public Integer getCurrentLandlordId() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                throw new IllegalStateException("Không thể lấy request context");
            }

            HttpServletRequest request = attributes.getRequest();
            String userEmail = request.getHeader("X-User-Email");

            if (userEmail == null || userEmail.isEmpty()) {
                throw new IllegalStateException("Header X-User-Email không tìm thấy");
            }

            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isEmpty()) {
                throw new IllegalStateException("User không tìm thấy");
            }

            User user = userOpt.get();
            Optional<Landlord> landlordOpt = landlordRepository.findByUser_UserId(user.getUserId());

            if (landlordOpt.isEmpty()) {
                throw new IllegalStateException("Landlord không tìm thấy");
            }

            return landlordOpt.get().getLandlordId();
        } catch (Exception e) {
            throw new IllegalStateException("Lỗi khi lấy thông tin landlord: " + e.getMessage());
        }
    }

    /**
     * Get current user's ID from request header
     */
    public Integer getCurrentUserId() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                throw new IllegalStateException("Không thể lấy request context");
            }

            HttpServletRequest request = attributes.getRequest();
            String userEmail = request.getHeader("X-User-Email");

            if (userEmail == null || userEmail.isEmpty()) {
                throw new IllegalStateException("Header X-User-Email không tìm thấy");
            }

            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isEmpty()) {
                throw new IllegalStateException("User không tìm thấy");
            }

            return userOpt.get().getUserId();
        } catch (Exception e) {
            throw new IllegalStateException("Lỗi khi lấy thông tin user: " + e.getMessage());
        }
    }

    /**
     * Get current tenant ID from request header
     * Expected header: X-User-Email
     */
    public Integer getCurrentTenantId() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                throw new IllegalStateException("Không thể lấy request context");
            }

            HttpServletRequest request = attributes.getRequest();
            String userEmail = request.getHeader("X-User-Email");

            if (userEmail == null || userEmail.isEmpty()) {
                throw new IllegalStateException("Header X-User-Email không tìm thấy");
            }

            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isEmpty()) {
                throw new IllegalStateException("User không tìm thấy");
            }

            User user = userOpt.get();
            Optional<Tenant> tenantOpt = tenantRepository.findByUser_UserId(user.getUserId());

            if (tenantOpt.isEmpty()) {
                throw new IllegalStateException("Tenant không tìm thấy");
            }

            return tenantOpt.get().getTenantId();
        } catch (Exception e) {
            throw new IllegalStateException("Lỗi khi lấy thông tin tenant: " + e.getMessage());
        }
    }
}
