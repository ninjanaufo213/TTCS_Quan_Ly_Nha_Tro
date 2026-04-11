package com.example.demo.service;

import com.example.demo.dto.AdminUserDTO;
import com.example.demo.dto.AdminUserUpdateDTO;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminUserService {
    
    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<AdminUserDTO> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList());
    }

    public void toggleUserStatus(Integer userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
    }

    public void toggleUserVerification(Integer userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        
        user.setIsVerified(user.getIsVerified() == null ? true : !user.getIsVerified());
        userRepository.save(user);
    }

    public void updateUser(Integer userId, AdminUserUpdateDTO updateDTO) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
            
        if (updateDTO.email() != null && !updateDTO.email().trim().isEmpty()) {
            user.setEmail(updateDTO.email());
        }
        if (updateDTO.phone() != null && !updateDTO.phone().trim().isEmpty()) {
            user.setPhone(updateDTO.phone());
        }
        if (updateDTO.role() != null && !updateDTO.role().trim().isEmpty()) {
            user.setRole(updateDTO.role());
        }
        
        userRepository.save(user);
    }
    
    public void deleteUser(Integer userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("Không tìm thấy người dùng");
        }
        userRepository.deleteById(userId);
    }

    private AdminUserDTO mapToDTO(User user) {
        return new AdminUserDTO(
            user.getUserId(),
            user.getRole(),
            user.getEmail(),
            user.getPhone(),
            user.getIsActive(),
            user.getIsVerified(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
