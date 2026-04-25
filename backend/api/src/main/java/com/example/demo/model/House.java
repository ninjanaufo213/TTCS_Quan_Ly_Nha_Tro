package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "houses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class House {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "house_id")
    private Integer houseId;

    @ManyToOne
    @JoinColumn(name = "landlord_id", nullable = false)
    private Landlord landlord;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "floor_count")
    private Integer floorCount;

    @Column(name = "address_line", length = 500)
    private String addressLine;

    @Column(length = 100)
    private String ward;

    @Column(length = 100)
    private String district;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "house", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private List<HouseImage> images;

    @OneToMany(mappedBy = "house", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private List<Room> rooms;
}
