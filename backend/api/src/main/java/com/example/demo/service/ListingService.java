package com.example.demo.service;

import com.example.demo.dto.ListingResponse;
import com.example.demo.model.Listing;
import com.example.demo.repository.ListingRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
public class ListingService {

    private final ListingRepository listingRepository;

    public ListingService(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    public List<ListingResponse> getAllListings() {
        return listingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ListingResponse> getPendingListings() {
        return listingRepository.findByIsPublished(false).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ListingResponse approveListing(Integer id) {
        Optional<Listing> listingOpt = listingRepository.findById(id);
        if (listingOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy tin đăng");
        }
        Listing listing = listingOpt.get();
        listing.setIsPublished(true);
        listingRepository.save(listing);
        return mapToResponse(listing);
    }

    public ListingResponse rejectListing(Integer id) {
        Optional<Listing> listingOpt = listingRepository.findById(id);
        if (listingOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy tin đăng");
        }
        Listing listing = listingOpt.get();
        listing.setIsPublished(false);
        listingRepository.save(listing);
        return mapToResponse(listing);
    }

    private ListingResponse mapToResponse(Listing listing) {
        ListingResponse.RoomInfo roomInfo = null;
        if (listing.getRoom() != null) {
            String district = "";
            String ward = "";
            String address = "";
            if (listing.getRoom().getHouse() != null) {
                district = listing.getRoom().getHouse().getDistrict();
                ward = listing.getRoom().getHouse().getWard();
                address = listing.getRoom().getHouse().getAddressLine();
            }
            roomInfo = ListingResponse.RoomInfo.builder()
                    .price(listing.getRoom().getPrice())
                    .district(district)
                    .ward(ward)
                    .address(address)
                    .build();
        }

        return ListingResponse.builder()
                .listingId(listing.getListingId())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .viewsCount(listing.getViewsCount())
                .isPublished(listing.getIsPublished())
                .createdAt(listing.getCreatedAt())
                .room(roomInfo)
                .build();
    }
}
