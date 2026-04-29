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
@RequestMapping("/api/landlord/listings")
@CrossOrigin(origins = "*")
public class LandlordListingController {

    private final ListingService listingService;

    public LandlordListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    public ResponseEntity<List<ListingResponse>> getMyListings() {
        return ResponseEntity.ok(listingService.getAllListings());
    }

    @PostMapping
    public ResponseEntity<ListingResponse> createListing(@Valid @RequestBody ListingRequest request) {
        ListingResponse response = listingService.createListing(request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteListing(@PathVariable Integer id) {
        try {
            listingService.deleteListing(id);
            return ResponseEntity.ok(Map.of("message", "Xóa bài đăng thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }
}
