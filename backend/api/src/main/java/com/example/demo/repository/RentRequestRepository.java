package com.example.demo.repository;

import com.example.demo.model.RentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentRequestRepository extends JpaRepository<RentRequest, Integer> {
    List<RentRequest> findByRoom_House_Landlord_LandlordId(Integer landlordId);
    List<RentRequest> findByTenant_TenantId(Integer tenantId);
		List<RentRequest> findByTenant_TenantIdOrderByVisitDateAscVisitTimeAsc(Integer tenantId);

    List<RentRequest> findByRoom_House_Landlord_LandlordIdOrderByVisitDateAscVisitTimeAsc(Integer landlordId);

    List<RentRequest> findByRoom_RoomIdAndStatus(Integer roomId, String status);

    List<RentRequest> findByRoom_RoomIdAndStatusIn(Integer roomId, List<String> statuses);
}

