package com.example.demo.repository;

import com.example.demo.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Integer> {
    List<Asset> findByRoom_RoomId(Integer roomId);
}

