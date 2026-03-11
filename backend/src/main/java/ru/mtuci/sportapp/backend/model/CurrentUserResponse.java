package ru.mtuci.sportapp.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import ru.mtuci.sportapp.backend.security.UserRole;

import java.util.UUID;

@Data
@AllArgsConstructor
public class CurrentUserResponse {
    private UUID userId;
    private String username;
    private UserRole role;
}
