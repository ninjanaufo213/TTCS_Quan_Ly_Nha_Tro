package com.example.demo.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
public record ContractRequestResponse(
        Integer contractRequestId,
        Integer requestId,
        Integer roomId,
        String roomName,
        String houseName,
        String tenantName,
        String tenantPhone,
        Integer numberOfTenants,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal monthlyRent,
        BigDecimal deposit,
        BigDecimal waterPrice,
        BigDecimal internetPrice,
        BigDecimal generalPrice,
        Integer initialElectricityNum,
        BigDecimal electricityUnitPrice,
        String contractUrl,
        String landlordSignature,
        String tenantSignature,
        LocalDateTime landlordSignedAt,
        LocalDateTime tenantSignedAt,
        String status,
        LocalDateTime createdAt
) {
}

