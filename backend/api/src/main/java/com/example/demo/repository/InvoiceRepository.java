package com.example.demo.repository;

import com.example.demo.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
    List<Invoice> findByRentedRoom_RrIdOrderByDueDateDescCreatedAtDesc(Integer rrId);

    List<Invoice> findByRentedRoom_Room_House_Landlord_LandlordIdOrderByDueDateDescCreatedAtDesc(Integer landlordId);

    List<Invoice> findByRentedRoom_Room_House_Landlord_LandlordIdAndIsPaidFalseOrderByDueDateAsc(Integer landlordId);
}

