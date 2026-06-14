package com.example.demo.controller;

import com.example.demo.dto.ListingRequest;
import com.example.demo.dto.ListingResponse;
import com.example.demo.service.ListingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
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

@WebMvcTest(ListingController.class)
@AutoConfigureMockMvc(addFilters = false)
public class ListingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ListingService listingService;

    // Use TestConfiguration instead of MockBean for FileStorageService to allow setup before context loads

    @org.springframework.boot.test.context.TestConfiguration
    static class MockConfig {
        @org.springframework.context.annotation.Bean
        @org.springframework.context.annotation.Primary
        public com.example.demo.service.FileStorageService fileStorageService() {
            com.example.demo.service.FileStorageService mock = org.mockito.Mockito.mock(com.example.demo.service.FileStorageService.class);
            org.mockito.Mockito.when(mock.getUploadRoot()).thenReturn(java.nio.file.Paths.get("uploads"));
            return mock;
        }
    }

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
    @Test
    void getRecommendedListings_Success() throws Exception {
        java.util.List<ListingResponse> mockResponse = java.util.Collections.singletonList(
                ListingResponse.builder()
                        .listingId(1)
                        .title("Phong tro gan DH BKHN")
                        .distance(2.5)
                        .build()
        );

        when(listingService.getRecommendedListings(any(), any(), any(), any())).thenReturn(mockResponse);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/listings/recommendations")
                        .param("latitude", "21.0")
                        .param("longitude", "105.8")
                        .param("radius", "5.0")
                        .param("limit", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].listing_id").value(1))
                .andExpect(jsonPath("$[0].distance").value(2.5));
    }

    @Test
    void searchPublishedListings_WithLocation_Success() throws Exception {
        java.util.List<ListingResponse> mockResponse = java.util.Collections.singletonList(
                ListingResponse.builder()
                        .listingId(2)
                        .title("Phong tro quan Cau Giay")
                        .build()
        );

        when(listingService.searchPublishedListings(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(mockResponse);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/listings/search")
                        .param("latitude", "21.03")
                        .param("longitude", "105.80")
                        .param("radius", "2.0")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].listing_id").value(2))
                .andExpect(jsonPath("$[0].title").value("Phong tro quan Cau Giay"));
    }
}
