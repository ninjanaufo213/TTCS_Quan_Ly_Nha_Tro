package com.example.demo.controller;

import com.example.demo.dto.ViewingRequest;
import com.example.demo.dto.ViewingResponse;
import com.example.demo.service.ViewingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class ViewingController {

    private final ViewingService viewingService;

    public ViewingController(ViewingService viewingService) {
        this.viewingService = viewingService;
    }

    // Tenant
    @PostMapping("/api/viewings")
    public ResponseEntity<?> createViewing(@RequestBody ViewingRequest request) {
        try {
            return ResponseEntity.ok(viewingService.createViewing(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }

    @GetMapping("/api/viewings/me")
    public ResponseEntity<List<ViewingResponse>> getMyViewings() {
        return ResponseEntity.ok(viewingService.getMyViewings());
    }

    @PatchMapping("/api/viewings/{id}/cancel")
    public ResponseEntity<?> cancelViewing(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(viewingService.cancelByTenant(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }

    // Landlord
    @GetMapping("/api/landlord/viewings")
    public ResponseEntity<List<ViewingResponse>> getLandlordViewings() {
        return ResponseEntity.ok(viewingService.getLandlordViewings());
    }

    @PatchMapping("/api/landlord/viewings/{id}/cancel")
    public ResponseEntity<?> cancelViewingByLandlord(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(viewingService.cancelByLandlord(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }
}

