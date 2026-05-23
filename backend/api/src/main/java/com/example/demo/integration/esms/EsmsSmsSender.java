package com.example.demo.integration.esms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
public class EsmsSmsSender {
    private static final Logger log = LoggerFactory.getLogger(EsmsSmsSender.class);

    private final EsmsProperties properties;
    private final RestClient restClient;

    public EsmsSmsSender(EsmsProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.restClient = restClientBuilder.build();
    }

    public void sendViewingApprovedSms(String rawPhone, String roomName, LocalDate visitDate, LocalTime visitTime) {
        if (!properties.enabled()) {
            return;
        }
        if (!StringUtils.hasText(properties.sendUrl())
                || !StringUtils.hasText(properties.apiKey())
                || !StringUtils.hasText(properties.secretKey())) {
            log.warn("eSMS is enabled but missing config (esms.send-url/api-key/secret-key). Skipping SMS.");
            return;
        }
        if (!StringUtils.hasText(rawPhone)) {
            log.warn("Missing recipient phone. Skipping SMS.");
            return;
        }

        String phone = normalizePhone(rawPhone);
        String content = renderViewingApprovedContent(roomName, visitDate, visitTime);

        try {
            // NOTE: eSMS docs commonly use GET endpoints with query params; we keep only `send-url` configurable.
            URI uri = UriComponentsBuilder.fromUriString(properties.sendUrl())
                    .queryParam("ApiKey", properties.apiKey())
                    .queryParam("SecretKey", properties.secretKey())
                    .queryParam("Phone", phone)
                    .queryParam("Content", content)
                    .queryParam("SmsType", properties.effectiveSmsType())
                    .queryParam("Brandname", properties.brandName() != null ? properties.brandName() : "")
                    .queryParam("IsUnicode", properties.unicode() ? 1 : 0)
                    .build(true)
                    .toUri();

            String response = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(String.class);

            log.info("eSMS response: {}", response);
        } catch (Exception e) {
            // Do not fail the approval flow if SMS fails.
            log.warn("Failed to send eSMS (phone={}). {}", phone, e.getMessage());
        }
    }

    String renderViewingApprovedContent(String roomName, LocalDate visitDate, LocalTime visitTime) {
        String template = properties.viewingApprovedTemplate();
        if (!StringUtils.hasText(template)) {
            template = "Yeu cau xem phong {roomName} da duoc chu tro chap nhan. Thoi gian: {visitDate} {visitTime}.";
        }
        String dateStr = visitDate != null ? visitDate.format(DateTimeFormatter.ISO_LOCAL_DATE) : "";
        String timeStr = visitTime != null ? visitTime.format(DateTimeFormatter.ofPattern("HH:mm")) : "";
        return template
                .replace("{roomName}", roomName != null ? roomName : "")
                .replace("{visitDate}", dateStr)
                .replace("{visitTime}", timeStr);
    }

    String normalizePhone(String rawPhone) {
        String phone = rawPhone.trim().replace(" ", "");
        if (!properties.normalizeVnPhone()) {
            return phone;
        }
        if (phone.startsWith("+84")) {
            phone = "84" + phone.substring(3);
        }
        if (phone.startsWith("0") && phone.length() >= 10) {
            phone = "84" + phone.substring(1);
        }
        return phone;
    }
}
