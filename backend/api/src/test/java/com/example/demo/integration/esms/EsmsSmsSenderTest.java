package com.example.demo.integration.esms;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EsmsSmsSenderTest {

    @Test
    void normalizePhone_vnDefault() {
        EsmsProperties props = new EsmsProperties(
                false,
                "",
                "",
                "",
                "",
                2,
                true,
                true,
                "Msg {roomName} {visitDate} {visitTime}"
        );
        EsmsSmsSender sender = new EsmsSmsSender(props, RestClient.builder());

        assertEquals("84901234567", sender.normalizePhone("0901234567"));
        assertEquals("84901234567", sender.normalizePhone("+84901234567"));
        assertEquals("84123456789", sender.normalizePhone("0123456789"));
    }

    @Test
    void renderTemplate_replacesPlaceholders() {
        EsmsProperties props = new EsmsProperties(
                false,
                "",
                "",
                "",
                "",
                2,
                true,
                true,
                "Phong {roomName} luc {visitDate} {visitTime}"
        );
        EsmsSmsSender sender = new EsmsSmsSender(props, RestClient.builder());

        String content = sender.renderViewingApprovedContent(
                "P101",
                LocalDate.of(2026, 5, 19),
                LocalTime.of(9, 30)
        );

        assertEquals("Phong P101 luc 2026-05-19 09:30", content);
    }
}

