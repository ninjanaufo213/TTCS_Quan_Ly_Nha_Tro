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

    List<Listing> findByRoom_House_Landlord_LandlordId(Integer landlordId);

    @Query("""
            select l from Listing l
            join l.room r
            join r.house h
            where l.isPublished = true
              and r.isAvailable = true
              and (:keyword is null or :keyword = '' or
                   lower(l.title) like lower(concat('%', :keyword, '%')) or
                   lower(l.description) like lower(concat('%', :keyword, '%')) or
                   lower(h.addressLine) like lower(concat('%', :keyword, '%')) or
                   lower(h.ward) like lower(concat('%', :keyword, '%')) or
                   lower(h.province) like lower(concat('%', :keyword, '%')) or
                   lower(h.district) like lower(concat('%', :keyword, '%')))
              and (:province is null or :province = '' or lower(h.province) like lower(concat('%', :province, '%')))
              and (:district is null or :district = '' or lower(h.district) like lower(concat('%', :district, '%')))
              and (:ward is null or :ward = '' or lower(h.ward) like lower(concat('%', :ward, '%')))
              and (:minPrice is null or r.price >= :minPrice)
              and (:maxPrice is null or r.price <= :maxPrice)
              and (:minArea is null or r.area >= :minArea)
              and (:maxArea is null or r.area <= :maxArea)
            """)
    List<Listing> searchPublishedListings(
            @Param("keyword") String keyword,
            @Param("province") String province,
            @Param("district") String district,
            @Param("ward") String ward,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minArea") Double minArea,
            @Param("maxArea") Double maxArea
    );

    // Area demand statistics: aggregate by district
    @Query("""
            SELECT h.district,
                   COALESCE(SUM(l.viewsCount), 0),
                   COUNT(l),
                   COALESCE(AVG(r.price), 0)
            FROM Listing l
            JOIN l.room r
            JOIN r.house h
            WHERE l.isPublished = true
              AND h.district IS NOT NULL
              AND h.district <> ''
            GROUP BY h.district
            ORDER BY SUM(l.viewsCount) DESC
            """)
    List<Object[]> aggregateByDistrict();

    // Find the top ward (most listings) per district
    @Query("""
            SELECT h.district, h.ward, COUNT(l)
            FROM Listing l
            JOIN l.room r
            JOIN r.house h
            WHERE l.isPublished = true
              AND h.district IS NOT NULL
              AND h.district <> ''
              AND h.ward IS NOT NULL
              AND h.ward <> ''
            GROUP BY h.district, h.ward
            ORDER BY h.district, COUNT(l) DESC
            """)
    List<Object[]> topWardPerDistrict();

    @Query(value = """
            SELECT l.listing_id,
                   ( 6371 * acos( cos( radians(:latitude) )
                                * cos( radians( h.latitude ) )
                                * cos( radians( h.longitude ) - radians(:longitude) )
                                + sin( radians(:latitude) )
                                * sin( radians( h.latitude ) ) ) ) AS distance
            FROM listings l
            JOIN rooms r ON l.room_id = r.room_id
            JOIN houses h ON r.house_id = h.house_id
            WHERE l.is_published = true
              AND r.is_available = true
              AND h.latitude IS NOT NULL
              AND h.longitude IS NOT NULL
            HAVING distance <= :radius
            ORDER BY distance ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findRecommendedListingIdsAndDistances(@Param("latitude") Double latitude,
                                                         @Param("longitude") Double longitude,
                                                         @Param("radius") Double radius,
                                                         @Param("limit") Integer limit);
}
