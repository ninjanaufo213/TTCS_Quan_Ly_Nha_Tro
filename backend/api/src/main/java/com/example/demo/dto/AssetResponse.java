package com.example.demo.dto;

import java.time.LocalDateTime;

public record AssetResponse(
        Integer assetId,
        Integer roomId,
        String name,
        String imageUrl,
        LocalDateTime createdAt
) {}

