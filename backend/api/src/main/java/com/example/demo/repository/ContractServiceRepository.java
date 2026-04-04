    package com.example.demo.repository;

import com.example.demo.model.ContractService;
import com.example.demo.model.RentedRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContractServiceRepository extends JpaRepository<ContractService, Integer> {
    List<ContractService> findByRentedRoom(RentedRoom rentedRoom);
}

