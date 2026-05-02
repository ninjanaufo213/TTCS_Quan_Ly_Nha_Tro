package com.example.demo.repository;

import com.example.demo.model.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Integer> {
    List<Listing> findByIsPublished(Boolean isPublished);

    @Query("""
            select l from Listing l
            join l.room r
            join r.house h
            where l.isPublished = true
              and (:keyword is null or :keyword = '' or
                   lower(l.title) like lower(concat('%', :keyword, '%')) or
                   lower(l.description) like lower(concat('%', :keyword, '%')) or
                   lower(h.addressLine) like lower(concat('%', :keyword, '%')) or
                   lower(h.ward) like lower(concat('%', :keyword, '%')) or
                   lower(h.district) like lower(concat('%', :keyword, '%')))
              and (:district is null or :district = '' or lower(h.district) like lower(concat('%', :district, '%')))
              and (:ward is null or :ward = '' or lower(h.ward) like lower(concat('%', :ward, '%')))
              and (:minPrice is null or r.price >= :minPrice)
              and (:maxPrice is null or r.price <= :maxPrice)
              and (:minArea is null or r.area >= :minArea)
              and (:maxArea is null or r.area <= :maxArea)
            """)
    List<Listing> searchPublishedListings(
            @Param("keyword") String keyword,
            @Param("district") String district,
            @Param("ward") String ward,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minArea") Double minArea,
            @Param("maxArea") Double maxArea
    );
}
