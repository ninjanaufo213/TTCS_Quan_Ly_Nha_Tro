package com.example.demo.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullname;
    private String phone;
    private String bankAccountNumber;
    private String bankName;
    private String bankAccountName;
    private String bankCode;
}
