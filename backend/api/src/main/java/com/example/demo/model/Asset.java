package com.example.demo.model;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    private Integer assetId;
    private Room room;
    private LocalDateTime createdAt;
}
