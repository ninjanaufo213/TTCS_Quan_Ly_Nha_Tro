package com.example.demo.repository;

import com.example.demo.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Integer> {
    Optional<Tenant> findByUser_UserId(Integer userId);
    Optional<Tenant> findByUser_Phone(String phone);
    java.util.List<Tenant> findByUser_PhoneContainingIgnoreCase(String phone);
    java.util.List<Tenant> findByFullnameContainingIgnoreCase(String fullname);
}
