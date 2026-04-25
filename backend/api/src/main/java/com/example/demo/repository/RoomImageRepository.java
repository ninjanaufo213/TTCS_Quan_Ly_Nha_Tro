package com.example.demo.repository;

import com.example.demo.model.RoomImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomImageRepository extends JpaRepository<RoomImage, Integer> {
    List<RoomImage> findByRoom_RoomId(Integer roomId);
}
