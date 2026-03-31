package ru.mtuci.sportapp.backend.model;          // пакет с моделями запросов/ответов

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;                               // Data — геттеры/сеттеры

@Data                                             // @Data — генерирует стандартные методы
public class LoginRequest {

    @NotBlank
    @Size(max = 64)
    private String username;                      // username — логин (почта/ник)

    @NotBlank
    @Size(max = 128)
    private String password;                      // password — пароль в чистом виде (из запроса)
}
