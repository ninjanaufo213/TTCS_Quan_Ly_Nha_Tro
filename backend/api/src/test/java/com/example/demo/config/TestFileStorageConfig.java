package com.example.demo.config;

import com.example.demo.service.FileStorageService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class TestFileStorageConfig {

    @Bean
    public FileStorageService fileStorageService() {
        // Use a test-specific upload directory to avoid touching production paths.
        return new FileStorageService("build/test-uploads");
    }
}

