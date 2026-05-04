package com.example.demo.dto;

import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Builder
public record ViewingResponse(
        Integer requestId,
        Integer roomId,
        String roomName,
        String houseName,
        String addressLine,
        String tenantName,
        String tenantPhone,
        String landlordName,
        String landlordPhone,
        LocalDate visitDate,
        LocalTime visitTime,
        String status,
        LocalDateTime createdAt
) {
}

