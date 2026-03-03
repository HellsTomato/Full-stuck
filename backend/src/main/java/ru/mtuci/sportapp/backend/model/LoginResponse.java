package ru.mtuci.sportapp.backend.model;

import lombok.AllArgsConstructor;                // AllArgsConstructor — конструктор со всеми полями
import lombok.Data;
import ru.mtuci.sportapp.backend.security.UserRole;

import java.util.UUID;

@Data                                            // @Data — геттеры/сеттеры
@AllArgsConstructor                              // @AllArgsConstructor — конструктор(token)
public class LoginResponse {

    private String token;                        // token — токен, который фронт сохранит
    // username нужен для отображения в UI и запросов профиля
    private String username;
    // role фронт использует для role-based роутов и скрытия действий
    private UserRole role;
    // userId используется в self-операциях и привязках
    private UUID userId;
}
