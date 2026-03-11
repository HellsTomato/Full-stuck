package ru.mtuci.sportapp.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ru.mtuci.sportapp.backend.entity.Athlete;
import ru.mtuci.sportapp.backend.entity.Trainer;
import ru.mtuci.sportapp.backend.entity.UserSession;
import ru.mtuci.sportapp.backend.model.CurrentUserResponse;
import ru.mtuci.sportapp.backend.model.LoginRequest;
import ru.mtuci.sportapp.backend.model.LoginResponse;
import ru.mtuci.sportapp.backend.model.RegisterAthleteRequest;
import ru.mtuci.sportapp.backend.model.RegisterTrainerRequest;
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

@Service
public class AuthService {

    private final TrainerRepo trainerRepo;
    private final AthleteRepo athleteRepo;
    private final UserSessionRepo userSessionRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    @Value("${app.security.refresh-ttl-seconds}")
    // Время жизни refresh token в секундах.
    private long refreshTtlSeconds;

    public AuthService(TrainerRepo trainerRepo,
                       AthleteRepo athleteRepo,
                       UserSessionRepo userSessionRepo,
                       PasswordEncoder passwordEncoder,
                       JwtTokenService jwtTokenService) {
        this.trainerRepo = trainerRepo;
        this.athleteRepo = athleteRepo;
        this.userSessionRepo = userSessionRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    @Transactional
    public LoginResponse registerTrainer(RegisterTrainerRequest request) {
        // Логин должен быть уникален в обеих таблицах пользователей.
        Optional<Trainer> existingTrainer = trainerRepo.findByUsername(request.getUsername());
        Optional<Athlete> existingAthlete = athleteRepo.findByUsername(request.getUsername());
        if (existingTrainer.isPresent() || existingAthlete.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already used");
        }

        Trainer trainer = new Trainer();
        trainer.setId(UUID.randomUUID());
        trainer.setUsername(request.getUsername());
        trainer.setFullName(request.getFullName());
        trainer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        trainer.setRole(UserRole.TRAINER);
        trainerRepo.save(trainer);

        return issueTokens(trainer.getId(), trainer.getUsername(), UserRole.TRAINER);
    }

    @Transactional
    public LoginResponse registerAthlete(RegisterAthleteRequest request) {
        // Логин должен быть уникален в обеих таблицах пользователей.
        Optional<Trainer> existingTrainer = trainerRepo.findByUsername(request.getUsername());
        Optional<Athlete> existingAthlete = athleteRepo.findByUsername(request.getUsername());
        if (existingTrainer.isPresent() || existingAthlete.isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already used");
        }

        Athlete athlete = new Athlete();
        athlete.setId(UUID.randomUUID());
        athlete.setUsername(request.getUsername());
        athlete.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        athlete.setFullName(request.getFullName());
        athlete.setBirthDate(request.getBirthDate());
        athlete.setGrp(request.getGroup());
        athlete.setPhone(request.getPhone());
        athlete.setNotes(request.getNotes());
        athleteRepo.save(athlete);

        return issueTokens(athlete.getId(), athlete.getUsername(), UserRole.ATHLETE);
    }

    @Transactional
    public LoginResponse loginTrainer(LoginRequest request) {
        // 401 при неверной паре логин/пароль.
        Trainer trainer = trainerRepo.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), trainer.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return issueTokens(trainer.getId(), trainer.getUsername(), UserRole.TRAINER);
    }

    @Transactional
    public LoginResponse loginAthlete(LoginRequest request) {
        // 401 при неверной паре логин/пароль.
        Athlete athlete = athleteRepo.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (athlete.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), athlete.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return issueTokens(athlete.getId(), athlete.getUsername(), UserRole.ATHLETE);
    }

    @Transactional
    public LoginResponse refresh(TokenRefreshRequest request) {
        // Refresh endpoint принимает только валидный refresh token.
        if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is required");
        }

        UserSession oldSession = userSessionRepo.findById(request.getRefreshToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        // Проверка срока жизни refresh-сессии.
        Instant expiresAt = oldSession.getCreatedAt().plusSeconds(refreshTtlSeconds);
        if (Instant.now().isAfter(expiresAt)) {
            userSessionRepo.deleteById(oldSession.getToken());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        // Ротация: старый refresh удаляем, выдаём новый access + новый refresh.
        userSessionRepo.deleteById(oldSession.getToken());
        return issueTokens(oldSession.getUserId(), oldSession.getUsername(), oldSession.getRole());
    }

    @Transactional
    public void logout(AuthPrincipal principal, TokenRefreshRequest request) {
        // Logout по refresh token (если пришёл от клиента).
        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            userSessionRepo.deleteById(request.getRefreshToken());
        }
        // Дополнительно закрываем все сессии пользователя (безопасный отзыв при повторном входе/компрометации).
        if (principal != null) {
            userSessionRepo.deleteByUserId(principal.userId());
        }
    }

    public CurrentUserResponse currentUser(AuthPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return new CurrentUserResponse(principal.userId(), principal.username(), principal.role());
    }

    private LoginResponse issueTokens(UUID userId, String username, UserRole role) {
        // Политика одной активной сессии на пользователя: удаляем старые refresh записи.
        userSessionRepo.deleteByUserId(userId);

        // Refresh token храним в БД как управляемую серверную сессию.
        String refreshToken = UUID.randomUUID().toString();
        UserSession session = new UserSession();
        session.setToken(refreshToken);
        session.setUserId(userId);
        session.setUsername(username);
        session.setRole(role);
        session.setCreatedAt(Instant.now());
        userSessionRepo.save(session);

        // Access token — короткоживущий JWT для доступа к API.
        String accessToken = jwtTokenService.generateAccessToken(userId, username, role);
        // legacy field token оставляем для обратной совместимости со старым фронтом.
        return new LoginResponse(accessToken, accessToken, refreshToken, username, role, userId);
    }
}
