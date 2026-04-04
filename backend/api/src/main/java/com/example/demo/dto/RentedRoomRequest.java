package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentedRoomRequest {

    @JsonProperty("room_id")
    private Integer roomId;

    @JsonProperty("tenant_id")
    private Integer tenantId;

    @JsonProperty("tenant_name")
    private String tenantName;

    @JsonProperty("tenant_phone")
    private String tenantPhone;

    @JsonProperty("number_of_tenants")
    private Integer numberOfTenants;

    @JsonProperty("start_date")
    private LocalDate startDate;

    @JsonProperty("end_date")
    private LocalDate endDate;

    @JsonProperty("monthly_rent")
    private BigDecimal monthlyRent;

    @JsonProperty("deposit")
    private BigDecimal deposit;

    @JsonProperty("contract_url")
    private String contractUrl;

    @JsonProperty("water_price")
    private BigDecimal waterPrice;

    @JsonProperty("internet_price")
    private BigDecimal internetPrice;

    @JsonProperty("general_price")
    private BigDecimal generalPrice;

    @JsonProperty("initial_electricity_num")
    private Integer initialElectricityNum;

    @JsonProperty("electricity_unit_price")
    private BigDecimal electricityUnitPrice;
}

