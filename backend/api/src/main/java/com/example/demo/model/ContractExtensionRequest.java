package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "contract_extension_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractExtensionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "extension_request_id")
    private Integer extensionRequestId;

    @ManyToOne
    @JoinColumn(name = "rr_id", nullable = false)
    private RentedRoom rentedRoom;

    @ManyToOne
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "current_end_date")
    private LocalDate currentEndDate;

    @Column(name = "requested_end_date", nullable = false)
    private LocalDate requestedEndDate;

    @Column(length = 50)
    private String status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

