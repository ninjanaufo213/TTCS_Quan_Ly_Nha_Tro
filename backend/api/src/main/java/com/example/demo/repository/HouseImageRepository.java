package com.example.demo.repository;

import com.example.demo.model.HouseImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HouseImageRepository extends JpaRepository<HouseImage, Integer> {
    List<HouseImage> findByHouse_HouseId(Integer houseId);
}
