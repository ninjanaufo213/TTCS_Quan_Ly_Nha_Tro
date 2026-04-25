package com.example.demo.repository;

import com.example.demo.model.RentedRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RentedRoomRepository extends JpaRepository<RentedRoom, Integer> {
    List<RentedRoom> findByRoom_RoomId(Integer roomId);
    List<RentedRoom> findByTenant_TenantId(Integer tenantId);
    List<RentedRoom> findByIsActiveTrue();
    List<RentedRoom> findByIsActiveFalse();
    List<RentedRoom> findByRoom_RoomIdAndIsActiveTrue(Integer roomId);
    boolean existsByRoom_RoomIdAndIsActiveTrue(Integer roomId);
    boolean existsByRoom_RoomIdAndIsActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Integer roomId,
            LocalDate startDate,
            LocalDate endDate
    );
    boolean existsByRoom_RoomIdAndIsActiveTrueAndRrIdNot(Integer roomId, Integer rrId);
}

