package ru.mtuci.sportapp.backend.security;

import java.util.UUID;

public record AuthPrincipal(UUID userId, String username, UserRole role) {
}
