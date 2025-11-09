package ru.mtuci.sportapp.backend.model;

import lombok.Data;

@Data                                            // @Data — геттеры/сеттеры/toString
public class RegisterTrainerRequest {

    private String username;                     // username — логин тренера
    private String password;                     // password — пароль (в чистом виде из формы)
    private String fullName;                     // fullName — ФИО тренера
}
