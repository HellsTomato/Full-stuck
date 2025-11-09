package ru.mtuci.sportapp.backend.model;          // пакет с моделями запросов/ответов

import lombok.Data;                               // Data — геттеры/сеттеры

@Data                                             // @Data — генерирует стандартные методы
public class LoginRequest {

    private String username;                      // username — логин (почта/ник)
    private String password;                      // password — пароль в чистом виде (из запроса)
}
