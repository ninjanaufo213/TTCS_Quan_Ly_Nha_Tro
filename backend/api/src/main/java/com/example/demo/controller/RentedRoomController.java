package com.example.demo.controller;

import com.example.demo.dto.RentedRoomRequest;
import com.example.demo.dto.RentedRoomResponse;
import com.example.demo.service.RentedRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rented-rooms")
@CrossOrigin(origins = "*")
public class RentedRoomController {

    private final RentedRoomService rentedRoomService;

    @Autowired
    public RentedRoomController(RentedRoomService rentedRoomService) {
        this.rentedRoomService = rentedRoomService;
    }

    /**
     * Lấy tất cả hợp đồng
     */
    @GetMapping({"", "/"})
    public ResponseEntity<List<RentedRoomResponse>> getAllRentedRooms() {
        try {
            List<RentedRoomResponse> rentedRooms = rentedRoomService.getAllRentedRooms();
            return ResponseEntity.ok(rentedRooms);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Lấy hợp đồng theo phòng
     */
    @GetMapping("/room/{roomId}")
    public ResponseEntity<?> getRentedRoomsByRoom(@PathVariable("roomId") Integer roomId) {
        try {
            List<RentedRoomResponse> rentedRooms = rentedRoomService.getRentedRoomsByRoom(roomId);
            return ResponseEntity.ok(rentedRooms);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Lấy hợp đồng theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getRentedRoomById(@PathVariable("id") Integer id) {
        try {
            RentedRoomResponse rentedRoom = rentedRoomService.getRentedRoomById(id);
            return ResponseEntity.ok(rentedRoom);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Tạo hợp đồng mới
     */
    @PostMapping({"", "/"})
    public ResponseEntity<?> createRentedRoom(@RequestBody RentedRoomRequest request) {
        try {
            RentedRoomResponse rentedRoom = rentedRoomService.createRentedRoom(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(rentedRoom);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi tạo hợp đồng: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Cập nhật hợp đồng
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRentedRoom(@PathVariable("id") Integer id, @RequestBody RentedRoomRequest request) {
        try {
            RentedRoomResponse rentedRoom = rentedRoomService.updateRentedRoom(id, request);
            return ResponseEntity.ok(rentedRoom);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi cập nhật hợp đồng: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Chấm dứt hợp đồng
     */
    @PostMapping("/{id}/terminate")
    public ResponseEntity<?> terminateRentedRoom(@PathVariable("id") Integer id) {
        try {
            RentedRoomResponse rentedRoom = rentedRoomService.terminateRentedRoom(id);
            return ResponseEntity.ok(rentedRoom);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi chấm dứt hợp đồng: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Xóa hợp đồng
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRentedRoom(@PathVariable("id") Integer id) {
        try {
            rentedRoomService.deleteRentedRoom(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa hợp đồng thành công!");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi xóa hợp đồng: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
