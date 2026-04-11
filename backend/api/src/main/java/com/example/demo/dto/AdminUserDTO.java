package com.example.demo.dto;

import java.time.LocalDateTime;

public record AdminUserDTO(
    Integer userId,
    String role,
    String email,
    String phone,
    Boolean isActive,
    Boolean isVerified,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
