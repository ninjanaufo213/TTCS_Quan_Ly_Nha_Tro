package com.example.demo.dto;

public record HouseImageDto(
        Integer imageId,
        String imageUrl,
        Boolean isThumbnail
) {}
