package ru.mtuci.sportapp.backend.model;

import lombok.Data;

@Data
public class TokenRefreshRequest {
    // Refresh token приходит с клиента при /auth/refresh и /auth/logout.
    private String refreshToken;
}
