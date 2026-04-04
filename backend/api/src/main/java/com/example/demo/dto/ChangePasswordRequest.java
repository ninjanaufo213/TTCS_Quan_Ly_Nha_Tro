package com.example.demo.dto;

import lombok.Data;

@Data
public class ChangePasswordRequest {
    private String old_password;
    private String new_password;
}
