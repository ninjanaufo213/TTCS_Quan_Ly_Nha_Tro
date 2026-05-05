package com.example.demo.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HouseImage {

    private Integer imageId;
    private House house;
    private String imageUrl;
    private Boolean isThumbnail;
    private LocalDateTime createdAt;
}
