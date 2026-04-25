package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {

    @JsonProperty("invoice_id")
    private Integer invoiceId;

    @JsonProperty("rr_id")
    private Integer rrId;

    @JsonProperty("rented_room")
    private InvoiceRentedRoom rentedRoom;

    @JsonProperty("price")
    private BigDecimal price;

    @JsonProperty("water_price")
    private BigDecimal waterPrice;

    @JsonProperty("internet_price")
    private BigDecimal internetPrice;

    @JsonProperty("general_price")
    private BigDecimal generalPrice;

    @JsonProperty("electricity_price")
    private BigDecimal electricityPrice;

    @JsonProperty("electricity_num")
    private Integer electricityNum;

    @JsonProperty("water_num")
    private Integer waterNum;

    @JsonProperty("total_amount")
    private BigDecimal totalAmount;

    @JsonProperty("is_paid")
    private Boolean isPaid;

    @JsonProperty("payment_date")
    private LocalDateTime paymentDate;

    @JsonProperty("due_date")
    private LocalDate dueDate;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceRentedRoom {
        @JsonProperty("rr_id")
        private Integer rrId;

        @JsonProperty("tenant_id")
        private Integer tenantId;

        @JsonProperty("tenant_name")
        private String tenantName;

        @JsonProperty("tenant_phone")
        private String tenantPhone;

        @JsonProperty("room")
        private InvoiceRoom room;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InvoiceRoom {
        @JsonProperty("room_id")
        private Integer roomId;

        @JsonProperty("house_id")
        private Integer houseId;

        @JsonProperty("name")
        private String name;
    }
}

