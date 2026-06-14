package com.example.demo.controller;

import com.example.demo.dto.HouseResponse;
import com.example.demo.config.TestFileStorageConfig;
import com.example.demo.service.HouseService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HouseController.class)
@Import(TestFileStorageConfig.class)
public class HouseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HouseService houseService;

    private HouseResponse createMockHouse(Integer id, Double lat, Double lng) {
        return new HouseResponse(
                id, 1, "Landlord Name", "0123456789", "House " + id, 3,
                "123 Test Street", "Ward 1", "District 1", "Province 1",
                lat, lng,
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    @Test
    public void createHouse_WithCoordinates_Returns201() throws Exception {
        HouseResponse mockResponse = createMockHouse(1, 21.0285, 105.8542);
        when(houseService.createHouse(any())).thenReturn(mockResponse);

        String payload = """
                {
                    "name": "House 1",
                    "floor_count": 3,
                    "address_line": "123 Test Street",
                    "ward": "Ward 1",
                    "district": "District 1",
                    "latitude": 21.0285,
                    "longitude": 105.8542
                }
                """;

        mockMvc.perform(post("/api/houses/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.house_id").value(1))
                .andExpect(jsonPath("$.name").value("House 1"))
                .andExpect(jsonPath("$.latitude").value(21.0285))
                .andExpect(jsonPath("$.longitude").value(105.8542));
    }

    @Test
    public void createHouse_WithoutCoordinates_Returns201() throws Exception {
        HouseResponse mockResponse = createMockHouse(2, null, null);
        when(houseService.createHouse(any())).thenReturn(mockResponse);

        String payload = """
                {
                    "name": "House 2",
                    "floor_count": 2,
                    "address_line": "456 Test Road",
                    "ward": "Ward 2",
                    "district": "District 2"
                }
                """;

        mockMvc.perform(post("/api/houses/")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.house_id").value(2));
    }

    @Test
    public void updateHouse_WithCoordinates_Returns200() throws Exception {
        HouseResponse mockResponse = createMockHouse(1, 10.7769, 106.7009);
        when(houseService.updateHouse(eq(1), any())).thenReturn(mockResponse);

        String payload = """
                {
                    "name": "House 1",
                    "floor_count": 3,
                    "address_line": "789 Updated Street",
                    "ward": "Ward 5",
                    "district": "District 3",
                    "latitude": 10.7769,
                    "longitude": 106.7009
                }
                """;

        mockMvc.perform(put("/api/houses/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.latitude").value(10.7769))
                .andExpect(jsonPath("$.longitude").value(106.7009));
    }

    @Test
    public void getHouseById_WithCoordinates_Returns200() throws Exception {
        HouseResponse mockResponse = createMockHouse(1, 21.0285, 105.8542);
        when(houseService.getHouseById(1)).thenReturn(Optional.of(mockResponse));

        mockMvc.perform(get("/api/houses/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.house_id").value(1))
                .andExpect(jsonPath("$.latitude").value(21.0285))
                .andExpect(jsonPath("$.longitude").value(105.8542));
    }

    @Test
    public void getHouseById_NotFound_Returns404() throws Exception {
        when(houseService.getHouseById(anyInt())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/houses/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    public void getAllHouses_Returns200() throws Exception {
        List<HouseResponse> mockList = List.of(
                createMockHouse(1, 21.0285, 105.8542),
                createMockHouse(2, 10.7769, 106.7009)
        );
        when(houseService.getAllHouses()).thenReturn(mockList);

        mockMvc.perform(get("/api/houses/")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].latitude").value(21.0285))
                .andExpect(jsonPath("$[1].longitude").value(106.7009));
    }
}
