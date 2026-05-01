package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invoice_id")
    private Integer invoiceId;

    @ManyToOne
    @JoinColumn(name = "rr_id", nullable = false)
    private RentedRoom rentedRoom;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 0)
    private BigDecimal totalAmount;

    @Column(name = "is_paid")
    private Boolean isPaid;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "proof_status", length = 20)
    private String proofStatus;

    @Column(name = "proof_url", columnDefinition = "TEXT")
    private String proofUrl;

    @Column(name = "proof_note", columnDefinition = "TEXT")
    private String proofNote;

    @Column(name = "proof_submitted_at")
    private LocalDateTime proofSubmittedAt;

    @Column(name = "proof_reviewed_at")
    private LocalDateTime proofReviewedAt;

    @Column(name = "proof_review_note", columnDefinition = "TEXT")
    private String proofReviewNote;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private List<InvoiceItem> invoiceItems;
}
