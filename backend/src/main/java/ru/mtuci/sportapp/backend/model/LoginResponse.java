package ru.mtuci.sportapp.backend.model;

import lombok.AllArgsConstructor;                // AllArgsConstructor — конструктор со всеми полями
import lombok.Data;

@Data                                            // @Data — геттеры/сеттеры
@AllArgsConstructor                              // @AllArgsConstructor — конструктор(token)
public class LoginResponse {

    private String token;                        // token — токен, который фронт сохранит
}
