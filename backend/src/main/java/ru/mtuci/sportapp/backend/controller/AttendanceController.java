package ru.mtuci.sportapp.backend.controller;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.mtuci.sportapp.backend.entity.Athlete;
import ru.mtuci.sportapp.backend.entity.AttendanceRecord;
import ru.mtuci.sportapp.backend.entity.AttendanceStatus;
import ru.mtuci.sportapp.backend.entity.TrainingGroup;
import ru.mtuci.sportapp.backend.entity.TrainingSession;
import ru.mtuci.sportapp.backend.model.AttendanceBulkUpdateRequest;
import ru.mtuci.sportapp.backend.model.AttendanceDto;
import ru.mtuci.sportapp.backend.model.AttendanceListResponse;
import ru.mtuci.sportapp.backend.repo.AthleteRepo;
import ru.mtuci.sportapp.backend.repo.AttendanceRepository;
import ru.mtuci.sportapp.backend.repo.TrainingSessionRepository;

import java.time.LocalDate;
import java.util.*;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepo;
    private final TrainingSessionRepository trainingRepo;
    private final AthleteRepo athleteRepo;

    public AttendanceController(
            AttendanceRepository attendanceRepo,
            TrainingSessionRepository trainingRepo,
            AthleteRepo athleteRepo
    ) {
        this.attendanceRepo = attendanceRepo;
        this.trainingRepo = trainingRepo;
        this.athleteRepo = athleteRepo;
    }

    // =====================================================================
    //  GET /api/attendance?date=2024-12-01&group=JUNIORS
    // =====================================================================
    @GetMapping
    public ResponseEntity<AttendanceListResponse> getAttendance(
            @RequestParam("date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,
            @RequestParam(value = "group", required = false)
            TrainingGroup group
    ) {

        // Если указана конкретная группа
        if (group != null) {
            List<TrainingSession> sessions =
                    trainingRepo.findByDateBetweenAndGroupType(date, date, group);

            if (sessions == null || sessions.isEmpty()) {
                return ResponseEntity.ok(new AttendanceListResponse(Collections.emptyList()));
            }

            List<AttendanceDto> items = buildAttendanceForGroup(date, group);
            return ResponseEntity.ok(new AttendanceListResponse(items));
        }

        // Если группа не указана — берём все тренировки на этот день
        List<TrainingSession> allSessions =
                trainingRepo.findByDateBetween(date, date);

        if (allSessions == null || allSessions.isEmpty()) {
            return ResponseEntity.ok(new AttendanceListResponse(Collections.emptyList()));
        }

        // Собираем уникальные группы, которые тренируются в этот день
        Set<TrainingGroup> groupsWithTraining = new HashSet<>();
        for (TrainingSession s : allSessions) {
            if (s.getGroupType() != null) {
                groupsWithTraining.add(s.getGroupType());
            }
        }

        List<AttendanceDto> result = new ArrayList<>();
        for (TrainingGroup g : groupsWithTraining) {
            result.addAll(buildAttendanceForGroup(date, g));
        }

        return ResponseEntity.ok(new AttendanceListResponse(result));
    }

    // =====================================================================
    //  Построить список DTO для конкретной группы на дату
    // =====================================================================
    private List<AttendanceDto> buildAttendanceForGroup(LocalDate date, TrainingGroup group) {

        // Берём всех спортсменов и фильтруем по grp → TrainingGroup
        List<Athlete> allAthletes = athleteRepo.findAll();
        List<Athlete> groupAthletes = new ArrayList<>();

        for (Athlete athlete : allAthletes) {
            TrainingGroup athleteGroup = mapGrpToEnum(athlete.getGrp());
            if (athleteGroup == group) {
                groupAthletes.add(athlete);
            }
        }

        if (groupAthletes.isEmpty()) {
            return Collections.emptyList();
        }

        // Берём записи посещаемости за эту дату и группу
        List<AttendanceRecord> records =
                attendanceRepo.findByDateAndGroupType(date, group);

        // Map<UUID, AttendanceRecord> по ID спортсмена
        Map<UUID, AttendanceRecord> byAthleteId = new HashMap<>();
        for (AttendanceRecord rec : records) {
            UUID athleteId = rec.getAthlete().getId();
            byAthleteId.put(athleteId, rec);
        }

        // Сортируем спортсменов по ФИО
        groupAthletes.sort(Comparator.comparing(Athlete::getFullName));

        // Строим DTO
        List<AttendanceDto> result = new ArrayList<>();
        for (Athlete athlete : groupAthletes) {
            AttendanceRecord rec = byAthleteId.get(athlete.getId());

            Long attendanceId = rec != null ? rec.getId() : null;
            AttendanceStatus status = rec != null
                    ? rec.getStatus()
                    : AttendanceStatus.ABSENT;

            AttendanceDto dto = new AttendanceDto(
                    attendanceId,
                    athlete.getId(),
                    athlete.getFullName(),
                    group,
                    date,
                    status
            );

            result.add(dto);
        }

        return result;
    }

    // =====================================================================
    //  POST /api/attendance/bulk
    // =====================================================================
    @PostMapping("/bulk")
    public ResponseEntity<AttendanceListResponse> saveBulk(
            @RequestBody AttendanceBulkUpdateRequest request
    ) {
        LocalDate date = request.getDate();
        TrainingGroup group = request.getGroup();

        if (date == null) {
            return ResponseEntity.badRequest().build();
        }

        // Собираем UUID всех спортсменов из запроса
        List<UUID> athleteIds = new ArrayList<>();
        if (request.getItems() != null) {
            for (AttendanceBulkUpdateRequest.Item item : request.getItems()) {
                if (item.getAthleteId() != null) {
                    athleteIds.add(item.getAthleteId());
                }
            }
        }

        // Загружаем этих спортсменов
        List<Athlete> athletes = athleteRepo.findAllById(athleteIds);
        Map<UUID, Athlete> athleteById = new HashMap<>();
        for (Athlete a : athletes) {
            athleteById.put(a.getId(), a);
        }

        // Существующие записи посещаемости за день
        List<AttendanceRecord> existing =
                (group != null)
                        ? attendanceRepo.findByDateAndGroupType(date, group)
                        : attendanceRepo.findByDate(date);

        // Индекс по ключу "дата+группа+спортсмен"
        Map<String, AttendanceRecord> index = new HashMap<>();
        for (AttendanceRecord rec : existing) {
            String key = buildKey(rec.getDate(), rec.getGroupType(), rec.getAthlete().getId());
            index.put(key, rec);
        }

        // Создаём / обновляем записи
        if (request.getItems() != null) {
            for (AttendanceBulkUpdateRequest.Item item : request.getItems()) {
                UUID athleteId = item.getAthleteId();
                AttendanceStatus status = item.getStatus();

                if (athleteId == null || status == null) {
                    continue;
                }

                Athlete athlete = athleteById.get(athleteId);
                if (athlete == null) {
                    continue;
                }

                TrainingGroup athleteGroup = mapGrpToEnum(athlete.getGrp());
                TrainingGroup effectiveGroup = (group != null) ? group : athleteGroup;
                if (effectiveGroup == null) {
                    continue;
                }

                String key = buildKey(date, effectiveGroup, athleteId);
                AttendanceRecord record = index.get(key);

                if (record == null) {
                    record = new AttendanceRecord();
                    record.setDate(date);
                    record.setGroupType(effectiveGroup);
                    record.setAthlete(athlete);
                }

                record.setStatus(status);
                attendanceRepo.save(record);
            }
        }

        // Возвращаем актуальное состояние
        List<AttendanceDto> items;

        if (group != null) {
            items = buildAttendanceForGroup(date, group);
        } else {
            List<TrainingSession> allSessions =
                    trainingRepo.findByDateBetween(date, date);

            if (allSessions == null || allSessions.isEmpty()) {
                items = Collections.emptyList();
            } else {
                Set<TrainingGroup> groups = new HashSet<>();
                for (TrainingSession s : allSessions) {
                    if (s.getGroupType() != null) {
                        groups.add(s.getGroupType());
                    }
                }

                List<AttendanceDto> result = new ArrayList<>();
                for (TrainingGroup g : groups) {
                    result.addAll(buildAttendanceForGroup(date, g));
                }
                items = result;
            }
        }

        return ResponseEntity.ok(new AttendanceListResponse(items));
    }

    // Уникальный ключ "дата_группа_спортсмен"
    private String buildKey(LocalDate date, TrainingGroup group, UUID athleteId) {
        return date.toString() + "_" + group.name() + "_" + athleteId;
    }

    // Маппинг строки grp → enum TrainingGroup
    private TrainingGroup mapGrpToEnum(String grp) {
        if (grp == null) return null;
        String normalized = grp.trim().toUpperCase();

        switch (normalized) {
            case "JUNIORS":
            case "ЮНИОРЫ":
            case "ЮНИОР":
            case "J":
            case "JUNIOR":
            case "1":
                return TrainingGroup.JUNIORS;
            case "SENIORS":
            case "СТАРШИЕ":
            case "S":
            case "SENIOR":
            case "2":
                return TrainingGroup.SENIORS;
            default:
                return null;
        }
    }
}
