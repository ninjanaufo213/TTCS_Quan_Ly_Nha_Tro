package com.example.demo.controller;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.UpdateProfileRequest;
import com.example.demo.model.Tenant;
import com.example.demo.model.User;
import com.example.demo.repository.LandlordRepository;
import com.example.demo.repository.TenantRepository;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private TenantRepository tenantRepository;

    @MockBean
    private LandlordRepository landlordRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private User tenantUser;
    private Tenant tenant;

    @BeforeEach
    void setUp() {
        tenantUser = new User();
        tenantUser.setUserId(1);
        tenantUser.setEmail("tenant@example.com");
        tenantUser.setPhone("0123456789");
        tenantUser.setPassword("password123");
        tenantUser.setRole("TENANT");
        tenantUser.setIsActive(true);
        tenantUser.setCreatedAt(LocalDateTime.now());

        tenant = new Tenant();
        tenant.setTenantId(1);
        tenant.setUser(tenantUser);
        tenant.setFullname("Tran Van Tenant");
        
        tenantUser.setTenant(tenant);
    }

    @Test
    void getUserProfile_Success() throws Exception {
        when(userRepository.findById(1)).thenReturn(Optional.of(tenantUser));

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("tenant@example.com"))
                .andExpect(jsonPath("$.fullname").value("Tran Van Tenant"))
                .andExpect(jsonPath("$.role.authority").value("TENANT"));
    }

    @Test
    void getUserProfile_NotFound() throws Exception {
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateProfile_Success() throws Exception {
        when(userRepository.findById(1)).thenReturn(Optional.of(tenantUser));
        when(userRepository.findByPhone("0987654321")).thenReturn(Optional.empty());

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullname("New Name");
        request.setPhone("0987654321");

        mockMvc.perform(patch("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(userRepository).save(any(User.class));
        verify(tenantRepository).save(any(Tenant.class));
    }

    @Test
    void changePassword_Success() throws Exception {
        when(userRepository.findById(1)).thenReturn(Optional.of(tenantUser));

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOld_password("password123");
        request.setNew_password("newpassword123");

        mockMvc.perform(patch("/api/users/1/password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(userRepository).save(any(User.class));
    }

    @Test
    void changePassword_WrongOldPassword() throws Exception {
        when(userRepository.findById(1)).thenReturn(Optional.of(tenantUser));

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOld_password("wrongpassword");
        request.setNew_password("newpassword123");

        mockMvc.perform(patch("/api/users/1/password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Mật khẩu cũ không chính xác"));
    }
}
