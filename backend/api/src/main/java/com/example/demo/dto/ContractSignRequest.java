package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractSignRequest {

    @JsonProperty("signature")
    private String signature;

    @JsonProperty("sign_metadata")
    private String signMetadata;
}
