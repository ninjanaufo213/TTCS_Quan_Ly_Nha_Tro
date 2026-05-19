package com.example.demo.dto;

import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
public record ContractExtensionRequestResponse(
        Integer extensionRequestId,
        Integer rentedRoomId,
        Integer roomId,
        String roomName,
        String houseName,
        String tenantName,
        String tenantPhone,
        LocalDate currentEndDate,
        LocalDate requestedEndDate,
        String status,
        LocalDateTime createdAt
) {
}

