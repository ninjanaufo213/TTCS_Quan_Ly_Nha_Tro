package com.example.demo.service;

import com.example.demo.dto.RoomImageDto;
import com.example.demo.dto.RoomRequest;
import com.example.demo.dto.RoomResponse;
import com.example.demo.model.House;
import com.example.demo.model.Room;
import com.example.demo.model.RoomImage;
import com.example.demo.repository.HouseRepository;
import com.example.demo.repository.RentedRoomRepository;
import com.example.demo.repository.RoomImageRepository;
import com.example.demo.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final HouseRepository houseRepository;
    private final RentedRoomRepository rentedRoomRepository;
    private final AuthService authService;
    private final RoomImageRepository roomImageRepository;

    @Autowired
    public RoomService(RoomRepository roomRepository,
                       HouseRepository houseRepository,
                       RentedRoomRepository rentedRoomRepository,
                       AuthService authService,
                       RoomImageRepository roomImageRepository) {
        this.roomRepository = roomRepository;
        this.houseRepository = houseRepository;
        this.rentedRoomRepository = rentedRoomRepository;
        this.authService = authService;
        this.roomImageRepository = roomImageRepository;
    }

    /**
     * Get all rooms for current landlord
     */
    public List<RoomResponse> getAllRooms() {
        Integer landlordId = authService.getCurrentLandlordId();
        List<House> houses = houseRepository.findByLandlord_LandlordId(landlordId);

        return houses.stream()
                .flatMap(house -> house.getRooms().stream())
                .peek(this::syncRoomAvailability)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get rooms by house ID
     */
    public List<RoomResponse> getRoomsByHouse(Integer houseId) {
        // Verify ownership first
        House house = houseRepository.findById(houseId)
                .orElseThrow(() -> new IllegalArgumentException("Nhà trọ không tìm thấy"));

        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!house.getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền xem phòng của nhà trọ này");
        }

        return roomRepository.findByHouse_HouseId(houseId)
                .stream()
                .peek(this::syncRoomAvailability)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific room by ID
     */
    public Optional<RoomResponse> getRoomById(Integer id) {
        return roomRepository.findById(id)
                .map(room -> {
                    syncRoomAvailability(room);
                    return mapToResponse(room);
                });
    }

    /**
     * Create a new room
     */
    public RoomResponse createRoom(RoomRequest request) {
        House house = houseRepository.findById(request.house_id())
                .orElseThrow(() -> new IllegalArgumentException("Nhà trọ không tìm thấy"));

        // Verify ownership
        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!house.getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền thêm phòng vào nhà trọ này");
        }

        Room room = Room.builder()
                .house(house)
                .name(request.name())
                .price(request.price())
                .capacity(request.capacity() != null ? request.capacity() : 1)
                .isAvailable(request.is_available() != null ? request.is_available() : true)
                .description(request.description())
                .build();

        Room savedRoom = roomRepository.save(room);
        return mapToResponse(savedRoom);
    }

    /**
     * Update an existing room
     */
    public RoomResponse updateRoom(Integer roomId, RoomRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng không tìm thấy"));

        // Verify ownership
        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!room.getHouse().getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền cập nhật phòng này");
        }

        // If house_id is different, verify new house ownership
        if (!room.getHouse().getHouseId().equals(request.house_id())) {
            House newHouse = houseRepository.findById(request.house_id())
                    .orElseThrow(() -> new IllegalArgumentException("Nhà trọ mới không tìm thấy"));

            if (!newHouse.getLandlord().getLandlordId().equals(currentLandlordId)) {
                throw new IllegalArgumentException("Bạn không có quyền chuyển phòng sang nhà trọ này");
            }

            room.setHouse(newHouse);
        }

        room.setName(request.name());
        room.setPrice(request.price());
        room.setCapacity(request.capacity() != null ? request.capacity() : 1);
        if (request.is_available() != null) {
            room.setIsAvailable(request.is_available());
        }
        room.setDescription(request.description());

        Room updatedRoom = roomRepository.save(room);
        return mapToResponse(updatedRoom);
    }

    /**
     * Delete a room
     */
    public void deleteRoom(Integer roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng không tìm thấy"));

        // Verify ownership
        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!room.getHouse().getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền xóa phòng này");
        }

        roomRepository.deleteById(roomId);
    }

    /**
     * Add images to a room
     */
    @Transactional
    public RoomResponse addRoomImages(Integer roomId, List<MultipartFile> images) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng không tìm thấy"));

        Integer currentLandlordId = authService.getCurrentLandlordId();
        if (!room.getHouse().getLandlord().getLandlordId().equals(currentLandlordId)) {
            throw new IllegalArgumentException("Bạn không có quyền thêm ảnh cho phòng này");
        }

        if (images == null || images.isEmpty()) {
            return mapToResponse(room);
        }

        boolean hasThumbnail = room.getImages() != null
                && room.getImages().stream().anyMatch(image -> Boolean.TRUE.equals(image.getIsThumbnail()));
        boolean shouldSetThumbnail = !hasThumbnail;

        for (MultipartFile file : images) {
            String imageUrl = encodeToDataUrl(file);
            RoomImage image = RoomImage.builder()
                    .room(room)
                    .imageUrl(imageUrl)
                    .isThumbnail(shouldSetThumbnail)
                    .build();
            roomImageRepository.save(image);
            shouldSetThumbnail = false;
        }

        return mapToResponse(room);
    }

    private RoomResponse mapToResponse(Room room) {
        List<RoomImageDto> imageDtos = room.getImages() != null ?
                room.getImages().stream()
                        .map(this::mapToImageDto)
                        .collect(Collectors.toList()) : List.of();

        return new RoomResponse(
                room.getRoomId(),
                room.getHouse() != null ? room.getHouse().getHouseId() : null,
                room.getName(),
                room.getPrice(),
                room.getCapacity(),
                room.getIsAvailable(),
                room.getDescription(),
                room.getCreatedAt(),
                room.getUpdatedAt(),
                imageDtos
        );
    }

    private RoomImageDto mapToImageDto(RoomImage image) {
        return new RoomImageDto(
                image.getImageId(),
                image.getImageUrl(),
                image.getIsThumbnail()
        );
    }

    private void syncRoomAvailability(Room room) {
        if (room == null || room.getRoomId() == null) {
            return;
        }

        LocalDate today = LocalDate.now();
        boolean hasEffectiveActiveContract = rentedRoomRepository
                .existsByRoom_RoomIdAndIsActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        room.getRoomId(),
                        today,
                        today
                );
        boolean shouldBeAvailable = !hasEffectiveActiveContract;

        if (!Boolean.valueOf(shouldBeAvailable).equals(room.getIsAvailable())) {
            room.setIsAvailable(shouldBeAvailable);
            roomRepository.save(room);
        }
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
            throw new IllegalStateException("Lưu ảnh phòng thất bại", e);
        }
    }
}
