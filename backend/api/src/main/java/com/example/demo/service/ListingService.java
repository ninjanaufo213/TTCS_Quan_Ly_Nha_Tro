package com.example.demo.service;

import com.example.demo.dto.ListingResponse;
import com.example.demo.model.Listing;
import com.example.demo.repository.ListingRepository;
import com.example.demo.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final com.example.demo.repository.RoomRepository roomRepository;
    private final ReviewRepository reviewRepository;
    private final AuthService authService;

    public ListingService(ListingRepository listingRepository,
                          com.example.demo.repository.RoomRepository roomRepository,
                          ReviewRepository reviewRepository,
                          AuthService authService) {
        this.listingRepository = listingRepository;
        this.roomRepository = roomRepository;
        this.reviewRepository = reviewRepository;
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
                                                         Double maxArea,
                                                         Double latitude,
                                                         Double longitude,
                                                         Double radius) {
        List<Listing> listings = listingRepository.searchPublishedListings(keyword, district, ward, minPrice, maxPrice, minArea, maxArea);

        if (latitude != null && longitude != null && radius != null) {
            listings = listings.stream().filter(l -> {
                if (l.getRoom() == null || l.getRoom().getHouse() == null || 
                    l.getRoom().getHouse().getLatitude() == null || 
                    l.getRoom().getHouse().getLongitude() == null) {
                    return false;
                }
                double dist = calculateDistance(latitude, longitude, 
                                                l.getRoom().getHouse().getLatitude(), 
                                                l.getRoom().getHouse().getLongitude());
                return dist <= radius;
            }).collect(Collectors.toList());
        }

        return listings.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }

    public List<ListingResponse> getRecommendedListings(Double latitude, Double longitude, Double radius, Integer limit) {
        // Fallback mechanism: if coordinates are null, use Hanoi city center as default
        if (latitude == null || longitude == null) {
            latitude = 21.028511; // Hanoi
            longitude = 105.804817;
        }
        if (radius == null) radius = 1000.0;
        if (limit == null) limit = 10;

        List<Object[]> results = listingRepository.findRecommendedListingIdsAndDistances(latitude, longitude, radius, limit);

        return results.stream().map(row -> {
            Integer listingId = ((Number) row[0]).intValue();
            Double distance = ((Number) row[1]).doubleValue();
            
            Listing listing = listingRepository.findById(listingId).orElseThrow();
            ListingResponse response = mapToResponse(listing);
            response.setDistance(distance);
            return response;
        }).collect(Collectors.toList());
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
        Double averageRating = null;
        Long totalReviews = 0L;
        if (listing.getRoom() != null) {
            Integer roomId = listing.getRoom().getRoomId();
            averageRating = reviewRepository.averageRatingByRoomId(roomId);
            totalReviews = reviewRepository.countByRoom_RoomId(roomId);

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
                    .roomId(roomId)
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
                .averageRating(averageRating)
                .totalReviews(totalReviews)
                .room(roomInfo)
                .build();
    }
}
