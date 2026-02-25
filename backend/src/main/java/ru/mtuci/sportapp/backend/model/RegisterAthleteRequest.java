package ru.mtuci.sportapp.backend.model;

import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterAthleteRequest {
    private String username;
    private String password;
    private String fullName;
    private LocalDate birthDate;
    private String group;
    private String phone;
    private String notes;
}
