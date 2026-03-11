package ru.mtuci.sportapp.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import ru.mtuci.sportapp.backend.model.CurrentUserResponse;
import ru.mtuci.sportapp.backend.model.LoginRequest;
import ru.mtuci.sportapp.backend.model.LoginResponse;
import ru.mtuci.sportapp.backend.model.RegisterAthleteRequest;
import ru.mtuci.sportapp.backend.model.RegisterTrainerRequest;
import ru.mtuci.sportapp.backend.model.TokenRefreshRequest;
import ru.mtuci.sportapp.backend.security.AuthPrincipal;
import ru.mtuci.sportapp.backend.service.AuthService;

@RestController
@RequestMapping("/api")
@CrossOrigin
@RequiredArgsConstructor
public class AuthController {

    // Контроллер только маршрутизирует запросы, бизнес-логика вынесена в service слой.
    private final AuthService authService;

    @PostMapping("/register/trainer")
    public ResponseEntity<LoginResponse> registerTrainer(
            @RequestBody RegisterTrainerRequest request
    ) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(authService.registerTrainer(request));
    }

    @PostMapping("/register/athlete")
    public ResponseEntity<LoginResponse> registerAthlete(
            @RequestBody RegisterAthleteRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerAthlete(request));
    }

    @PostMapping("/login/trainer")
    public ResponseEntity<LoginResponse> loginTrainer(
            @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(authService.loginTrainer(request));
    }

    @PostMapping("/login/athlete")
    public ResponseEntity<LoginResponse> loginAthlete(
            @RequestBody LoginRequest request
    ) {
        return ResponseEntity.ok(authService.loginAthlete(request));
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody TokenRefreshRequest request) {
        // Обновление access token через refresh token (с ротацией refresh внутри сервиса).
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) TokenRefreshRequest request,
                                       Authentication authentication) {
        // Берём текущего пользователя из SecurityContext, если access token ещё валиден.
        AuthPrincipal principal = null;
        if (authentication != null && authentication.getPrincipal() instanceof AuthPrincipal authPrincipal) {
            principal = authPrincipal;
        }
        // Отзываем refresh-сессию и закрываем текущий логин.
        authService.logout(principal, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/auth/me")
    public ResponseEntity<CurrentUserResponse> me(Authentication authentication) {
        // Endpoint для проверки, кто сейчас авторизован.
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.currentUser(principal));
    }
}
