package com.example.demo.dto;

public record RoomImageDto(
        Integer imageId,
        String imageUrl,
        Boolean isThumbnail
) {}
