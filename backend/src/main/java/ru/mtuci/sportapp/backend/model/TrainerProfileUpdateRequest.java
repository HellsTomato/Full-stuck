package ru.mtuci.sportapp.backend.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TrainerProfileUpdateRequest {

    @NotBlank
    @Size(max = 64)
    private String username;      // по нему ищем тренера

    @NotBlank
    @Size(max = 120)
    private String fullName;

    @Email
    @Size(max = 120)
    private String email;

    @Size(max = 32)
    private String phone;

    @Size(max = 2000)
    private String education;

    @Size(max = 2000)
    private String achievements;

    @Size(max = 255)
    private String photoUrl;
}
