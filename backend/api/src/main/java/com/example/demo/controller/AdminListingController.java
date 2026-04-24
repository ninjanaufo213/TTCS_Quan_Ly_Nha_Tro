package com.example.demo.controller;

import com.example.demo.dto.ListingResponse;
import com.example.demo.service.ListingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/listings")
@CrossOrigin(origins = "*") // Match other controllers
public class AdminListingController {

    private final ListingService listingService;

    public AdminListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    public ResponseEntity<List<ListingResponse>> getAllListings() {
        return ResponseEntity.ok(listingService.getAllListings());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ListingResponse>> getPendingListings() {
        return ResponseEntity.ok(listingService.getPendingListings());
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approveListing(@PathVariable Integer id) {
        try {
            ListingResponse response = listingService.approveListing(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> rejectListing(@PathVariable Integer id) {
        try {
            ListingResponse response = listingService.rejectListing(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }
}
