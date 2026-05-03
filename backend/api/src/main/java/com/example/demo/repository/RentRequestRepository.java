package com.example.demo.repository;

import com.example.demo.model.RentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentRequestRepository extends JpaRepository<RentRequest, Integer> {
    List<RentRequest> findByRoom_House_Landlord_LandlordId(Integer landlordId);
    List<RentRequest> findByTenant_TenantId(Integer tenantId);
}
