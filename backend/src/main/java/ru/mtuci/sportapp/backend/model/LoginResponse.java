package ru.mtuci.sportapp.backend.model;

import lombok.AllArgsConstructor;                // AllArgsConstructor — конструктор со всеми полями
import lombok.Data;
import ru.mtuci.sportapp.backend.security.UserRole;

import java.util.UUID;

@Data                                            // @Data — геттеры/сеттеры
@AllArgsConstructor
public class LoginResponse {

    // legacy-поле для обратной совместимости (содержит accessToken)
    private String token;
    // Короткоживущий JWT для доступа к защищённым API.
    private String accessToken;
    // Долгоживущий токен для обновления access токена.
    private String refreshToken;
    // username нужен для отображения в UI и запросов профиля
    private String username;
    // role фронт использует для role-based роутов и скрытия действий
    private UserRole role;
    // userId используется в self-операциях и привязках
    private UUID userId;
}
