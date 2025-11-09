package ru.mtuci.sportapp.backend.controller;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.mtuci.sportapp.backend.entity.Trainer;
import ru.mtuci.sportapp.backend.model.TrainerProfileResponse;
import ru.mtuci.sportapp.backend.model.TrainerProfileUpdateRequest;
import ru.mtuci.sportapp.backend.repo.TrainerRepo;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/trainers")
@CrossOrigin
@RequiredArgsConstructor
public class TrainerProfileController {

    private final TrainerRepo trainerRepo;

    // Папка, куда складываем фото профиля (относительно корня приложения/контейнера)
    private final Path uploadDir = Paths.get("uploads/profile-photos");

    // Создаём папку при старте приложения
    @PostConstruct
    public void initUploadDir() {
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Не удалось создать папку для фото профиля", e);
        }
    }

    // -------- ПОЛУЧЕНИЕ ПРОФИЛЯ ТРЕНЕРА --------

    @GetMapping("/profile")
    public ResponseEntity<TrainerProfileResponse> getProfile(
            @RequestParam String username
    ) {
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
            @RequestBody TrainerProfileUpdateRequest request
    ) {
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
        if (file.isEmpty()) {
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

        // уникальное имя файла
        String filename = "trainer_" + username + "_" + UUID.randomUUID() + "." + ext;
        Path target = uploadDir.resolve(filename);

        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        // в БД храним только имя файла
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

    // -------- ОТДАЧА ФОТО ПО ИМЕНИ ФАЙЛА --------

    @GetMapping("/profile/photo/{filename}")
    public ResponseEntity<Resource> getPhoto(@PathVariable String filename) {
        try {
            Path file = uploadDir.resolve(filename);
            if (!Files.exists(file)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(file.toUri());
            String contentType = Files.probeContentType(file);
            if (contentType == null) {
                contentType = "image/jpeg";
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
