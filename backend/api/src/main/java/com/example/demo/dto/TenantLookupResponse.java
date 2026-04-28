package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantLookupResponse {

    @JsonProperty("tenant_id")
    private Integer tenantId;

    @JsonProperty("fullname")
    private String fullname;

    @JsonProperty("phone")
    private String phone;
}

