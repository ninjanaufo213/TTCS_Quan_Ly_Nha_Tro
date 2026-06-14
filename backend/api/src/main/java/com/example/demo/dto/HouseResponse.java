package com.example.demo.dto;

import java.time.LocalDateTime;

public record HouseResponse(
        Integer houseId,
        Integer landlordId,
        String landlordName,
        String landlordPhone,
        String name,
        Integer floorCount,
        String addressLine,
        String ward,
        String district,
        String province,
        Double latitude,
        Double longitude,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
