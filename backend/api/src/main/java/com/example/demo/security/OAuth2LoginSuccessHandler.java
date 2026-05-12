package com.example.demo.security;

import com.example.demo.model.User;
import com.example.demo.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final HttpSessionOAuth2AuthorizationRequestRepository authorizationRequestRepository =
            new HttpSessionOAuth2AuthorizationRequestRepository();

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    public OAuth2LoginSuccessHandler(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");

        OAuth2AuthorizationRequest authorizationRequest =
                authorizationRequestRepository.removeAuthorizationRequest(request, response);

        String requestedRole = null;
        if (authorizationRequest != null) {
            Object role = authorizationRequest.getAdditionalParameters().get("role");
            if (role != null) {
                requestedRole = role.toString();
            }
        }

        if (email == null || email.isBlank()) {
            redirectError(response, "Không lấy được email từ nhà cung cấp đăng nhập.");
            return;
        }

        User user = authService.findOrCreateOAuthUser(email, name, requestedRole);

        String redirectUrl = String.format(
                "%s/oauth2/redirect?success=true&userId=%d&email=%s&role=%s",
                frontendBaseUrl,
                user.getUserId(),
                URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8),
                URLEncoder.encode(user.getRole(), StandardCharsets.UTF_8)
        );

        response.sendRedirect(redirectUrl);
    }

    private void redirectError(HttpServletResponse response, String message) throws IOException {
        String redirectUrl = String.format(
                "%s/oauth2/redirect?success=false&message=%s",
                frontendBaseUrl,
                URLEncoder.encode(message, StandardCharsets.UTF_8)
        );
        response.sendRedirect(redirectUrl);
    }
}

