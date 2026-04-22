package ru.mtuci.sportapp.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import ru.mtuci.sportapp.backend.entity.Athlete;
import ru.mtuci.sportapp.backend.entity.Trainer;
import ru.mtuci.sportapp.backend.entity.UserSession;
import ru.mtuci.sportapp.backend.model.LoginRequest;
import ru.mtuci.sportapp.backend.model.LoginResponse;
import ru.mtuci.sportapp.backend.model.TokenRefreshRequest;
import ru.mtuci.sportapp.backend.repo.AthleteRepo;
import ru.mtuci.sportapp.backend.repo.TrainerRepo;
import ru.mtuci.sportapp.backend.repo.UserSessionRepo;
import ru.mtuci.sportapp.backend.security.AuthPrincipal;
import ru.mtuci.sportapp.backend.security.JwtTokenService;
import ru.mtuci.sportapp.backend.security.UserRole;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    // Моки репозиториев/сервисов для изолированного unit-тестирования AuthService.
    @Mock
    private TrainerRepo trainerRepo;

    @Mock
    private AthleteRepo athleteRepo;

    @Mock
    private UserSessionRepo userSessionRepo;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenService jwtTokenService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        // TTL задаем явно, чтобы тесты refresh были детерминированными.
        ReflectionTestUtils.setField(authService, "refreshTtlSeconds", 60L);
    }

    @Test
    void registerTrainerThrowsConflictWhenUsernameAlreadyExists() {
        // Arrange: формируем запрос и имитируем занятый username.
        var request = new ru.mtuci.sportapp.backend.model.RegisterTrainerRequest();
        request.setUsername("taken-user");
        request.setPassword("password123");
        request.setFullName("Taken User");

        when(trainerRepo.findByUsername("taken-user")).thenReturn(Optional.of(new Trainer()));
        when(athleteRepo.findByUsername("taken-user")).thenReturn(Optional.empty());

        // Act + Assert: ожидаем 409 CONFLICT и отсутствие сохранения.
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> authService.registerTrainer(request));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(trainerRepo, never()).save(any());
    }

    @Test
    void loginAthleteReturnsUnauthorizedWhenPasswordHashMissing() {
        // Arrange: у найденного пользователя нет passwordHash.
        var request = new LoginRequest();
        request.setUsername("athlete");
        request.setPassword("secret");

        var athlete = new Athlete();
        athlete.setId(UUID.randomUUID());
        athlete.setUsername("athlete");
        athlete.setPasswordHash(null);

        when(athleteRepo.findByUsername("athlete")).thenReturn(Optional.of(athlete));

        // Act + Assert: при пустом хэше должен вернуться 401.
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> authService.loginAthlete(request));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    void refreshRotatesTokenAndCreatesNewSession() {
        // Arrange: валидная старая refresh-сессия.
        String oldRefreshToken = "old-token";
        UUID userId = UUID.randomUUID();
        UserSession oldSession = new UserSession();
        oldSession.setToken(oldRefreshToken);
        oldSession.setUserId(userId);
        oldSession.setUsername("trainer1");
        oldSession.setRole(UserRole.TRAINER);
        oldSession.setCreatedAt(Instant.now().minusSeconds(10));

        var request = new TokenRefreshRequest();
        request.setRefreshToken(oldRefreshToken);

        when(userSessionRepo.findById(oldRefreshToken)).thenReturn(Optional.of(oldSession));
        when(jwtTokenService.generateAccessToken(userId, "trainer1", UserRole.TRAINER)).thenReturn("jwt-access");

        // Act: выполняем refresh.
        LoginResponse response = authService.refresh(request);

        // Старый refresh обязательно удаляется при ротации.
        verify(userSessionRepo).deleteById(oldRefreshToken);

        ArgumentCaptor<UserSession> captor = ArgumentCaptor.forClass(UserSession.class);
        verify(userSessionRepo).save(captor.capture());
        UserSession newSession = captor.getValue();

        // Assert: новый refresh создан, access выдан, старый refresh отличается.
        assertEquals("jwt-access", response.getAccessToken());
        assertEquals("jwt-access", response.getToken());
        assertNotEquals(oldRefreshToken, response.getRefreshToken());
        assertEquals(userId, newSession.getUserId());
        assertEquals(UserRole.TRAINER, newSession.getRole());
    }

    @Test
    void refreshDeletesExpiredSessionAndThrowsUnauthorized() {
        // Arrange: истекшая refresh-сессия (createdAt сильно в прошлом).
        String refreshToken = "expired-token";
        UserSession oldSession = new UserSession();
        oldSession.setToken(refreshToken);
        oldSession.setUserId(UUID.randomUUID());
        oldSession.setUsername("athlete1");
        oldSession.setRole(UserRole.ATHLETE);
        oldSession.setCreatedAt(Instant.now().minusSeconds(120));

        var request = new TokenRefreshRequest();
        request.setRefreshToken(refreshToken);

        when(userSessionRepo.findById(refreshToken)).thenReturn(Optional.of(oldSession));

        // Act + Assert: истекшая сессия удаляется, клиент получает 401.
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> authService.refresh(request));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verify(userSessionRepo).deleteById(refreshToken);
    }

    @Test
    void logoutDeletesSpecificTokenAndAllUserSessions() {
        // Arrange: есть principal и конкретный refresh токен в запросе logout.
        UUID userId = UUID.randomUUID();
        AuthPrincipal principal = new AuthPrincipal(userId, "trainer2", UserRole.TRAINER);

        var request = new TokenRefreshRequest();
        request.setRefreshToken("refresh-1");

        // Act: выполняем logout.
        authService.logout(principal, request);

        // Assert: удаляется и конкретный refresh, и все сессии пользователя.
        verify(userSessionRepo).deleteById("refresh-1");
        verify(userSessionRepo).deleteByUserId(userId);
    }

    @Test
    void currentUserThrowsUnauthorizedForNullPrincipal() {
        // Assert: вызов currentUser без principal запрещен.
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> authService.currentUser(null));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertTrue(ex.getReason() == null || ex.getReason().isBlank());
    }
}
