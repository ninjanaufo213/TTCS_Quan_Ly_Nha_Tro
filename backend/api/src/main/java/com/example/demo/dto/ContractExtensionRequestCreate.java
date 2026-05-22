package com.example.demo.dto;

import java.time.LocalDate;

public record ContractExtensionRequestCreate(
        Integer rentedRoomId,
        LocalDate requestedEndDate
) {
}

