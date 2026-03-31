package ru.mtuci.sportapp.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import ru.mtuci.sportapp.backend.entity.Athlete;
import ru.mtuci.sportapp.backend.repo.AthleteRepo;
import ru.mtuci.sportapp.backend.security.AuthPrincipal;
import ru.mtuci.sportapp.backend.security.UserRole;
import ru.mtuci.sportapp.backend.service.MinioStorageService;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/athletes")
@RequiredArgsConstructor
@CrossOrigin
public class AthleteController {

    private final AthleteRepo repository;
    // Абстракция хранилища для операций с объектами в MinIO.
    private final MinioStorageService storageService;
    private static final long MAX_PHOTO_SIZE_BYTES = 5L * 1024L * 1024L;

    // --------------------------------------------------------------
    // GET /api/athletes?search=&group=
    // Полный поиск: по ФИО (LIKE) + по группе
    // --------------------------------------------------------------
    @GetMapping
    public AthleteListResponse list(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "group", required = false) String group,
            @RequestParam(value = "sortBy", defaultValue = "fullName") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "asc") String sortDir,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        AuthPrincipal principal = currentPrincipal();
        if (principal.role() != UserRole.TRAINER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only trainer can list athletes");
        }

        // ЛР3: серверная валидация параметров пагинации.
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page must be >= 0");
        }
        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "size must be in range 1..100");
        }

        String normalizedSortBy = normalizeSortBy(sortBy);
        boolean desc = "desc".equalsIgnoreCase(sortDir);
        if (!desc && !"asc".equalsIgnoreCase(sortDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sortDir must be asc or desc");
        }

        String pattern = (search == null || search.isBlank())
                ? null
                : "%" + search.toLowerCase() + "%";

        // ЛР3: фильтрация + сортировка + постраничный срез на сервере.
        List<Athlete> filtered = repository.search(group, pattern);
        Comparator<Athlete> comparator = athleteComparator(normalizedSortBy);
        filtered.sort(desc ? comparator.reversed() : comparator);

        int total = filtered.size();
        int fromIndex = page * size;
        if (fromIndex >= total) {
            return new AthleteListResponse(List.of(), total, page, size, totalPages(total, size));
        }

        int toIndex = Math.min(fromIndex + size, total);
        List<Athlete> items = filtered.subList(fromIndex, toIndex);
        return new AthleteListResponse(items, total, page, size, totalPages(total, size));
    }

    // --------------------------------------------------------------
    // PATCH — частичное обновление
    // --------------------------------------------------------------
    @PatchMapping("/{id}")
    public Athlete patch(@PathVariable UUID id, @RequestBody Athlete body) {
        AuthPrincipal principal = currentPrincipal();
        if (principal.role() == UserRole.ATHLETE && !principal.userId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Athlete can update only own profile");
        }

        Athlete existing = repository.findById(id).orElseThrow();

        if (body.getFullName() != null) existing.setFullName(body.getFullName());
        if (body.getBirthDate() != null) existing.setBirthDate(body.getBirthDate());
        if (body.getGrp() != null) existing.setGrp(body.getGrp());
        if (body.getPhone() != null) existing.setPhone(body.getPhone());
        if (body.getNotes() != null) existing.setNotes(body.getNotes());

        return repository.save(existing);
    }

    @GetMapping("/me")
    public Athlete me() {
        AuthPrincipal principal = currentPrincipal();
        if (principal.role() != UserRole.ATHLETE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only athlete can access own profile");
        }

        return repository.findById(principal.userId()).orElseThrow();
    }

    @PatchMapping("/me")
    public Athlete updateMe(@RequestBody Athlete body) {
        AuthPrincipal principal = currentPrincipal();
        if (principal.role() != UserRole.ATHLETE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only athlete can update own profile");
        }

        Athlete existing = repository.findById(principal.userId()).orElseThrow();

        if (body.getFullName() != null) existing.setFullName(body.getFullName());
        if (body.getBirthDate() != null) existing.setBirthDate(body.getBirthDate());
        if (body.getGrp() != null) existing.setGrp(body.getGrp());
        if (body.getPhone() != null) existing.setPhone(body.getPhone());
        if (body.getNotes() != null) existing.setNotes(body.getNotes());

        return repository.save(existing);
    }

    @PostMapping("/me/photo")
    public ResponseEntity<Athlete> uploadMyPhoto(@RequestParam("file") MultipartFile file) {
        AuthPrincipal principal = currentPrincipal();
        if (principal.role() != UserRole.ATHLETE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only athlete can upload own photo");
        }

        // ЛР3: базовая защита файловых операций (тип + размер).
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (file.getSize() > MAX_PHOTO_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is too large. Max 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }

        Athlete athlete = repository.findById(principal.userId()).orElseThrow();

        String originalName = file.getOriginalFilename();
        String ext = StringUtils.getFilenameExtension(originalName);
        if (ext == null || ext.isBlank()) {
            ext = "jpg";
        }

        // Генерируем уникальный ключ объекта; его сохраняем в athlete.photoUrl.
        String filename = "athlete_" + principal.username() + "_" + UUID.randomUUID() + "." + ext;

        try {
            String uploadContentType = contentType == null ? "application/octet-stream" : contentType;
            storageService.upload(filename, file.getBytes(), uploadContentType);
            // Если фото уже было, удаляем старый файл и только потом обновляем метаданные.
            deleteExistingPhoto(athlete.getPhotoUrl());
            athlete.setPhotoUrl(filename);
            Athlete saved = repository.save(athlete);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/me/photo")
    public ResponseEntity<Athlete> deleteMyPhoto() {
        AuthPrincipal principal = currentPrincipal();
        if (principal.role() != UserRole.ATHLETE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only athlete can delete own photo");
        }

        Athlete athlete = repository.findById(principal.userId()).orElseThrow();
        // ЛР3: при удалении обязательно чистим и файл, и ссылку в БД.
        deleteExistingPhoto(athlete.getPhotoUrl());
        athlete.setPhotoUrl(null);
        Athlete saved = repository.save(athlete);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/photo/{filename}")
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
                    // Небольшой private-cache ускоряет повторные загрузки фото без раскрытия публичного кэша.
                    .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --------------------------------------------------------------
    // DELETE
    // --------------------------------------------------------------
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        repository.deleteById(id);
    }

    private AuthPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return principal;
    }

    private int totalPages(int total, int size) {
        if (total == 0) {
            return 0;
        }
        return (int) Math.ceil((double) total / size);
    }

    private String normalizeSortBy(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return "fullName";
        }
        return switch (sortBy) {
            case "fullName", "birthDate", "group" -> sortBy;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported sortBy");
        };
    }

    private Comparator<Athlete> athleteComparator(String sortBy) {
        return switch (sortBy) {
            case "birthDate" -> Comparator.comparing(Athlete::getBirthDate, Comparator.nullsLast(Comparator.naturalOrder()));
            case "group" -> Comparator.comparing(a -> safeLower(a.getGrp()));
            default -> Comparator.comparing(a -> safeLower(a.getFullName()));
        };
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
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
            // Non-fatal cleanup: metadata update should still complete.
        }
    }

    public record AthleteListResponse(
            // ЛР3: мета ответа для клиентской пагинации.
            List<Athlete> items,
            int total,
            int page,
            int size,
            int totalPages
    ) {}
}
