package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Contract_Services")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cs_id")
    private Integer csId;

    @ManyToOne
    @JoinColumn(name = "rr_id", nullable = false)
    private RentedRoom rentedRoom;

    @Column(name = "service_name", nullable = false, length = 100)
    private String serviceName;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 0)
    private BigDecimal unitPrice;

    @Column(name = "initial_number")
    private Integer initialNumber;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
