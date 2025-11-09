package ru.mtuci.sportapp.backend.model;

import lombok.Data;

@Data
public class TrainerProfileUpdateRequest {

    private String username;      // по нему ищем тренера
    private String fullName;
    private String email;
    private String phone;
    private String education;
    private String achievements;
    private String photoUrl;
}
