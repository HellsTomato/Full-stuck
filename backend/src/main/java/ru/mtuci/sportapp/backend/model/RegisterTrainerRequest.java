package ru.mtuci.sportapp.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data                                            // @Data — геттеры/сеттеры/toString
public class RegisterTrainerRequest {

    @NotBlank
    @Size(max = 64)
    private String username;                     // username — логин тренера

    @NotBlank
    @Size(min = 6, max = 128)
    private String password;                     // password — пароль (в чистом виде из формы)

    @NotBlank
    @Size(max = 120)
    private String fullName;                     // fullName — ФИО тренера
}
