package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Integer owner_id; // For UI compatibility
    private String email;
    private String phone;
    private RoleWrapper role;
    private String fullname;
    private Boolean is_active;
    private LocalDateTime created_at;
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RoleWrapper {
        private String authority;
    }
}
