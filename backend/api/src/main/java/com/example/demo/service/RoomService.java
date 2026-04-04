package com.example.demo.service;

import com.example.demo.dto.RoomImageDto;
import com.example.demo.dto.RoomRequest;
import com.example.demo.dto.RoomResponse;
import com.example.demo.model.House;
import com.example.demo.model.Room;
import com.example.demo.model.RoomImage;
import com.example.demo.repository.HouseRepository;
import com.example.demo.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final HouseRepository houseRepository;
    private final AuthService authService;

    @Autowired
    public RoomService(RoomRepository roomRepository, HouseRepository houseRepository, AuthService authService) {
        this.roomRepository = roomRepository;
        this.houseRepository = houseRepository;
        this.authService = authService;
    }

    /**
     * Get all rooms for current landlord
     */
    public List<RoomResponse> getAllRooms() {
        Integer landlordId = authService.getCurrentLandlordId();
        List<House> houses = houseRepository.findByLandlord_LandlordId(landlordId);

        return houses.stream()
                .flatMap(house -> house.getRooms().stream())
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
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific room by ID
     */
    public Optional<RoomResponse> getRoomById(Integer id) {
        return roomRepository.findById(id).map(this::mapToResponse);
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
        room.setIsAvailable(request.is_available() != null ? request.is_available() : true);
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
}
