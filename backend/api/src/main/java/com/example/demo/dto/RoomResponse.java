package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record RoomResponse(
        Integer roomId,
        Integer houseId,
        String name,
        BigDecimal price,
        Integer capacity,
        Boolean isAvailable,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<RoomImageDto> images
) {}
