package com.example.demo.controller;

import com.example.demo.dto.ContractRequestResponse;
import com.example.demo.dto.RentedRoomRequest;
import com.example.demo.service.ContractRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class ContractRequestController {

    private final ContractRequestService contractRequestService;

    public ContractRequestController(ContractRequestService contractRequestService) {
        this.contractRequestService = contractRequestService;
    }

    // Landlord
    @PostMapping("/api/landlord/viewings/{id}/contract-request")
    public ResponseEntity<?> createContractRequest(@PathVariable Integer id, @RequestBody RentedRoomRequest request) {
        try {
            return ResponseEntity.ok(contractRequestService.createForViewing(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }

    @GetMapping("/api/landlord/contract-requests")
    public ResponseEntity<List<ContractRequestResponse>> getLandlordContractRequests() {
        return ResponseEntity.ok(contractRequestService.getLandlordContractRequests());
    }

    // Tenant
    @GetMapping("/api/tenant/contract-requests")
    public ResponseEntity<List<ContractRequestResponse>> getTenantContractRequests() {
        return ResponseEntity.ok(contractRequestService.getTenantContractRequests());
    }

    @PatchMapping("/api/tenant/contract-requests/{id}/confirm")
    public ResponseEntity<?> confirmContractRequest(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(contractRequestService.confirmContractRequest(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }

    @PatchMapping("/api/tenant/contract-requests/{id}/cancel")
    public ResponseEntity<?> cancelContractRequest(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(contractRequestService.cancelContractRequestByTenant(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }
}

