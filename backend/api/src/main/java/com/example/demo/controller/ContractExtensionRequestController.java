package com.example.demo.controller;

import com.example.demo.dto.ContractExtensionRequestCreate;
import com.example.demo.dto.ContractExtensionRequestResponse;
import com.example.demo.service.ContractExtensionRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class ContractExtensionRequestController {

    private final ContractExtensionRequestService contractExtensionRequestService;

    public ContractExtensionRequestController(ContractExtensionRequestService contractExtensionRequestService) {
        this.contractExtensionRequestService = contractExtensionRequestService;
    }

    @PostMapping("/api/tenant/contract-extensions")
    public ResponseEntity<?> createExtensionRequest(@RequestBody ContractExtensionRequestCreate request) {
        try {
            return ResponseEntity.ok(contractExtensionRequestService.createRequest(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }

    @GetMapping("/api/tenant/contract-extensions")
    public ResponseEntity<List<ContractExtensionRequestResponse>> getTenantRequests() {
        return ResponseEntity.ok(contractExtensionRequestService.getTenantRequests());
    }

    @GetMapping("/api/landlord/contract-extensions")
    public ResponseEntity<List<ContractExtensionRequestResponse>> getLandlordRequests() {
        return ResponseEntity.ok(contractExtensionRequestService.getLandlordRequests());
    }

    @PatchMapping("/api/landlord/contract-extensions/{id}/approve")
    public ResponseEntity<?> approveExtensionRequest(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(contractExtensionRequestService.approveRequest(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }

    @PatchMapping("/api/landlord/contract-extensions/{id}/reject")
    public ResponseEntity<?> rejectExtensionRequest(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(contractExtensionRequestService.rejectRequest(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }
}

