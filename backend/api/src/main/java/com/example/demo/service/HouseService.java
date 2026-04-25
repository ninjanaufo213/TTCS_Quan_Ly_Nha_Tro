package com.example.demo.service;

import com.example.demo.dto.HouseImageDto;
import com.example.demo.dto.HouseRequest;
import com.example.demo.dto.HouseResponse;
import com.example.demo.model.House;
import com.example.demo.model.HouseImage;
import com.example.demo.model.Landlord;
import com.example.demo.repository.HouseImageRepository;
import com.example.demo.repository.HouseRepository;
import com.example.demo.repository.LandlordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HouseService {

    private final HouseRepository houseRepository;
    private final LandlordRepository landlordRepository;
    private final AuthService authService;
    private final HouseImageRepository houseImageRepository;

    @Autowired
    public HouseService(HouseRepository houseRepository,
                        LandlordRepository landlordRepository,
                        AuthService authService,
                        HouseImageRepository houseImageRepository) {
        this.houseRepository = houseRepository;
        this.landlordRepository = landlordRepository;
        this.authService = authService;
        this.houseImageRepository = houseImageRepository;
    }

    /**
     * Get all houses for the current landlord
     */
    public List<HouseResponse> getAllHouses() {
        Integer landlordId = authService.getCurrentLandlordId();
        return houseRepository.findByLandlord_LandlordId(landlordId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific house by ID
     */
    public Optional<HouseResponse> getHouseById(Integer houseId) {
        return houseRepository.findById(houseId)
                .map(this::mapToResponse);
    }

    /**
     * Create a new house
     */
    public HouseResponse createHouse(HouseRequest request) {
        Integer landlordId = authService.getCurrentLandlordId();
        Landlord landlord = landlordRepository.findById(landlordId)
                .orElseThrow(() -> new IllegalArgumentException("Landlord không tìm thấy"));

        House house = House.builder()
                .landlord(landlord)
                .name(request.name())
                .floorCount(request.floorCount())
                .addressLine(request.addressLine())
                .ward(request.ward())
                .district(request.district())
                .build();

        House savedHouse = houseRepository.save(house);
        return mapToResponse(savedHouse);
    }

    /**
     * Update an existing house
     */
    public HouseResponse updateHouse(Integer houseId, HouseRequest request) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new IllegalArgumentException("Nhà trọ không tìm thấy"));

        // Verify ownership
        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!house.getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền cập nhật nhà trọ này");
        }

        house.setName(request.name());
        house.setFloorCount(request.floorCount());
        house.setAddressLine(request.addressLine());
        house.setWard(request.ward());
        house.setDistrict(request.district());

        House updatedHouse = houseRepository.save(house);
        return mapToResponse(updatedHouse);
    }

    /**
     * Delete a house
     */
    public void deleteHouse(Integer houseId) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new IllegalArgumentException("Nhà trọ không tìm thấy"));

        // Verify ownership
        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!house.getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền xóa nhà trọ này");
        }

        houseRepository.deleteById(houseId);
    }

    /**
     * Add images to a house
     */
    @Transactional
    public HouseResponse addHouseImages(Integer houseId, List<MultipartFile> images) {
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new IllegalArgumentException("Nhà trọ không tìm thấy"));

        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!house.getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền thêm ảnh cho nhà trọ này");
        }

        if (images == null || images.isEmpty()) {
            return mapToResponse(house);
        }

        boolean hasThumbnail = house.getImages() != null
                && house.getImages().stream().anyMatch(image -> Boolean.TRUE.equals(image.getIsThumbnail()));
        boolean shouldSetThumbnail = !hasThumbnail;

        for (MultipartFile file : images) {
            String imageUrl = encodeToDataUrl(file);
            HouseImage image = HouseImage.builder()
                    .house(house)
                    .imageUrl(imageUrl)
                    .isThumbnail(shouldSetThumbnail)
                    .build();
            houseImageRepository.save(image);
            shouldSetThumbnail = false;
        }

        return mapToResponse(house);
    }

    private HouseResponse mapToResponse(House house) {
        List<HouseImageDto> imageDtos = house.getImages() != null ?
                house.getImages().stream()
                        .map(this::mapToImageDto)
                        .collect(Collectors.toList()) : List.of();

        return new HouseResponse(
                house.getHouseId(),
                house.getLandlord().getLandlordId(),
                house.getName(),
                house.getFloorCount(),
                house.getAddressLine(),
                house.getWard(),
                house.getDistrict(),
                house.getCreatedAt(),
                house.getUpdatedAt(),
                imageDtos
        );
    }

    private HouseImageDto mapToImageDto(HouseImage image) {
        return new HouseImageDto(
                image.getImageId(),
                image.getImageUrl(),
                image.getIsThumbnail()
        );
    }

    private String encodeToDataUrl(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        try {
            String contentType = file.getContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = "application/octet-stream";
            }
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            return "data:" + contentType + ";base64," + base64;
        } catch (IOException e) {
            throw new IllegalStateException("Lưu ảnh nhà trọ thất bại", e);
        }
    }
}
