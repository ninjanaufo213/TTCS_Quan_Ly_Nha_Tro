package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceRequest {

    @JsonProperty("rr_id")
    private Integer rrId;

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

    @JsonProperty("due_date")
    private LocalDateTime dueDate;

    @JsonProperty("payment_date")
    private LocalDateTime paymentDate;

    @JsonProperty("is_paid")
    private Boolean isPaid;
}

