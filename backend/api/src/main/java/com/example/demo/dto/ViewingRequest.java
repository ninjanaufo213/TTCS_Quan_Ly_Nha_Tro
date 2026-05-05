package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.time.LocalTime;

public record ViewingRequest(
        @JsonAlias({"roomId", "room_id"})
        Integer roomId,
        @JsonFormat(pattern = "yyyy-MM-dd")
        @JsonAlias({"visitDate", "visit_date"})
        LocalDate visitDate,
        @JsonFormat(pattern = "HH:mm")
        @JsonAlias({"visitTime", "visit_time"})
        LocalTime visitTime
) {
}
