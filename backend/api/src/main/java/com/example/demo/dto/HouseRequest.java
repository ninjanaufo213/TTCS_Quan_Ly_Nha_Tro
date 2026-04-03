package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record HouseRequest(
        String name,
        @JsonProperty("floor_count")
        Integer floorCount,
        @JsonProperty("address_line")
        String addressLine,
        String ward,
        String district
) {}
