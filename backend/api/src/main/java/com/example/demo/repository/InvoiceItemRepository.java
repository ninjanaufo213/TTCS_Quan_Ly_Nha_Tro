package com.example.demo.repository;

import com.example.demo.model.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Integer> {
    void deleteByInvoice_InvoiceId(Integer invoiceId);

    List<InvoiceItem> findByInvoice_InvoiceId(Integer invoiceId);
}
