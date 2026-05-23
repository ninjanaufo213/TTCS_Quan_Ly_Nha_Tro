package com.example.demo.config;

import com.example.demo.security.CustomOAuth2AuthorizationRequestResolver;
import com.example.demo.security.OAuth2LoginFailureHandler;
import com.example.demo.security.OAuth2LoginSuccessHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public CustomOAuth2AuthorizationRequestResolver authorizationRequestResolver(
            ClientRegistrationRepository clientRegistrationRepository
    ) {
        return new CustomOAuth2AuthorizationRequestResolver(clientRegistrationRepository);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            CustomOAuth2AuthorizationRequestResolver resolver,
            OAuth2LoginSuccessHandler successHandler,
            OAuth2LoginFailureHandler failureHandler
    ) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/oauth2/**", "/login/**", "/error", "/api/**").permitAll()
                        .anyRequest().permitAll()
                )
                .oauth2Login(oauth -> oauth
                        .authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(resolver))
                        .successHandler(successHandler)
                        .failureHandler(failureHandler)
                )
                .logout(Customizer.withDefaults());

        return http.build();
    }
}

