package ru.mtuci.sportapp.backend.controller;          // пакет с REST-контроллерами

import lombok.RequiredArgsConstructor;                   // RequiredArgsConstructor — автоген. конструктора
import org.springframework.http.HttpStatus;              // HttpStatus — коды ответа (200, 401, 409...)
import org.springframework.http.ResponseEntity;          // ResponseEntity — обёртка ответа
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;        // @RestController, @PostMapping, @CrossOrigin...
import ru.mtuci.sportapp.backend.entity.Athlete;
import ru.mtuci.sportapp.backend.entity.Trainer;         // Trainer — сущность тренера
import ru.mtuci.sportapp.backend.entity.UserSession;
import ru.mtuci.sportapp.backend.model.LoginRequest;     // LoginRequest — тело запроса логина
import ru.mtuci.sportapp.backend.model.LoginResponse;    // LoginResponse — ответ с токеном
import ru.mtuci.sportapp.backend.model.RegisterAthleteRequest;
import ru.mtuci.sportapp.backend.model.RegisterTrainerRequest; // RegisterTrainerRequest — регистрация
import ru.mtuci.sportapp.backend.repo.AthleteRepo;
import ru.mtuci.sportapp.backend.repo.TrainerRepo;       // TrainerRepo — работа с БД
import ru.mtuci.sportapp.backend.repo.UserSessionRepo;
import ru.mtuci.sportapp.backend.security.UserRole;

import java.time.Instant;
import java.util.UUID;                                   // UUID — id и фейковый токен
import java.util.Optional;                               // Optional — результат поиска

@RestController                                          // @RestController — REST API
@RequestMapping("/api")                                  // все пути будут начинаться с /api
@CrossOrigin                                             // разрешаем запросы с фронтенда
@RequiredArgsConstructor                                 // генерит конструктор для final-полей
public class AuthController {

    private final TrainerRepo trainerRepo;               // trainerRepo — доступ к таблице trainers
    private final AthleteRepo athleteRepo;
    private final UserSessionRepo userSessionRepo;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register/trainer")
    public ResponseEntity<LoginResponse> registerTrainer(
            @RequestBody RegisterTrainerRequest request  // request — JSON с username/password/fullName
    ) {
        // Логин должен быть уникален среди обеих ролей
        Optional<Trainer> existingTrainer = trainerRepo.findByUsername(request.getUsername());
        Optional<Athlete> existingAthlete = athleteRepo.findByUsername(request.getUsername());

        if (existingTrainer.isPresent() || existingAthlete.isPresent()) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)         // 409 CONFLICT — логин занят
                    .build();                            // возвращаем пустой ответ
        }

        Trainer trainer = new Trainer();                 // создаём нового Trainer
        trainer.setId(UUID.randomUUID());                // id — генерируем UUID вручную
        trainer.setUsername(request.getUsername());      // username — из запроса
        trainer.setFullName(request.getFullName());      // fullName — из запроса
        trainer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        trainer.setRole(UserRole.TRAINER);

        trainerRepo.save(trainer);                       // сохраняем тренера в БД

        LoginResponse response = createSession(trainer.getId(), trainer.getUsername(), UserRole.TRAINER);

        return ResponseEntity
                .status(HttpStatus.CREATED)              // 201 CREATED — успешно создан
                .body(response);                         // тело — JSON с токеном
    }

    @PostMapping("/register/athlete")
    public ResponseEntity<LoginResponse> registerAthlete(
            @RequestBody RegisterAthleteRequest request
    ) {
        // Логин должен быть уникален среди обеих ролей
        Optional<Trainer> existingTrainer = trainerRepo.findByUsername(request.getUsername());
        Optional<Athlete> existingAthlete = athleteRepo.findByUsername(request.getUsername());

        if (existingTrainer.isPresent() || existingAthlete.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
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

        LoginResponse response = createSession(athlete.getId(), athlete.getUsername(), UserRole.ATHLETE);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login/trainer")
    public ResponseEntity<LoginResponse> loginTrainer(
            @RequestBody LoginRequest request            // request — JSON с username/password
    ) {
        Optional<Trainer> trainerOpt =
                trainerRepo.findByUsername(request.getUsername()); // запрос в БД

        if (trainerOpt.isEmpty()) {                      // если не нашли такого пользователя
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)     // 401 — неверный логин/пароль
                    .build();
        }

        Trainer trainer = trainerOpt.get();              // trainer — найденный тренер
        if (!passwordEncoder.matches(request.getPassword(), trainer.getPasswordHash())) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)     // 401 — также неверный логин/пароль
                    .build();
        }

        LoginResponse response = createSession(trainer.getId(), trainer.getUsername(), UserRole.TRAINER);

        return ResponseEntity.ok(response);              // 200 OK + JSON { "token": "..." }
    }

    @PostMapping("/login/athlete")
    public ResponseEntity<LoginResponse> loginAthlete(
            @RequestBody LoginRequest request
    ) {
        Optional<Athlete> athleteOpt = athleteRepo.findByUsername(request.getUsername());

        if (athleteOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Athlete athlete = athleteOpt.get();
        if (athlete.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), athlete.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        LoginResponse response = createSession(athlete.getId(), athlete.getUsername(), UserRole.ATHLETE);
        return ResponseEntity.ok(response);
    }

    private LoginResponse createSession(UUID userId, String username, UserRole role) {
        // Токен — ключ сессии в user_sessions; по нему потом поднимаем SecurityContext
        String token = UUID.randomUUID().toString();
        UserSession session = new UserSession();
        session.setToken(token);
        session.setUserId(userId);
        session.setUsername(username);
        session.setRole(role);
        session.setCreatedAt(Instant.now());
        userSessionRepo.save(session);
        return new LoginResponse(token, username, role, userId);
    }
}
