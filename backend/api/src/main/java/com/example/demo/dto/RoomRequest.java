package com.example.demo.dto;

import java.math.BigDecimal;

public record RoomRequest(
        Integer house_id,
        String name,
        BigDecimal price,
        Integer capacity,
        Double area,
        Boolean is_available,
        String description,
        BigDecimal water_price,
        BigDecimal internet_price,
        BigDecimal general_price,
        BigDecimal electricity_price
) {}
