package ru.mtuci.sportapp.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterAthleteRequest {
    @NotBlank
    @Size(max = 64)
    private String username;

    @NotBlank
    @Size(min = 6, max = 128)
    private String password;

    @NotBlank
    @Size(max = 120)
    private String fullName;

    @NotNull
    private LocalDate birthDate;

    @NotBlank
    @Size(max = 32)
    private String group;

    @Size(max = 32)
    private String phone;

    @Size(max = 2000)
    private String notes;
}
