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

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/athletes")
@RequiredArgsConstructor
@CrossOrigin
public class AthleteController {

    private final AthleteRepo repository;
    private final Path uploadDir = Paths.get("uploads/profile-photos");

    // --------------------------------------------------------------
    // GET /api/athletes?search=&group=
    // Полный поиск: по ФИО (LIKE) + по группе
    // --------------------------------------------------------------
    @GetMapping
    public List<Athlete> list(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "group", required = false) String group
    ) {
        AuthPrincipal principal = currentPrincipal();
        if (principal.role() != UserRole.TRAINER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only trainer can list athletes");
        }

        String pattern = (search == null || search.isBlank())
                ? null
                : "%" + search.toLowerCase() + "%";

        return repository.search(group, pattern);
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

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Athlete athlete = repository.findById(principal.userId()).orElseThrow();

        String originalName = file.getOriginalFilename();
        String ext = StringUtils.getFilenameExtension(originalName);
        if (ext == null || ext.isBlank()) {
            ext = "jpg";
        }

        String filename = "athlete_" + principal.username() + "_" + UUID.randomUUID() + "." + ext;

        try {
            Files.createDirectories(uploadDir);
            Path target = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            athlete.setPhotoUrl(filename);
            Athlete saved = repository.save(athlete);
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/photo/{filename}")
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
}
