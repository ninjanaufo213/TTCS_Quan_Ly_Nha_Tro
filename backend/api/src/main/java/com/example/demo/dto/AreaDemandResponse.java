package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AreaDemandResponse {
    private String district;
    private String ward;
    private Long totalViews;
    private Long listings;
    private Double avgPrice;
    private String trend;
    private String color;
}
