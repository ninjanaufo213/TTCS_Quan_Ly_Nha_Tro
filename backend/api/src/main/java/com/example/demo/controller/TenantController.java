package com.example.demo.controller;

import com.example.demo.dto.TenantLookupResponse;
import com.example.demo.model.Tenant;
import com.example.demo.repository.TenantRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tenants")
@CrossOrigin(origins = "*")
public class TenantController {

    private final TenantRepository tenantRepository;

    public TenantController(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @GetMapping("/lookup")
    public ResponseEntity<List<TenantLookupResponse>> lookupTenants(
            @RequestParam(value = "search", required = false) String search
    ) {
        List<Tenant> tenants;
        if (search == null || search.trim().isEmpty()) {
            tenants = tenantRepository.findAll();
        } else {
            List<Tenant> byPhone = tenantRepository.findByUser_PhoneContainingIgnoreCase(search.trim());
            List<Tenant> byName = tenantRepository.findByFullnameContainingIgnoreCase(search.trim());
            Map<Integer, Tenant> merged = new LinkedHashMap<>();
            for (Tenant t : byPhone) {
                if (t != null && t.getTenantId() != null) {
                    merged.put(t.getTenantId(), t);
                }
            }
            for (Tenant t : byName) {
                if (t != null && t.getTenantId() != null) {
                    merged.put(t.getTenantId(), t);
                }
            }
            tenants = new ArrayList<>(merged.values());
        }

        List<TenantLookupResponse> responses = tenants.stream()
                .map(t -> TenantLookupResponse.builder()
                        .tenantId(t.getTenantId())
                        .fullname(t.getFullname())
                        .phone(t.getUser() != null ? t.getUser().getPhone() : null)
                        .build())
                .toList();

        return ResponseEntity.ok(responses);
    }
}

