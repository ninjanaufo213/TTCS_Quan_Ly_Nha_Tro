package com.example.demo.controller;

import com.example.demo.dto.NotificationResponse;
import com.example.demo.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/api/notifications/me")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications() {
        return ResponseEntity.ok(notificationService.getMyNotifications());
    }

    @PatchMapping("/api/notifications/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(notificationService.markAsRead(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }

    @PatchMapping("/api/notifications/read-all")
    public ResponseEntity<?> markAllAsRead() {
        try {
            int updated = notificationService.markAllAsRead();
            return ResponseEntity.ok(Map.of("updated", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        }
    }
}
