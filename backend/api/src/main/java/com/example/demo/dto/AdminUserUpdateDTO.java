package com.example.demo.dto;

public record AdminUserUpdateDTO(
    String role,
    String email,
    String phone
) {}
