package com.example.demo.controller;

import com.example.demo.dto.RoomImageDto;
import com.example.demo.dto.RoomResponse;
import com.example.demo.config.TestFileStorageConfig;
import com.example.demo.service.RoomService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RoomController.class)
@Import(TestFileStorageConfig.class)
public class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    @Test
    public void getRoomById_Success() throws Exception {
        RoomImageDto image1 = new RoomImageDto(1, "http://example.com/image1.jpg", true);
        RoomImageDto image2 = new RoomImageDto(2, "http://example.com/image2.jpg", false);

        RoomResponse mockResponse = new RoomResponse(
                1,
                10,
                "Room 101",
                new BigDecimal("1500000"),
                2,
                true,
                "A nice room",
                LocalDateTime.now(),
                LocalDateTime.now(),
                List.of(image1, image2)
        );

        when(roomService.getRoomById(1)).thenReturn(Optional.of(mockResponse));

        mockMvc.perform(get("/api/rooms/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.room_id").value(1)) 
                .andExpect(jsonPath("$.name").value("Room 101"))
                .andExpect(jsonPath("$.price").value(1500000))
                .andExpect(jsonPath("$.images").isArray())
                .andExpect(jsonPath("$.images.length()").value(2))
                .andExpect(jsonPath("$.images[0].imageId").value(1))
                .andExpect(jsonPath("$.images[0].imageUrl").value("http://example.com/image1.jpg"))
                .andExpect(jsonPath("$.images[1].imageId").value(2));
    }

    @Test
    public void getRoomById_NotFound() throws Exception {
        when(roomService.getRoomById(anyInt())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/rooms/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
