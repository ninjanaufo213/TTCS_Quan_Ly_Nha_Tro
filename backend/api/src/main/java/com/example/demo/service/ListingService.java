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
    private final AuthService authService;

    public ListingService(ListingRepository listingRepository,
                          com.example.demo.repository.RoomRepository roomRepository,
                          AuthService authService) {
        this.listingRepository = listingRepository;
        this.roomRepository = roomRepository;
        this.authService = authService;
    }

    public List<ListingResponse> getAllListings() {
        return listingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ListingResponse> getListingsForCurrentLandlord() {
        Integer landlordId = authService.getCurrentLandlordId();
        return listingRepository.findByRoom_House_Landlord_LandlordId(landlordId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ListingResponse> getPublishedListings() {
        return listingRepository.findByIsPublished(true).stream()
                .filter(listing -> listing.getRoom() != null && Boolean.TRUE.equals(listing.getRoom().getIsAvailable()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ListingResponse> searchPublishedListings(String keyword,
                                                         String district,
                                                         String ward,
                                                         BigDecimal minPrice,
                                                         BigDecimal maxPrice,
                                                         Double minArea,
                                                         Double maxArea) {
        return listingRepository.searchPublishedListings(keyword, district, ward, minPrice, maxPrice, minArea, maxArea)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ListingResponse getPublicListingById(Integer id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tin đăng"));
        if (!Boolean.TRUE.equals(listing.getIsPublished())) {
            throw new IllegalArgumentException("Tin đăng chưa được hiển thị");
        }
        if (listing.getRoom() == null || !Boolean.TRUE.equals(listing.getRoom().getIsAvailable())) {
            throw new IllegalArgumentException("Phòng đã được thuê hoặc không khả dụng");
        }
        Integer currentViews = listing.getViewsCount() == null ? 0 : listing.getViewsCount();
        listing.setViewsCount(currentViews + 1);
        listingRepository.save(listing);
        return mapToResponse(listing);
    }

    public ListingResponse createListing(com.example.demo.dto.ListingRequest request) {
        com.example.demo.model.Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng"));

        if (!Boolean.TRUE.equals(room.getIsAvailable())) {
            throw new IllegalArgumentException("Phòng này đã được thuê, không thể đăng tin");
        }

        Listing listing = Listing.builder()
                .room(room)
                .title(request.getTitle())
                .description(request.getDescription())
                .isPublished(true)
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
            String houseName = "";
            Integer houseId = null;
            String landlordName = "";
            String landlordPhone = "";
            Double latitude = null;
            Double longitude = null;
            if (listing.getRoom().getHouse() != null) {
                district = listing.getRoom().getHouse().getDistrict();
                ward = listing.getRoom().getHouse().getWard();
                address = listing.getRoom().getHouse().getAddressLine();
                houseName = listing.getRoom().getHouse().getName();
                houseId = listing.getRoom().getHouse().getHouseId();
                latitude = listing.getRoom().getHouse().getLatitude();
                longitude = listing.getRoom().getHouse().getLongitude();
                if (listing.getRoom().getHouse().getLandlord() != null) {
                    landlordName = listing.getRoom().getHouse().getLandlord().getBrandName();
                    if (listing.getRoom().getHouse().getLandlord().getUser() != null) {
                        landlordPhone = listing.getRoom().getHouse().getLandlord().getUser().getPhone();
                    }
                }
            }
            java.util.List<String> imageUrls = new java.util.ArrayList<>();
            if (listing.getRoom().getImages() != null) {
                imageUrls = listing.getRoom().getImages().stream()
                        .map(com.example.demo.model.RoomImage::getImageUrl)
                        .collect(java.util.stream.Collectors.toList());
            }

            roomInfo = ListingResponse.RoomInfo.builder()
                    .roomId(listing.getRoom().getRoomId())
                    .houseId(houseId)
                    .houseName(houseName)
                    .name(listing.getRoom().getName())
                    .price(listing.getRoom().getPrice())
                    .area(listing.getRoom().getArea())
                    .capacity(listing.getRoom().getCapacity())
                    .isAvailable(listing.getRoom().getIsAvailable())
                    .description(listing.getRoom().getDescription())
                    .district(district)
                    .ward(ward)
                    .address(address)
                    .landlordName(landlordName)
                    .landlordPhone(landlordPhone)
                    .imageUrls(imageUrls)
                    .latitude(latitude)
                    .longitude(longitude)
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
