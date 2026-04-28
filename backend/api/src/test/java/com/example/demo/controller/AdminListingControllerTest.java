package com.example.demo.controller;

import com.example.demo.dto.ListingResponse;
import com.example.demo.config.TestFileStorageConfig;
import com.example.demo.service.ListingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminListingController.class)
@Import(TestFileStorageConfig.class)
public class AdminListingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ListingService listingService;

    @Test
    void getAllListings_Success() throws Exception {
        ListingResponse mockResp = ListingResponse.builder()
                .listingId(1)
                .title("Phong tro Demo")
                .isPublished(false)
                .build();
        when(listingService.getAllListings()).thenReturn(Arrays.asList(mockResp));

        mockMvc.perform(get("/api/admin/listings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].listingId").value(1))
                .andExpect(jsonPath("$[0].title").value("Phong tro Demo"));
    }

    @Test
    void approveListing_Success() throws Exception {
        ListingResponse mockResp = ListingResponse.builder()
                .listingId(1)
                .isPublished(true)
                .build();
        when(listingService.approveListing(anyInt())).thenReturn(mockResp);

        mockMvc.perform(patch("/api/admin/listings/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isPublished").value(true));
    }
}
