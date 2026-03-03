package ru.mtuci.sportapp.backend.controller;

import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import ru.mtuci.sportapp.backend.entity.Athlete;
import ru.mtuci.sportapp.backend.entity.TrainerAthleteLink;
import ru.mtuci.sportapp.backend.repo.AthleteRepo;
import ru.mtuci.sportapp.backend.repo.TrainerAthleteLinkRepo;
import ru.mtuci.sportapp.backend.security.AuthPrincipal;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/trainers/me/athletes")
// Контроллер управления связями trainer <-> athlete; доступ только у TRAINER
@PreAuthorize("hasAuthority('TRAINER_ATHLETE_LINKS_MANAGE')")
public class TrainerAthleteLinkController {

    private final TrainerAthleteLinkRepo linkRepo;
    private final AthleteRepo athleteRepo;

    public TrainerAthleteLinkController(TrainerAthleteLinkRepo linkRepo, AthleteRepo athleteRepo) {
        this.linkRepo = linkRepo;
        this.athleteRepo = athleteRepo;
    }

    @GetMapping
    public List<Athlete> myAthletes() {
        // Достаём userId текущего тренера из SecurityContext
        AuthPrincipal principal = currentPrincipal();
        List<TrainerAthleteLink> links = linkRepo.findByTrainerId(principal.userId());
        List<UUID> ids = links.stream().map(TrainerAthleteLink::getAthleteId).toList();
        if (ids.isEmpty()) {
            return List.of();
        }
        return athleteRepo.findAllById(ids);
    }

    @PostMapping("/{athleteId}")
    public ResponseEntity<Void> linkAthlete(@PathVariable UUID athleteId) {
        AuthPrincipal principal = currentPrincipal();

        if (!athleteRepo.existsById(athleteId)) {
            return ResponseEntity.notFound().build();
        }

        boolean exists = linkRepo.existsByTrainerIdAndAthleteId(principal.userId(), athleteId);
        // Повторная привязка не создаёт дубликат
        if (!exists) {
            TrainerAthleteLink link = new TrainerAthleteLink();
            link.setTrainerId(principal.userId());
            link.setAthleteId(athleteId);
            link.setCreatedAt(Instant.now());
            linkRepo.save(link);
        }

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{athleteId}")
    @Transactional
    public ResponseEntity<Void> unlinkAthlete(@PathVariable UUID athleteId) {
        AuthPrincipal principal = currentPrincipal();
        linkRepo.deleteLink(principal.userId(), athleteId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ids")
    public Set<UUID> myAthleteIds() {
        AuthPrincipal principal = currentPrincipal();
        return linkRepo.findByTrainerId(principal.userId()).stream()
                .map(TrainerAthleteLink::getAthleteId)
                .collect(Collectors.toSet());
    }

    private AuthPrincipal currentPrincipal() {
        // Если principal не поднят фильтром — запрос считаем неаутентифицированным
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return principal;
    }
}
