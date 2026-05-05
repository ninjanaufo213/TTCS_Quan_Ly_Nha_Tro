package com.example.demo.repository;

import com.example.demo.model.ContractRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractRequestRepository extends JpaRepository<ContractRequest, Integer> {
    List<ContractRequest> findByTenant_TenantIdOrderByCreatedAtDesc(Integer tenantId);

    List<ContractRequest> findByRoom_House_Landlord_LandlordIdOrderByCreatedAtDesc(Integer landlordId);

    List<ContractRequest> findByRentRequest_RequestIdAndStatusIn(Integer requestId, List<String> statuses);
}

