package com.example.demo.controller;

import com.example.demo.dto.AdminUserDTO;
import com.example.demo.dto.AdminUserUpdateDTO;
import com.example.demo.service.AdminUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AdminUserController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminUserService adminUserService;

    @Autowired
    private ObjectMapper objectMapper;

    private AdminUserDTO user1;
    private AdminUserDTO user2;

    @BeforeEach
    void setUp() {
        user1 = new AdminUserDTO(1, "ADMIN", "admin@test.com", "0123456789", true, true, LocalDateTime.now(), LocalDateTime.now());
        user2 = new AdminUserDTO(2, "TENANT", "tenant@test.com", "0987654321", false, false, LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    public void getAllUsers_Returns200AndUsersList() throws Exception {
        Mockito.when(adminUserService.getAllUsers()).thenReturn(Arrays.asList(user1, user2));

        mockMvc.perform(get("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("admin@test.com"))
                .andExpect(jsonPath("$[1].email").value("tenant@test.com"));
    }

    @Test
    public void toggleUserStatus_Success_Returns200() throws Exception {
        Mockito.doNothing().when(adminUserService).toggleUserStatus(1);

        mockMvc.perform(patch("/api/admin/users/1/toggle-status"))
                .andExpect(status().isOk());
    }

    @Test
    public void toggleUserStatus_NotFound_Returns400() throws Exception {
        Mockito.doThrow(new IllegalArgumentException("Not found")).when(adminUserService).toggleUserStatus(99);

        mockMvc.perform(patch("/api/admin/users/99/toggle-status"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void toggleUserVerification_Success_Returns200() throws Exception {
        Mockito.doNothing().when(adminUserService).toggleUserVerification(1);

        mockMvc.perform(patch("/api/admin/users/1/toggle-verification"))
                .andExpect(status().isOk());
    }

    @Test
    public void toggleUserVerification_NotFound_Returns400() throws Exception {
        Mockito.doThrow(new IllegalArgumentException("Not found")).when(adminUserService).toggleUserVerification(99);

        mockMvc.perform(patch("/api/admin/users/99/toggle-verification"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void updateUser_Success_Returns200() throws Exception {
        AdminUserUpdateDTO dto = new AdminUserUpdateDTO("LANDLORD", "new@test.com", "111111111");

        Mockito.doNothing().when(adminUserService).updateUser(eq(1), any(AdminUserUpdateDTO.class));

        mockMvc.perform(put("/api/admin/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    public void updateUser_NotFound_Returns400() throws Exception {
        AdminUserUpdateDTO dto = new AdminUserUpdateDTO("LANDLORD", "new@test.com", "111111111");

        Mockito.doThrow(new IllegalArgumentException("Not found")).when(adminUserService).updateUser(eq(99), any(AdminUserUpdateDTO.class));

        mockMvc.perform(put("/api/admin/users/99")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void deleteUser_Success_Returns200() throws Exception {
        Mockito.doNothing().when(adminUserService).deleteUser(1);

        mockMvc.perform(delete("/api/admin/users/1"))
                .andExpect(status().isOk());
    }

    @Test
    public void deleteUser_NotFound_Returns400() throws Exception {
        Mockito.doThrow(new IllegalArgumentException("Not found")).when(adminUserService).deleteUser(99);

        mockMvc.perform(delete("/api/admin/users/99"))
                .andExpect(status().isBadRequest());
    }
}
