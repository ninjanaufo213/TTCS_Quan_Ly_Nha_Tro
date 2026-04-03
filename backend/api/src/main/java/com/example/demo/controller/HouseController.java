package com.example.demo.controller;

import com.example.demo.dto.HouseRequest;
import com.example.demo.dto.HouseResponse;
import com.example.demo.service.HouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/houses")
@CrossOrigin(origins = "*")
public class HouseController {

    private final HouseService houseService;

    @Autowired
    public HouseController(HouseService houseService) {
        this.houseService = houseService;
    }

    /**
     * Get all houses for current landlord
     */
    @GetMapping("/")
    public ResponseEntity<List<HouseResponse>> getAllHouses() {
        try {
            List<HouseResponse> houses = houseService.getAllHouses();
            return ResponseEntity.ok(houses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get a specific house by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<HouseResponse> getHouseById(@PathVariable("id") Integer id) {
        try {
            return houseService.getHouseById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Create a new house
     */
    @PostMapping("/")
    public ResponseEntity<?> createHouse(@RequestBody HouseRequest request) {
        try {
            HouseResponse house = houseService.createHouse(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(house);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", "Lỗi khi tạo nhà trọ: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Update an existing house
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateHouse(@PathVariable("id") Integer id, @RequestBody HouseRequest request) {
        try {
            HouseResponse house = houseService.updateHouse(id, request);
            return ResponseEntity.ok(house);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", "Lỗi khi cập nhật nhà trọ: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Delete a house
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHouse(@PathVariable("id") Integer id) {
        try {
            houseService.deleteHouse(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa nhà trọ thành công");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", "Lỗi khi xóa nhà trọ: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
