package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contract_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_request_id")
    private Integer contractRequestId;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private RentRequest rentRequest;

    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(length = 50)
    private String status;

    @Column(name = "number_of_tenants")
    private Integer numberOfTenants;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "monthly_rent", nullable = false, precision = 18, scale = 0)
    private BigDecimal monthlyRent;

    @Column(precision = 18, scale = 0)
    private BigDecimal deposit;

    @Column(name = "contract_url", columnDefinition = "TEXT")
    private String contractUrl;

    @Column(name = "water_price", precision = 18, scale = 0)
    private BigDecimal waterPrice;

    @Column(name = "internet_price", precision = 18, scale = 0)
    private BigDecimal internetPrice;

    @Column(name = "general_price", precision = 18, scale = 0)
    private BigDecimal generalPrice;

    @Column(name = "initial_electricity_num")
    private Integer initialElectricityNum;

    @Column(name = "electricity_unit_price", precision = 18, scale = 0)
    private BigDecimal electricityUnitPrice;

    @Column(name = "landlord_signature", columnDefinition = "LONGTEXT")
    private String landlordSignature;

    @Column(name = "tenant_signature", columnDefinition = "LONGTEXT")
    private String tenantSignature;

    @Column(name = "landlord_signed_at")
    private LocalDateTime landlordSignedAt;

    @Column(name = "tenant_signed_at")
    private LocalDateTime tenantSignedAt;

    @Column(name = "landlord_sign_metadata", columnDefinition = "TEXT")
    private String landlordSignMetadata;

    @Column(name = "tenant_sign_metadata", columnDefinition = "TEXT")
    private String tenantSignMetadata;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

