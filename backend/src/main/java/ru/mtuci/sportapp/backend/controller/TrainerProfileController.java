package ru.mtuci.sportapp.backend.controller;

import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ru.mtuci.sportapp.backend.entity.Trainer;
import ru.mtuci.sportapp.backend.model.TrainerProfileResponse;
import ru.mtuci.sportapp.backend.model.TrainerProfileUpdateRequest;
import ru.mtuci.sportapp.backend.repo.TrainerRepo;
import ru.mtuci.sportapp.backend.security.AuthPrincipal;
import ru.mtuci.sportapp.backend.service.MinioStorageService;

import java.io.IOException;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/trainers")
@CrossOrigin
@RequiredArgsConstructor
public class TrainerProfileController {

    private final TrainerRepo trainerRepo;
    // Абстракция хранилища для операций с объектами в MinIO.
    private final MinioStorageService storageService;

    private static final long MAX_PHOTO_SIZE_BYTES = 5L * 1024L * 1024L;

    // Проверяем доступность storage при старте приложения.
    @PostConstruct
    public void initUploadDir() {
        storageService.ensureBucketExists();
    }

    // -------- ПОЛУЧЕНИЕ ПРОФИЛЯ ТРЕНЕРА --------

    @GetMapping("/profile")
    public ResponseEntity<TrainerProfileResponse> getProfile(
            @RequestParam String username
    ) {
        AuthPrincipal principal = currentPrincipal();
        if (!principal.username().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Trainer> trainerOpt = trainerRepo.findByUsername(username);
        if (trainerOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Trainer t = trainerOpt.get();
        TrainerProfileResponse response = new TrainerProfileResponse(
                t.getUsername(),
                t.getFullName(),
                t.getEmail(),
                t.getPhone(),
                t.getEducation(),
                t.getAchievements(),
                t.getPhotoUrl()
        );
        return ResponseEntity.ok(response);
    }

    // -------- ОБНОВЛЕНИЕ ТЕКСТОВЫХ ДАННЫХ ПРОФИЛЯ --------

    @PutMapping("/profile")
    public ResponseEntity<TrainerProfileResponse> updateProfile(
            @Valid @RequestBody TrainerProfileUpdateRequest request
    ) {
        AuthPrincipal principal = currentPrincipal();
        if (!principal.username().equals(request.getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Trainer> trainerOpt = trainerRepo.findByUsername(request.getUsername());
        if (trainerOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Trainer trainer = trainerOpt.get();
        trainer.setFullName(request.getFullName());
        trainer.setEmail(request.getEmail());
        trainer.setPhone(request.getPhone());
        trainer.setEducation(request.getEducation());
        trainer.setAchievements(request.getAchievements());
        // photoUrl здесь не трогаем — он обновляется отдельно через uploadPhoto

        Trainer saved = trainerRepo.save(trainer);

        TrainerProfileResponse response = new TrainerProfileResponse(
                saved.getUsername(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getEducation(),
                saved.getAchievements(),
                saved.getPhotoUrl()
        );
        return ResponseEntity.ok(response);
    }

    // -------- ЗАГРУЗКА ФОТО ПРОФИЛЯ --------

    @PostMapping("/profile/photo")
    public ResponseEntity<TrainerProfileResponse> uploadPhoto(
            @RequestParam("username") String username,
            @RequestParam("file") MultipartFile file
    ) {
        AuthPrincipal principal = currentPrincipal();
        if (!principal.username().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        // ЛР3: ограничения на загрузку пользовательских файлов.
        if (file.getSize() > MAX_PHOTO_SIZE_BYTES) {
            return ResponseEntity.badRequest().build();
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            return ResponseEntity.badRequest().build();
        }

        Optional<Trainer> trainerOpt = trainerRepo.findByUsername(username);
        if (trainerOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Trainer trainer = trainerOpt.get();

        String originalName = file.getOriginalFilename();
        String ext = StringUtils.getFilenameExtension(originalName);
        if (ext == null || ext.isBlank()) {
            ext = "jpg";
        }

        // Генерируем уникальный ключ объекта; его сохраняем в trainer.photoUrl.
        String filename = "trainer_" + username + "_" + UUID.randomUUID() + "." + ext;

        try {
            String uploadContentType = contentType == null ? "application/octet-stream" : contentType;
            storageService.upload(filename, file.getBytes(), uploadContentType);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        // При замене фото удаляем старый файл, чтобы не оставлять мусор в storage.
        // в БД храним только имя файла
        deleteExistingPhoto(trainer.getPhotoUrl());
        trainer.setPhotoUrl(filename);
        Trainer saved = trainerRepo.save(trainer);

        TrainerProfileResponse response = new TrainerProfileResponse(
                saved.getUsername(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getEducation(),
                saved.getAchievements(),
                saved.getPhotoUrl()
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/profile/photo")
    public ResponseEntity<TrainerProfileResponse> deletePhoto(@RequestParam("username") String username) {
        AuthPrincipal principal = currentPrincipal();
        if (!principal.username().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Trainer> trainerOpt = trainerRepo.findByUsername(username);
        if (trainerOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Trainer trainer = trainerOpt.get();
        // ЛР3: удаление фото = удаление физического файла + очистка metadata.
        deleteExistingPhoto(trainer.getPhotoUrl());
        trainer.setPhotoUrl(null);
        Trainer saved = trainerRepo.save(trainer);

        TrainerProfileResponse response = new TrainerProfileResponse(
                saved.getUsername(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getEducation(),
                saved.getAchievements(),
                saved.getPhotoUrl()
        );
        return ResponseEntity.ok(response);
    }

    // -------- ОТДАЧА ФОТО ПО ИМЕНИ ФАЙЛА --------

    @GetMapping("/profile/photo/{filename}")
    public ResponseEntity<Resource> getPhoto(@PathVariable String filename) {
        if (filename == null || filename.contains("/") || filename.contains("\\")) {
            return ResponseEntity.notFound().build();
        }

        try {
            var storedObject = storageService.get(filename);
            if (storedObject.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Отдаем байты объекта из MinIO в HTTP-ответ.
            Resource resource = new org.springframework.core.io.ByteArrayResource(storedObject.get().bytes());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, storedObject.get().contentType())
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private AuthPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return principal;
    }

    private void deleteExistingPhoto(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }
        if (filename.contains("/") || filename.contains("\\")) {
            return;
        }
        try {
            storageService.deleteIfExists(filename);
        } catch (RuntimeException ignored) {
            // best-effort cleanup for old photo file
        }
    }
}
