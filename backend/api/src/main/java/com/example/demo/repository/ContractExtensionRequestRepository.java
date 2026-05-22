package com.example.demo.repository;

import com.example.demo.model.ContractExtensionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractExtensionRequestRepository extends JpaRepository<ContractExtensionRequest, Integer> {
    List<ContractExtensionRequest> findByTenant_TenantIdOrderByCreatedAtDesc(Integer tenantId);
    List<ContractExtensionRequest> findByRentedRoom_Room_House_Landlord_LandlordIdOrderByCreatedAtDesc(Integer landlordId);
    boolean existsByRentedRoom_RrIdAndStatus(Integer rrId, String status);
}

