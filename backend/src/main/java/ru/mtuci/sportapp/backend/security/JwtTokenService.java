package ru.mtuci.sportapp.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtTokenService {

    @Value("${app.security.jwt.secret}")
    private String jwtSecret;

    @Value("${app.security.jwt.access-ttl-seconds}")
    private long accessTtlSeconds;

    private SecretKey signingKey;

    @PostConstruct
    void init() {
        try {
            // Нормализуем секрет до стабильного 256-битного ключа для HMAC-подписи JWT.
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(jwtSecret.getBytes(StandardCharsets.UTF_8));
            this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to initialize JWT signing key", ex);
        }
    }

    public String generateAccessToken(UUID userId, String username, UserRole role) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(accessTtlSeconds);

        // В JWT кладём минимум claims: кто пользователь, какая роль, тип токена и срок жизни.
        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .claim("role", role.name())
                .claim("type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(signingKey)
                .compact();
    }

    public Optional<AuthPrincipal> parseAccessToken(String token) {
        try {
            // Проверяем подпись и срок действия токена.
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String type = claims.get("type", String.class);
            // Пропускаем только access токены (refresh здесь не принимается).
            if (!"access".equals(type)) {
                return Optional.empty();
            }

            String subject = claims.getSubject();
            String username = claims.get("username", String.class);
            String roleValue = claims.get("role", String.class);
            if (subject == null || username == null || roleValue == null) {
                return Optional.empty();
            }

            UserRole role = UserRole.valueOf(roleValue);
            return Optional.of(new AuthPrincipal(UUID.fromString(subject), username, role));
        } catch (Exception ex) {
            // Любая ошибка парсинга = невалидный токен.
            return Optional.empty();
        }
    }
}
