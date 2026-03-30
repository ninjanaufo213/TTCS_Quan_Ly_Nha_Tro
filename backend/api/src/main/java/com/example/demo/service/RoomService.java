package com.example.demo.service;

import com.example.demo.dto.RoomImageDto;
import com.example.demo.dto.RoomResponse;
import com.example.demo.model.Room;
import com.example.demo.model.RoomImage;
import com.example.demo.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    @Autowired
    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Optional<RoomResponse> getRoomById(Integer id) {
        return roomRepository.findById(id).map(this::mapToResponse);
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
