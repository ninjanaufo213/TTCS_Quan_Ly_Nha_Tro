package com.example.demo.service;

import com.example.demo.dto.ReviewReplyRequest;
import com.example.demo.dto.ReviewRequest;
import com.example.demo.dto.ReviewResponse;
import com.example.demo.dto.ReviewSummaryResponse;
import com.example.demo.model.Review;
import com.example.demo.model.Room;
import com.example.demo.model.Tenant;
import com.example.demo.repository.RentedRoomRepository;
import com.example.demo.repository.ReviewRepository;
import com.example.demo.repository.RoomRepository;
import com.example.demo.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final RentedRoomRepository rentedRoomRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public ReviewSummaryResponse getRoomReviews(Integer roomId) {
        ensureRoomExists(roomId);
        List<ReviewResponse> reviews = reviewRepository.findByRoom_RoomIdOrderByCreatedAtDesc(roomId).stream()
                .map(this::toResponse)
                .toList();

        return ReviewSummaryResponse.builder()
                .averageRating(reviewRepository.averageRatingByRoomId(roomId))
                .totalReviews(reviewRepository.countByRoom_RoomId(roomId))
                .reviews(reviews)
                .build();
    }

    @Transactional(readOnly = true)
    public ReviewResponse getMyReview(Integer roomId) {
        Tenant tenant = getCurrentTenant();
        return reviewRepository.findByTenant_TenantIdAndRoom_RoomId(tenant.getTenantId(), roomId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getLandlordReviews() {
        Integer landlordId = authService.getCurrentLandlordId();
        return reviewRepository.findByRoom_House_Landlord_LandlordIdOrderByCreatedAtDesc(landlordId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ReviewResponse saveMyReview(Integer roomId, ReviewRequest request) {
        validateRequest(request);
        Room room = ensureRoomExists(roomId);
        Tenant tenant = getCurrentTenant();

        boolean isCurrentTenantRoom = rentedRoomRepository
                .existsByTenant_TenantIdAndRoom_RoomIdAndIsActiveTrue(tenant.getTenantId(), roomId);
        if (!isCurrentTenantRoom) {
            throw new IllegalArgumentException("Bạn chỉ có thể đánh giá phòng đang thuê.");
        }

        Review review = reviewRepository.findByTenant_TenantIdAndRoom_RoomId(tenant.getTenantId(), roomId)
                .orElseGet(() -> Review.builder()
                        .tenant(tenant)
                        .room(room)
                        .build());

        review.setRating(request.getRating());
        review.setComment(normalizeComment(request.getComment()));

        return toResponse(reviewRepository.save(review));
    }

    public ReviewResponse replyToReview(Integer reviewId, ReviewReplyRequest request) {
        Integer landlordId = authService.getCurrentLandlordId();
        String reply = normalizeReply(request);

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá."));

        if (!isReviewOwnedByLandlord(review, landlordId)) {
            throw new SecurityException("Bạn không có quyền phản hồi đánh giá này.");
        }

        review.setLandlordReply(reply);
        review.setLandlordRepliedAt(LocalDateTime.now());

        return toResponse(reviewRepository.save(review));
    }

    private Tenant getCurrentTenant() {
        Integer tenantId = authService.getCurrentTenantId();
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin người thuê."));
    }

    private Room ensureRoomExists(Integer roomId) {
        if (roomId == null) {
            throw new IllegalArgumentException("Thiếu mã phòng.");
        }
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng không tồn tại."));
    }

    private void validateRequest(ReviewRequest request) {
        if (request == null || request.getRating() == null) {
            throw new IllegalArgumentException("Vui lòng chọn số sao đánh giá.");
        }
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Số sao đánh giá phải từ 1 đến 5.");
        }
    }

    private String normalizeComment(String comment) {
        if (comment == null || comment.isBlank()) {
            return null;
        }
        return comment.trim();
    }

    private String normalizeReply(ReviewReplyRequest request) {
        if (request == null || request.getReply() == null || request.getReply().isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập nội dung phản hồi.");
        }
        return request.getReply().trim();
    }

    private boolean isReviewOwnedByLandlord(Review review, Integer landlordId) {
        if (review == null || landlordId == null || review.getRoom() == null
                || review.getRoom().getHouse() == null || review.getRoom().getHouse().getLandlord() == null) {
            return false;
        }
        return landlordId.equals(review.getRoom().getHouse().getLandlord().getLandlordId());
    }

    private ReviewResponse toResponse(Review review) {
        Tenant tenant = review.getTenant();
        Room room = review.getRoom();
        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .roomId(room != null ? room.getRoomId() : null)
                .roomName(room != null ? room.getName() : null)
                .houseName(room != null && room.getHouse() != null ? room.getHouse().getName() : null)
                .tenantId(tenant != null ? tenant.getTenantId() : null)
                .tenantName(tenant != null ? tenant.getFullname() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .landlordReply(review.getLandlordReply())
                .landlordRepliedAt(review.getLandlordRepliedAt())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
