package ru.mtuci.sportapp.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.mtuci.sportapp.backend.entity.TrainingGroup;
import ru.mtuci.sportapp.backend.entity.TrainingSession;
import ru.mtuci.sportapp.backend.model.CopyWeekRequest;
import ru.mtuci.sportapp.backend.model.WeeklyTrainingDto;
import ru.mtuci.sportapp.backend.repo.TrainingSessionRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/weekly-plan")
public class WeeklyPlanController {

    private final TrainingSessionRepository trainingRepo;

    public WeeklyPlanController(TrainingSessionRepository trainingRepo) {
        this.trainingRepo = trainingRepo;
    }

    // ──────────────────────────────────────
    // 1. Получить план недели
    // ──────────────────────────────────────
    @GetMapping
    public List<WeeklyTrainingDto> getWeekPlan(
            @RequestParam("weekStart") String weekStartStr,
            @RequestParam("group") String groupStr
    ) {
        LocalDate weekStart = LocalDate.parse(weekStartStr);
        LocalDate weekEnd = weekStart.plusDays(6);

        List<TrainingSession> sessions;

        // "ALL" или пустая строка → все группы
        if (groupStr == null || groupStr.isBlank() || "ALL".equalsIgnoreCase(groupStr)) {
            sessions = trainingRepo.findByDateBetween(weekStart, weekEnd);
        } else {
            try {
                TrainingGroup group = TrainingGroup.valueOf(groupStr);
                sessions = trainingRepo.findByDateBetweenAndGroupType(weekStart, weekEnd, group);
            } catch (IllegalArgumentException ex) {
                // На всякий случай — если пришло левое значение, не падаем
                sessions = trainingRepo.findByDateBetween(weekStart, weekEnd);
            }
        }

        return sessions.stream()
                .map(WeeklyTrainingDto::fromEntity)
                .toList();
    }

    // ──────────────────────────────────────
    // 2. Создать / сохранить тренировку
    // ──────────────────────────────────────
    @PostMapping
    public WeeklyTrainingDto saveTraining(@RequestBody WeeklyTrainingDto dto) {

        TrainingSession entity;

        if (dto.getId() != null) {
            entity = trainingRepo.findById(dto.getId())
                    .orElseGet(TrainingSession::new);
        } else {
            entity = new TrainingSession();
        }

        // дата — обязательно
        entity.setDate(LocalDate.parse(dto.getDate()));

        // время может быть пустым
        if (dto.getTime() != null && !dto.getTime().isBlank()) {
            entity.setTime(LocalTime.parse(dto.getTime()));
        } else {
            entity.setTime(null);
        }

        entity.setType(dto.getType());
        entity.setLoadLevel(dto.getLoadLevel());
        entity.setNotes(dto.getNotes());

        // group: "JUNIORS" / "SENIORS" или null
        if (dto.getGroup() != null && !dto.getGroup().isBlank()) {
            try {
                TrainingGroup g = TrainingGroup.valueOf(dto.getGroup());
                entity.setGroupType(g);
            } catch (IllegalArgumentException ex) {
                entity.setGroupType(null); // не валидное значение — не падаем
            }
        } else {
            entity.setGroupType(null);
        }

        TrainingSession saved = trainingRepo.save(entity);
        return WeeklyTrainingDto.fromEntity(saved);
    }

    // ──────────────────────────────────────
    // 3. Удалить тренировку
    // ──────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTraining(@PathVariable Long id) {
        if (trainingRepo.existsById(id)) {
            trainingRepo.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ──────────────────────────────────────
    // 4. Копировать неделю
    // ──────────────────────────────────────
    @PostMapping("/copy")
    public ResponseEntity<Void> copyWeek(@RequestBody CopyWeekRequest req) {

        LocalDate from = LocalDate.parse(req.getFromWeekStart());
        LocalDate to = LocalDate.parse(req.getToWeekStart());

        LocalDate fromEnd = from.plusDays(6);
        LocalDate toEnd = to.plusDays(6);

        List<TrainingSession> source;

        if (req.getGroup() == null) {
            source = trainingRepo.findByDateBetween(from, fromEnd);
        } else {
            source = trainingRepo.findByDateBetweenAndGroupType(from, fromEnd, req.getGroup());
        }

        // Сначала чистим целевую неделю
        List<TrainingSession> target = trainingRepo.findByDateBetween(to, toEnd);
        trainingRepo.deleteAll(target);

        // Копируем
        for (TrainingSession s : source) {
            TrainingSession copy = new TrainingSession();
            copy.setType(s.getType());
            copy.setLoadLevel(s.getLoadLevel());
            copy.setNotes(s.getNotes());
            copy.setGroupType(s.getGroupType());
            copy.setTime(s.getTime());

            long offset = s.getDate().toEpochDay() - from.toEpochDay();
            copy.setDate(to.plusDays(offset));

            trainingRepo.save(copy);
        }

        return ResponseEntity.noContent().build();
    }
}
