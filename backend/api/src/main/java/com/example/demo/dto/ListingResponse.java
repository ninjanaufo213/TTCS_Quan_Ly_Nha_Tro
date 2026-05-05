package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingResponse {
    private Integer listingId;
    private String title;
    private String description;
    private Integer viewsCount;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    
    private RoomInfo room;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoomInfo {
        private Integer roomId;
        private Integer houseId;
        private String houseName;
        private String name;
        private BigDecimal price;
        private Double area;
        private Integer capacity;
        private Boolean isAvailable;
        private String description;
        private String district;
        private String ward;
        private String address;
        private String landlordName;
        private String landlordPhone;
        private java.util.List<String> imageUrls;
    }
}
