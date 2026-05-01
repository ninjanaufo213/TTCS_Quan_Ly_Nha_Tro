package com.example.demo.controller;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.UpdateProfileRequest;
import com.example.demo.dto.UserResponse;
import com.example.demo.model.User;
import com.example.demo.model.Tenant;
import com.example.demo.model.Landlord;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.TenantRepository;
import com.example.demo.repository.LandlordRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // Match other controllers
public class UserController {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final LandlordRepository landlordRepository;

    public UserController(UserRepository userRepository, TenantRepository tenantRepository, LandlordRepository landlordRepository) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.landlordRepository = landlordRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserProfile(@PathVariable Integer id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();
        
        String fullname = "No Name";
        Landlord landlordProfile = null;
        if ("TENANT".equalsIgnoreCase(user.getRole()) && user.getTenant() != null) {
            fullname = user.getTenant().getFullname();
        } else if (user.getLandlord() != null) {
            landlordProfile = user.getLandlord();
            fullname = landlordProfile.getBrandName();
        }

        UserResponse response = UserResponse.builder()
                .owner_id(user.getUserId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(new UserResponse.RoleWrapper(user.getRole()))
                .fullname(fullname)
                .bankAccountNumber(landlordProfile != null ? landlordProfile.getBankAccountNumber() : null)
                .bankName(landlordProfile != null ? landlordProfile.getBankName() : null)
                .bankAccountName(landlordProfile != null ? landlordProfile.getBankAccountName() : null)
                .bankCode(landlordProfile != null ? landlordProfile.getBankCode() : null)
                .is_active(user.getIsActive())
                .created_at(user.getCreatedAt())
                .build();
                
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Integer id, @RequestBody UpdateProfileRequest request) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();
        
        if (request.getPhone() != null && !request.getPhone().equals(user.getPhone())) {
            if (userRepository.findByPhone(request.getPhone()).isPresent()) {
                // Return 400 with 'Phone already registered' matching frontend logic
                return ResponseEntity.badRequest().body(java.util.Map.of("detail", "Phone already registered"));
            }
            user.setPhone(request.getPhone());
        }
        
        userRepository.save(user);

        if (request.getFullname() != null) {
            if ("TENANT".equalsIgnoreCase(user.getRole()) && user.getTenant() != null) {
                Tenant tenant = user.getTenant();
                tenant.setFullname(request.getFullname());
                tenantRepository.save(tenant);
            } else if (user.getLandlord() != null) {
                Landlord landlord = user.getLandlord();
                landlord.setBrandName(request.getFullname());
                landlordRepository.save(landlord);
            }
        }

        if (user.getLandlord() != null) {
            Landlord landlord = user.getLandlord();
            if (request.getBankAccountNumber() != null) {
                landlord.setBankAccountNumber(request.getBankAccountNumber());
            }
            if (request.getBankName() != null) {
                landlord.setBankName(request.getBankName());
            }
            if (request.getBankAccountName() != null) {
                landlord.setBankAccountName(request.getBankAccountName());
            }
            if (request.getBankCode() != null) {
                landlord.setBankCode(request.getBankCode());
            }
            landlordRepository.save(landlord);
        }
        
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Cập nhật thành công"));
    }

    @PatchMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Integer id, @RequestBody ChangePasswordRequest request) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();
        if (!user.getPassword().equals(request.getOld_password())) {
            return ResponseEntity.badRequest().body(java.util.Map.of("detail", "Mật khẩu cũ không chính xác"));
        }
        
        user.setPassword(request.getNew_password());
        userRepository.save(user);
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Đổi mật khẩu thành công"));
    }
}
