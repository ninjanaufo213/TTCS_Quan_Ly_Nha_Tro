package com.example.demo.service;

import com.example.demo.dto.ListingResponse;
import com.example.demo.model.Listing;
import com.example.demo.repository.ListingRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final com.example.demo.repository.RoomRepository roomRepository;

    public ListingService(ListingRepository listingRepository, com.example.demo.repository.RoomRepository roomRepository) {
        this.listingRepository = listingRepository;
        this.roomRepository = roomRepository;
    }

    public List<ListingResponse> getAllListings() {
        return listingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ListingResponse> getPublishedListings() {
        return listingRepository.findByIsPublished(true).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ListingResponse> searchPublishedListings(
            String keyword,
            String district,
            String ward,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double minArea,
            Double maxArea
    ) {
        return listingRepository.searchPublishedListings(keyword, district, ward, minPrice, maxPrice, minArea, maxArea)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ListingResponse createListing(com.example.demo.dto.ListingRequest request) {
        com.example.demo.model.Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng"));

        Listing listing = Listing.builder()
                .room(room)
                .title(request.getTitle())
                .description(request.getDescription())
                .isPublished(false) // Wait for admin approval
                .viewsCount(0)
                .build();

        listing = listingRepository.save(listing);
        return mapToResponse(listing);
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

    public void deleteListing(Integer id) {
        if (!listingRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy tin đăng");
        }
        listingRepository.deleteById(id);
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
            java.util.List<String> imageUrls = new java.util.ArrayList<>();
            if (listing.getRoom().getImages() != null) {
                imageUrls = listing.getRoom().getImages().stream()
                        .map(com.example.demo.model.RoomImage::getImageUrl)
                        .collect(java.util.stream.Collectors.toList());
            }

            roomInfo = ListingResponse.RoomInfo.builder()
                    .name(listing.getRoom().getName())
                    .price(listing.getRoom().getPrice())
                    .area(listing.getRoom().getArea())
                    .district(district)
                    .ward(ward)
                    .address(address)
                    .imageUrls(imageUrls)
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
