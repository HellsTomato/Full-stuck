// backend/src/main/java/ru/mtuci/sportapp/backend/controller/InjuryController.java
package ru.mtuci.sportapp.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import ru.mtuci.sportapp.backend.entity.Athlete;
import ru.mtuci.sportapp.backend.entity.Injury;
import ru.mtuci.sportapp.backend.entity.InjuryStatus;
import ru.mtuci.sportapp.backend.model.CreateInjuryRequest;
import ru.mtuci.sportapp.backend.model.InjuryDto;
import ru.mtuci.sportapp.backend.model.UpdateInjuryStatusRequest;
import ru.mtuci.sportapp.backend.repo.AthleteRepo;
import ru.mtuci.sportapp.backend.repo.InjuryRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@RestController
@RequestMapping("/api/injuries")
public class InjuryController {

    private final InjuryRepository injuryRepo;
    private final AthleteRepo athleteRepo;

    public InjuryController(InjuryRepository injuryRepo, AthleteRepo athleteRepo) {
        this.injuryRepo = injuryRepo;
        this.athleteRepo = athleteRepo;
    }

    // ──────────────────────────────────────
    // 1. Список травм с фильтрами
    // GET /api/injuries?status=ACTIVE&group=JUNIORS&search=петр
    // ──────────────────────────────────────
    @GetMapping
    public List<InjuryDto> list(
            @RequestParam(value = "status", required = false) String statusStr,
            @RequestParam(value = "group", required = false) String group,
            @RequestParam(value = "search", required = false) String search
    ) {
        // грузим все травмы с подтянутым спортсменом
        List<Injury> all = injuryRepo.findAllWithAthlete();

        final InjuryStatus statusFilter = parseStatus(statusStr);
        // ВАЖНО: group приходит как "JUNIORS"/"SENIORS"
        final String groupFilter = prepareGroupFilter(group);
        final String searchFilter = normalize(search); // нижний регистр, для contains

        return all.stream()
                // фильтр по статусу
                .filter(i -> statusFilter == null || i.getStatus() == statusFilter)

                // фильтр по группе (поддерживаем и коды, и русские названия)
                .filter(i -> {
                    if (groupFilter == null) return true;

                    String rawGroup = Optional.ofNullable(i.getAthlete().getGrp()).orElse("");
                    String gNorm = normalize(rawGroup); // "юниоры", "старшие", "juniors", "seniors", ...

                    // groupFilter тут либо "JUNIORS", либо "SENIORS" (верхний регистр)
                    return switch (groupFilter) {
                        case "JUNIORS" ->
                                "juniors".equals(gNorm) || "юниоры".equals(gNorm);
                        case "SENIORS" ->
                                "seniors".equals(gNorm) || "старшие".equals(gNorm);
                        default -> gNorm != null && gNorm.equals(groupFilter.toLowerCase(Locale.ROOT));
                    };
                })

                // фильтр по поиску (ФИО + тип травмы)
                .filter(i -> {
                    if (searchFilter == null) return true;

                    String name = Optional.ofNullable(i.getAthlete().getFullName()).orElse("");
                    String type = Optional.ofNullable(i.getType()).orElse("");
                    String composite = (name + " " + type).toLowerCase(Locale.ROOT);

                    return composite.contains(searchFilter);
                })

                // мапим в DTO
                .map(InjuryDto::fromEntity)
                .toList();
    }

    // разбор статуса из строки
    private InjuryStatus parseStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) return null;
        try {
            return InjuryStatus.valueOf(status.toUpperCase(Locale.ROOT));
        } catch (Exception ignored) {
            return null;
        }
    }

    // подготовка фильтра по группе:
    // "ALL" / null → null
    // "juniors"/"JUNIORS" → "JUNIORS"
    // "seniors"/"SENIORS" → "SENIORS"
    private String prepareGroupFilter(String group) {
        if (group == null || group.isBlank() || "ALL".equalsIgnoreCase(group)) {
            return null;
        }
        return group.toUpperCase(Locale.ROOT);
    }

    // normalize для поиска/сравнения (нижний регистр, пустые → null)
    private String normalize(String s) {
        if (s == null || s.isBlank() || "ALL".equalsIgnoreCase(s)) return null;
        return s.toLowerCase(Locale.ROOT);
    }

    // ──────────────────────────────────────
    // 2. Детали одной травмы
    // GET /api/injuries/{id}
    // ──────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<InjuryDto> getOne(@PathVariable Long id) {
        Injury injury = injuryRepo.findByIdWithAthlete(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Injury not found"));

        return ResponseEntity.ok(InjuryDto.fromEntity(injury));
    }

    // ──────────────────────────────────────
    // 3. Создать травму
    // POST /api/injuries
    // ──────────────────────────────────────
    @PostMapping
    public ResponseEntity<InjuryDto> create(@RequestBody CreateInjuryRequest req) {

        if (req.getAthleteId() == null || req.getType() == null || req.getType().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Athlete athlete = athleteRepo.findById(req.getAthleteId())
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Athlete not found"));

        Injury injury = new Injury();
        injury.setAthlete(athlete);
        injury.setType(req.getType());
        injury.setDate(req.getDate() != null ? req.getDate() : LocalDate.now());
        injury.setStatus(InjuryStatus.ACTIVE);
        injury.setClosedDate(null);
        injury.setNotes(req.getNotes());

        Injury saved = injuryRepo.save(injury);
        return ResponseEntity.ok(InjuryDto.fromEntity(saved));
    }

    // ──────────────────────────────────────
    // 4. Обновление статуса (активна / закрыта)
    // PATCH /api/injuries/{id}/status
    // body: { "status": "CLOSED", "closedDate": "2025-11-29" }
    // ──────────────────────────────────────
    @PatchMapping("/{id}/status")
    public ResponseEntity<InjuryDto> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateInjuryStatusRequest body
    ) {
        Injury injury = injuryRepo.findByIdWithAthlete(id)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Injury not found"));

        if (body.getStatus() == null) {
            return ResponseEntity.badRequest().build();
        }

        InjuryStatus newStatus = body.getStatus();
        injury.setStatus(newStatus);

        if (newStatus == InjuryStatus.CLOSED) {
            injury.setClosedDate(
                    body.getClosedDate() != null ? body.getClosedDate() : LocalDate.now()
            );
        } else {
            // если снова сделали активной — дата закрытия очищается
            injury.setClosedDate(null);
        }

        Injury saved = injuryRepo.save(injury);
        return ResponseEntity.ok(InjuryDto.fromEntity(saved));
    }

    // ──────────────────────────────────────
    // 5. Удалить травму
    // DELETE /api/injuries/{id}
    // ──────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!injuryRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        injuryRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
