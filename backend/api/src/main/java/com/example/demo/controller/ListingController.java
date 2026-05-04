package com.example.demo.controller;

import com.example.demo.dto.ListingRequest;
import com.example.demo.dto.ListingResponse;
import com.example.demo.service.ListingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    // --- PUBLIC ENDPOINTS ---
    @GetMapping("/api/listings")
    public ResponseEntity<List<ListingResponse>> getPublishedListings() {
        return ResponseEntity.ok(listingService.getPublishedListings());
    }

    @GetMapping("/api/listings/search")
    public ResponseEntity<List<ListingResponse>> searchPublishedListings(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String ward,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) Double minArea,
            @RequestParam(required = false) Double maxArea
    ) {
        return ResponseEntity.ok(
                listingService.searchPublishedListings(keyword, district, ward, minPrice, maxPrice, minArea, maxArea)
        );
    }

    // --- LANDLORD ENDPOINTS ---
    @GetMapping("/api/landlord/listings")
    public ResponseEntity<List<ListingResponse>> getMyListings() {
        return ResponseEntity.ok(listingService.getAllListings());
    }

    @PostMapping("/api/landlord/listings")
    public ResponseEntity<ListingResponse> createListing(@Valid @RequestBody ListingRequest request) {
        ListingResponse response = listingService.createListing(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/landlord/listings/{id}")
    public ResponseEntity<?> deleteListing(@PathVariable Integer id) {
        try {
            listingService.deleteListing(id);
            return ResponseEntity.ok(Map.of("message", "Xóa bài đăng thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }

    // --- ADMIN ENDPOINTS ---
    @GetMapping("/api/admin/listings")
    public ResponseEntity<List<ListingResponse>> getAllListings() {
        return ResponseEntity.ok(listingService.getAllListings());
    }

    @GetMapping("/api/admin/listings/pending")
    public ResponseEntity<List<ListingResponse>> getPendingListings() {
        return ResponseEntity.ok(listingService.getPendingListings());
    }

    @PatchMapping("/api/admin/listings/{id}/approve")
    public ResponseEntity<?> approveListing(@PathVariable Integer id) {
        try {
            ListingResponse response = listingService.approveListing(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }

    @PatchMapping("/api/admin/listings/{id}/reject")
    public ResponseEntity<?> rejectListing(@PathVariable Integer id) {
        try {
            ListingResponse response = listingService.rejectListing(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }
}
