package com.example.demo.dto;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record NotificationResponse(
        Integer notificationId,
        String title,
        String message,
        String type,
        Boolean isRead,
        Integer referenceId,
        LocalDateTime createdAt
) {
}

