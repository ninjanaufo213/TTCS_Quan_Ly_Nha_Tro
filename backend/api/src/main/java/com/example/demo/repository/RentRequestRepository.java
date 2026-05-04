package com.example.demo.repository;

import com.example.demo.model.RentRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RentRequestRepository extends JpaRepository<RentRequest, Integer> {
    List<RentRequest> findByTenant_TenantIdOrderByVisitDateAscVisitTimeAsc(Integer tenantId);

    List<RentRequest> findByRoom_House_Landlord_LandlordIdOrderByVisitDateAscVisitTimeAsc(Integer landlordId);

    List<RentRequest> findByRoom_RoomIdAndStatus(Integer roomId, String status);

    List<RentRequest> findByRoom_RoomIdAndStatusIn(Integer roomId, List<String> statuses);
}

