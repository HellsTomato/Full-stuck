package ru.mtuci.sportapp.backend.controller;          // пакет с REST-контроллерами

import lombok.RequiredArgsConstructor;                   // RequiredArgsConstructor — автоген. конструктора
import org.springframework.http.HttpStatus;              // HttpStatus — коды ответа (200, 401, 409...)
import org.springframework.http.ResponseEntity;          // ResponseEntity — обёртка ответа
import org.springframework.web.bind.annotation.*;        // @RestController, @PostMapping, @CrossOrigin...
import ru.mtuci.sportapp.backend.entity.Trainer;         // Trainer — сущность тренера
import ru.mtuci.sportapp.backend.model.LoginRequest;     // LoginRequest — тело запроса логина
import ru.mtuci.sportapp.backend.model.LoginResponse;    // LoginResponse — ответ с токеном
import ru.mtuci.sportapp.backend.model.RegisterTrainerRequest; // RegisterTrainerRequest — регистрация
import ru.mtuci.sportapp.backend.repo.TrainerRepo;       // TrainerRepo — работа с БД

import java.nio.charset.StandardCharsets;                // StandardCharsets — кодировка UTF-8
import java.security.MessageDigest;                      // MessageDigest — хэширование SHA-256
import java.security.NoSuchAlgorithmException;           // исключение, если алгоритм не найден
import java.util.UUID;                                   // UUID — id и фейковый токен
import java.util.Optional;                               // Optional — результат поиска

@RestController                                          // @RestController — REST API
@RequestMapping("/api")                                  // все пути будут начинаться с /api
@CrossOrigin                                             // разрешаем запросы с фронтенда
@RequiredArgsConstructor                                 // генерит конструктор для final-полей
public class AuthController {

    private final TrainerRepo trainerRepo;               // trainerRepo — доступ к таблице trainers

    @PostMapping("/register")                            // POST /api/register — регистрация тренера
    public ResponseEntity<LoginResponse> register(
            @RequestBody RegisterTrainerRequest request  // request — JSON с username/password/fullName
    ) {
        // проверяем, что такого логина ещё нет
        Optional<Trainer> existing = trainerRepo.findByUsername(request.getUsername()); // поиск по логину

        if (existing.isPresent()) {                      // if — если тренер уже существует
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)         // 409 CONFLICT — логин занят
                    .build();                            // возвращаем пустой ответ
        }

        Trainer trainer = new Trainer();                 // создаём нового Trainer
        trainer.setId(UUID.randomUUID());                // id — генерируем UUID вручную
        trainer.setUsername(request.getUsername());      // username — из запроса
        trainer.setFullName(request.getFullName());      // fullName — из запроса
        trainer.setPasswordHash(hashPassword(request.getPassword())); // passwordHash — хэш пароля

        trainerRepo.save(trainer);                       // сохраняем тренера в БД

        String fakeToken = UUID.randomUUID().toString(); // фейковый токен — просто UUID
        LoginResponse response = new LoginResponse(fakeToken); // response — оборачиваем токен

        return ResponseEntity
                .status(HttpStatus.CREATED)              // 201 CREATED — успешно создан
                .body(response);                         // тело — JSON с токеном
    }

    @PostMapping("/login")                               // POST /api/login — вход тренера
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request            // request — JSON с username/password
    ) {
        // ищем тренера по логину
        Optional<Trainer> trainerOpt =
                trainerRepo.findByUsername(request.getUsername()); // запрос в БД

        if (trainerOpt.isEmpty()) {                      // если не нашли такого пользователя
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)     // 401 — неверный логин/пароль
                    .build();
        }

        Trainer trainer = trainerOpt.get();              // trainer — найденный тренер
        String incomingHash = hashPassword(request.getPassword()); // хэш пароля из запроса

        if (!incomingHash.equals(trainer.getPasswordHash())) { // если хэши не совпали
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)     // 401 — также неверный логин/пароль
                    .build();
        }

        String fakeToken = UUID.randomUUID().toString(); // генерируем новый фейковый токен
        LoginResponse response = new LoginResponse(fakeToken); // упаковываем в ответ

        return ResponseEntity.ok(response);              // 200 OK + JSON { "token": "..." }
    }

    // простое хэширование пароля через SHA-256
    private String hashPassword(String rawPassword) {    // rawPassword — пароль в чистом виде
        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256"); // SHA-256 — алгоритм хэширования
            byte[] hashBytes =
                    digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8)); // хэшируем байты

            StringBuilder sb = new StringBuilder();      // sb — строковый билдер для hex-представления
            for (byte b : hashBytes) {                   // проходим по каждому байту
                sb.append(String.format("%02x", b));     // %02x — 2 шестнадцатеричных символа
            }
            return sb.toString();                        // возвращаем строку-хэш
        } catch (NoSuchAlgorithmException e) {           // если SHA-256 недоступен (маловероятно)
            throw new RuntimeException(e);               // пробрасываем как unchecked-ошибку
        }
    }
}
