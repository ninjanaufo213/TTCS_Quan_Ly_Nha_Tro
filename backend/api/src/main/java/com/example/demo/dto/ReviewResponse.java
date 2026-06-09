package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    @JsonProperty("review_id")
    private Integer reviewId;

    @JsonProperty("room_id")
    private Integer roomId;

    @JsonProperty("room_name")
    private String roomName;

    @JsonProperty("house_name")
    private String houseName;

    @JsonProperty("tenant_id")
    private Integer tenantId;

    @JsonProperty("tenant_name")
    private String tenantName;

    @JsonProperty("rating")
    private Integer rating;

    @JsonProperty("comment")
    private String comment;

    @JsonProperty("landlord_reply")
    private String landlordReply;

    @JsonProperty("landlord_replied_at")
    private LocalDateTime landlordRepliedAt;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
