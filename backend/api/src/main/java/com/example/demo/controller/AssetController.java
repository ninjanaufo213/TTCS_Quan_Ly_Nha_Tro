package com.example.demo.controller;

import com.example.demo.dto.AssetRequest;
import com.example.demo.dto.AssetResponse;
import com.example.demo.service.AssetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

    private final AssetService assetService;

    @Autowired
    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    /**
     * Get all assets for a specific room
     */
    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<AssetResponse>> getAssetsByRoom(@PathVariable("roomId") Integer roomId) {
        try {
            List<AssetResponse> assets = assetService.getAssetsByRoom(roomId);
            return ResponseEntity.ok(assets);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get a specific asset by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<AssetResponse> getAssetById(@PathVariable("id") Integer id) {
        try {
            AssetResponse asset = assetService.getAssetById(id);
            return ResponseEntity.ok(asset);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Create a new asset for a room
     */
    @PostMapping("/{roomId}")
    public ResponseEntity<?> createAsset(@PathVariable("roomId") Integer roomId, @RequestBody AssetRequest request) {
        try {
            AssetResponse asset = assetService.createAsset(roomId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(asset);
        } catch (IllegalStateException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", "Lỗi khi tạo tài sản: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Update an existing asset
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAsset(@PathVariable("id") Integer id, @RequestBody AssetRequest request) {
        try {
            AssetResponse asset = assetService.updateAsset(id, request);
            return ResponseEntity.ok(asset);
        } catch (IllegalStateException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", "Lỗi khi cập nhật tài sản: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Delete an asset
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAsset(@PathVariable("id") Integer id) {
        try {
            assetService.deleteAsset(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa tài sản thành công");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("detail", "Lỗi khi xóa tài sản: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
