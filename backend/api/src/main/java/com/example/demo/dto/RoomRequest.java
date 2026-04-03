package com.example.demo.dto;

import java.math.BigDecimal;

public record RoomRequest(
        Integer house_id,
        String name,
        BigDecimal price,
        Integer capacity,
        Boolean is_available,
        String description
) {}
