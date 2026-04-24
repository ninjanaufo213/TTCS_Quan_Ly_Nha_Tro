package com.example.demo.service;

import com.example.demo.dto.AssetResponse;
import com.example.demo.model.Asset;
import com.example.demo.model.Room;
import com.example.demo.repository.AssetRepository;
import com.example.demo.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssetService {

    private final AssetRepository assetRepository;
    private final RoomRepository roomRepository;
    private final AuthService authService;
    private final FileStorageService fileStorageService;

    @Autowired
    public AssetService(AssetRepository assetRepository,
                        RoomRepository roomRepository,
                        AuthService authService,
                        FileStorageService fileStorageService) {
        this.assetRepository = assetRepository;
        this.roomRepository = roomRepository;
        this.authService = authService;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Get all assets for a specific room
     */
    public List<AssetResponse> getAssetsByRoom(Integer roomId) {
        // Verify room ownership
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng không tìm thấy"));

        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!room.getHouse().getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền xem tài sản của phòng này");
        }

        return assetRepository.findByRoom_RoomId(roomId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific asset by ID
     */
    public AssetResponse getAssetById(Integer assetId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new IllegalArgumentException("Tài sản không tìm thấy"));

        // Verify ownership
        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!asset.getRoom().getHouse().getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền xem tài sản này");
        }

        return mapToResponse(asset);
    }

    /**
     * Create a new asset
     */
    public AssetResponse createAsset(Integer roomId, String name, MultipartFile image) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng không tìm thấy"));

        // Verify ownership
        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!room.getHouse().getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền thêm tài sản vào phòng này");
        }

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = fileStorageService.store("assets", image);
        }

        Asset asset = Asset.builder()
                .room(room)
                .name(name)
                .imageUrl(imageUrl)
                .build();

        Asset savedAsset = assetRepository.save(asset);
        return mapToResponse(savedAsset);
    }

    /**
     * Update an existing asset
     */
    public AssetResponse updateAsset(Integer assetId, String name, MultipartFile image) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new IllegalArgumentException("Tài sản không tìm thấy"));

        // Verify ownership
        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!asset.getRoom().getHouse().getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền cập nhật tài sản này");
        }

        asset.setName(name);
        if (image != null && !image.isEmpty()) {
            String imageUrl = fileStorageService.store("assets", image);
            asset.setImageUrl(imageUrl);
        }

        Asset updatedAsset = assetRepository.save(asset);
        return mapToResponse(updatedAsset);
    }

    /**
     * Delete an asset
     */
    public void deleteAsset(Integer assetId) {
        Asset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new IllegalArgumentException("Tài sản không tìm thấy"));

        // Verify ownership
        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!asset.getRoom().getHouse().getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền xóa tài sản này");
        }

        assetRepository.deleteById(assetId);
    }

    private AssetResponse mapToResponse(Asset asset) {
        return new AssetResponse(
                asset.getAssetId(),
                asset.getRoom().getRoomId(),
                asset.getName(),
                asset.getImageUrl(),
                asset.getCreatedAt()
        );
    }
}
