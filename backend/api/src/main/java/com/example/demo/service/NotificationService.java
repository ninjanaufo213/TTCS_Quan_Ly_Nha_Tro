package com.example.demo.service;

import com.example.demo.dto.NotificationResponse;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    public NotificationService(NotificationRepository notificationRepository, AuthService authService) {
        this.notificationRepository = notificationRepository;
        this.authService = authService;
    }

    public void notifyUser(User recipient, User sender, String title, String message, String type, Integer referenceId) {
        if (recipient == null) {
            return;
        }
        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getMyNotifications() {
        Integer userId = authService.getCurrentUserId();
        return notificationRepository.findByRecipient_UserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public NotificationResponse markAsRead(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Thông báo không tồn tại"));

        Integer userId = authService.getCurrentUserId();
        if (notification.getRecipient() == null || !notification.getRecipient().getUserId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền cập nhật thông báo này");
        }

        notification.setIsRead(true);
        return mapToResponse(notificationRepository.save(notification));
    }

    public int markAllAsRead() {
        Integer userId = authService.getCurrentUserId();
        return notificationRepository.markAllAsRead(userId);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.getIsRead())
                .referenceId(notification.getReferenceId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
