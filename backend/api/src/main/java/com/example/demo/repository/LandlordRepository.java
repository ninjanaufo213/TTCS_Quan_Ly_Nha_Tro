package com.example.demo.repository;

import com.example.demo.model.Landlord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LandlordRepository extends JpaRepository<Landlord, Integer> {
    Optional<Landlord> findByUser_UserId(Integer userId);
}
