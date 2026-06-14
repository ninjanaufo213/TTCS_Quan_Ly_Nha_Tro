package com.example.demo.service;

import com.example.demo.model.House;
import com.example.demo.model.Listing;

import java.text.Normalizer;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

final class LocationSearchSupport {

    private static final Map<String, Set<String>> PROVINCE_DISTRICTS = Map.of(
            "ha noi", Set.of(
                    "ba dinh", "hoan kiem", "tay ho", "long bien", "cau giay", "dong da",
                    "hai ba trung", "hoang mai", "thanh xuan", "soc son", "dong anh", "gia lam",
                    "nam tu liem", "thanh tri", "bac tu liem", "me linh", "ha dong", "son tay",
                    "ba vi", "phuc tho", "dan phuong", "hoai duc", "quoc oai", "thach that",
                    "chuong my", "thanh oai", "thuong tin", "phu xuyen", "ung hoa", "my duc"
            ),
            "ho chi minh", Set.of(
                    "1", "3", "4", "5", "6", "7", "8", "10", "11", "12", "binh tan",
                    "binh thanh", "go vap", "phu nhuan", "tan binh", "tan phu", "thu duc",
                    "binh chanh", "can gio", "cu chi", "hoc mon", "nha be"
            ),
            "da nang", Set.of(
                    "hai chau", "thanh khe", "son tra", "ngu hanh son", "lien chieu",
                    "cam le", "hoa vang", "hoang sa"
            )
    );

    private static final Map<String, Set<String>> PROVINCE_ALIASES = Map.of(
            "ha noi", Set.of("ha noi", "hanoi", "thanh pho ha noi", "tp ha noi", "tp. ha noi"),
            "ho chi minh", Set.of(
                    "ho chi minh", "hcm", "tphcm", "tp hcm", "tp. hcm", "sai gon",
                    "saigon", "thanh pho ho chi minh", "tp ho chi minh", "tp. ho chi minh"
            ),
            "da nang", Set.of("da nang", "danang", "thanh pho da nang", "tp da nang", "tp. da nang")
    );

    private LocationSearchSupport() {
    }

    static Optional<String> resolveProvinceKeyword(String keyword) {
        String normalizedKeyword = normalize(keyword);
        if (normalizedKeyword.isEmpty()) {
            return Optional.empty();
        }

        return PROVINCE_ALIASES.entrySet().stream()
                .filter(entry -> entry.getValue().stream().anyMatch(alias ->
                        normalizedKeyword.equals(alias)
                                || normalizedKeyword.contains(alias)
                                || (normalizedKeyword.length() >= 4 && alias.contains(normalizedKeyword))
                ))
                .map(Map.Entry::getKey)
                .findFirst();
    }

    static boolean matchesProvince(Listing listing, String provinceName) {
        House house = getHouse(listing);
        if (house == null) {
            return false;
        }

        String expectedProvince = normalizeProvinceName(provinceName);
        if (expectedProvince.isEmpty()) {
            return true;
        }

        String actualProvince = normalizeProvinceName(house.getProvince());
        if (!actualProvince.isEmpty()) {
            return actualProvince.equals(expectedProvince);
        }

        return inferProvinceFromDistrict(house.getDistrict())
                .map(expectedProvince::equals)
                .orElse(false);
    }

    static boolean matchesKeyword(Listing listing, String keyword) {
        String normalizedKeyword = normalize(keyword);
        if (normalizedKeyword.isEmpty()) {
            return true;
        }

        House house = getHouse(listing);
        String inferredProvince = house == null
                ? ""
                : inferProvinceFromDistrict(house.getDistrict()).orElse("");

        return containsNormalized(listing.getTitle(), normalizedKeyword)
                || containsNormalized(listing.getDescription(), normalizedKeyword)
                || (house != null && (
                containsNormalized(house.getAddressLine(), normalizedKeyword)
                        || containsNormalized(house.getWard(), normalizedKeyword)
                        || containsNormalized(house.getDistrict(), normalizedKeyword)
                        || containsNormalized(house.getProvince(), normalizedKeyword)
                        || containsNormalized(inferredProvince, normalizedKeyword)
        ));
    }

    static String displayProvince(House house) {
        if (house == null) {
            return "";
        }
        if (hasText(house.getProvince())) {
            return house.getProvince();
        }
        return inferProvinceFromDistrict(house.getDistrict()).orElse("");
    }

    private static Optional<String> inferProvinceFromDistrict(String district) {
        String normalizedDistrict = normalizeDistrictName(district);
        if (normalizedDistrict.isEmpty()) {
            return Optional.empty();
        }

        return PROVINCE_DISTRICTS.entrySet().stream()
                .filter(entry -> entry.getValue().contains(normalizedDistrict))
                .map(Map.Entry::getKey)
                .findFirst();
    }

    private static House getHouse(Listing listing) {
        if (listing == null || listing.getRoom() == null) {
            return null;
        }
        return listing.getRoom().getHouse();
    }

    private static String normalizeProvinceName(String value) {
        return resolveProvinceKeyword(value).orElse(normalize(value));
    }

    private static String normalizeDistrictName(String value) {
        String normalized = normalize(value);
        return normalized
                .replaceFirst("^(quan|huyen|thi xa|thanh pho)\\s+", "")
                .trim();
    }

    private static boolean containsNormalized(String value, String normalizedKeyword) {
        return normalize(value).contains(normalizedKeyword);
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
        return normalized.replaceAll("\\s+", " ");
    }
}
