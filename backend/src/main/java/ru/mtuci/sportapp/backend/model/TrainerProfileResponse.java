package ru.mtuci.sportapp.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TrainerProfileResponse {

    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String education;
    private String achievements;
    private String photoUrl;
}
