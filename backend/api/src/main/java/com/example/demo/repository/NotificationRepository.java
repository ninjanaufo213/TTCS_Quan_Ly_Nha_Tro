package com.example.demo.repository;

import com.example.demo.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByRecipient_UserIdOrderByCreatedAtDesc(Integer userId);

    @Modifying
    @Query("update Notification n set n.isRead = true where n.recipient.userId = :userId and n.isRead = false")
    int markAllAsRead(@Param("userId") Integer userId);
}
