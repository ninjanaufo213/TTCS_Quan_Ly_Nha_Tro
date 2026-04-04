package com.example.demo.repository;

import com.example.demo.model.RentedRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentedRoomRepository extends JpaRepository<RentedRoom, Integer> {
    List<RentedRoom> findByRoom_RoomId(Integer roomId);
    List<RentedRoom> findByTenant_TenantId(Integer tenantId);
    List<RentedRoom> findByIsActiveTrue();
    List<RentedRoom> findByIsActiveFalse();
}

