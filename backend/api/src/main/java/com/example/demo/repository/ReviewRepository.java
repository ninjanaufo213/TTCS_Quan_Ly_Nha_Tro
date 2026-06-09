package com.example.demo.repository;

import com.example.demo.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    List<Review> findByRoom_RoomIdOrderByCreatedAtDesc(Integer roomId);

    List<Review> findByRoom_House_Landlord_LandlordIdOrderByCreatedAtDesc(Integer landlordId);

    Optional<Review> findByTenant_TenantIdAndRoom_RoomId(Integer tenantId, Integer roomId);

    long countByRoom_RoomId(Integer roomId);

    @Query("select avg(r.rating) from Review r where r.room.roomId = :roomId")
    Double averageRatingByRoomId(@Param("roomId") Integer roomId);
}
