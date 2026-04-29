package com.example.demo.controller;

import com.example.demo.dto.ListingRequest;
import com.example.demo.dto.ListingResponse;
import com.example.demo.service.ListingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@WebMvcTest(
    controllers = ListingController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = com.example.demo.config.WebConfig.class)
)
public class ListingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ListingService listingService;

    @MockBean
    private com.example.demo.service.FileStorageService fileStorageService;

    @Test
    void createListing_Success() throws Exception {
        ListingRequest request = ListingRequest.builder()
                .roomId(1)
                .title("Cho thue phong")
                .description("Phong dep gia re")
                .build();

        ListingResponse response = ListingResponse.builder()
                .listingId(1)
                .title("Cho thue phong")
                .description("Phong dep gia re")
                .isPublished(false)
                .build();

        when(listingService.createListing(any(ListingRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/landlord/listings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listing_id").value(1))
                .andExpect(jsonPath("$.title").value("Cho thue phong"))
                .andExpect(jsonPath("$.is_published").value(false));
    }

}
