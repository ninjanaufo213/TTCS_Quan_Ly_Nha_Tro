package com.example.demo.integration.esms;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "esms")
public record EsmsProperties(
        boolean enabled,
        String sendUrl,
        String apiKey,
        String secretKey,
        String brandName,
        Integer smsType,
        boolean unicode,
        boolean normalizeVnPhone,
        String viewingApprovedTemplate
) {
    public Integer effectiveSmsType() {
        return smsType != null ? smsType : 2;
    }
}

