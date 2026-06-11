package com.example.demo.service;

import com.example.demo.model.Listing;
import com.example.demo.model.RoomImage;
import com.example.demo.repository.ListingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class GeminiService {

    @Value("${gemini.api-key:dummy}")
    private String apiKey;

    private final ListingRepository listingRepository;
    private final RestTemplate restTemplate;

    public GeminiService(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
        this.restTemplate = new RestTemplate();
    }

    public void analyzeAndApproveListingAsync(Listing listing) {
        CompletableFuture.runAsync(() -> {
            if (apiKey == null || apiKey.isEmpty() || "dummy".equals(apiKey)) {
                System.out.println("[GEMINI AI] Cảnh báo: API Key chưa được cấu hình. Hệ thống sẽ bỏ qua bước check AI và duyệt tự động.");
                listing.setIsPublished(true);
                listingRepository.save(listing);
                return;
            }

            System.out.println("[GEMINI AI] Đang kiểm tra phòng trọ (ID: " + listing.getRoom().getRoomId() + ") với API Key: " + apiKey.substring(0, 5) + "... ***");

            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

                List<Map<String, Object>> parts = new ArrayList<>();
                parts.add(Map.of("text", "Bạn là một kiểm duyệt viên nền tảng cho thuê phòng trọ. Hãy phân tích các hình ảnh và mô tả sau. Trả lời bắt đầu bằng 'YES' nếu hình ảnh thực sự là phòng trọ/nhà ở hợp lệ, sạch sẽ và không chứa nội dung nhạy cảm hay quảng cáo rác. Nếu hình ảnh không hợp lệ (không phải là phòng, ảnh selfie, v.v.), trả lời bắt đầu bằng 'NO' và kèm theo lý do từ chối rõ ràng. Mô tả phòng: " + (listing.getDescription() != null ? listing.getDescription() : "")));

                if (listing.getRoom() != null && listing.getRoom().getImages() != null) {
                    int imageCount = 0;
                    for (RoomImage image : listing.getRoom().getImages()) {
                        if (imageCount >= 1) break; // Chỉ lấy 1 ảnh
                        String imageUrl = image.getImageUrl();
                        if (imageUrl != null && imageUrl.startsWith("data:image")) {
                            String[] split = imageUrl.split(",");
                            if (split.length == 2) {
                                String mimeType = split[0].substring(5, split[0].indexOf(";"));
                                String base64Data = split[1];
                                parts.add(Map.of("inline_data", Map.of("mime_type", mimeType, "data", base64Data)));
                                imageCount++;
                            }
                        }
                    }
                }

                Map<String, Object> requestBody = Map.of(
                        "contents", List.of(Map.of("parts", parts)),
                        "generationConfig", Map.of("temperature", 0.1, "maxOutputTokens", 200)
                );

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
                Map<String, Object> body = response.getBody();

                boolean isApproved = false;
                String aiReason = "";
                if (body != null && body.containsKey("candidates")) {
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                    if (candidates != null && !candidates.isEmpty()) {
                        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                        if (content != null) {
                            List<Map<String, Object>> resParts = (List<Map<String, Object>>) content.get("parts");
                            if (resParts != null && !resParts.isEmpty()) {
                                String text = (String) resParts.get(0).get("text");
                                if (text != null) {
                                    aiReason = text.trim();
                                    if (aiReason.toUpperCase().startsWith("YES")) {
                                        isApproved = true;
                                    }
                                }
                            }
                        } else {
                            System.err.println("[GEMINI AI] Phản hồi không có nội dung (có thể bị chặn bởi bộ lọc an toàn hoặc cấu trúc JSON khác dự kiến).");
                        }
                    }
                }

                listing.setIsPublished(isApproved);
                listingRepository.save(listing);

                if (isApproved) {
                    System.out.println("[GEMINI AI] Kết quả kiểm duyệt: ĐẠT CHUẨN (YES) -> Đã tự động duyệt");
                } else {
                    System.out.println("[GEMINI AI] Kết quả kiểm duyệt: TỪ CHỐI (NO) -> Chuyển sang chờ duyệt tay. Lý do: " + aiReason);
                }

            } catch (Exception e) {
                System.err.println("[GEMINI AI] Lỗi khi gọi API: " + e.getMessage());
                if (e instanceof org.springframework.web.client.HttpStatusCodeException) {
                    System.err.println("[GEMINI AI] Chi tiết lỗi: " + ((org.springframework.web.client.HttpStatusCodeException) e).getResponseBodyAsString());
                }
                // Nếu lỗi gọi API, cứ giữ nguyên false (chờ duyệt) để Admin xử lý thủ công
            }
        });
    }
}
