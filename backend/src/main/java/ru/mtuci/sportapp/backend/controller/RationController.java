package ru.mtuci.sportapp.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.mtuci.sportapp.backend.entity.Athlete;
import ru.mtuci.sportapp.backend.entity.FoodStatus;
import ru.mtuci.sportapp.backend.entity.MealCategory;
import ru.mtuci.sportapp.backend.entity.RationDay;
import ru.mtuci.sportapp.backend.entity.RationItem;
import ru.mtuci.sportapp.backend.model.RationDayDto;
import ru.mtuci.sportapp.backend.model.RationDayUpdateRequest;
import ru.mtuci.sportapp.backend.model.RationItemDto;
import ru.mtuci.sportapp.backend.model.RationItemRequest;
import ru.mtuci.sportapp.backend.model.RationSummaryRowDto;
import ru.mtuci.sportapp.backend.model.WeeklyRationDto;
import ru.mtuci.sportapp.backend.repo.AthleteRepo;
import ru.mtuci.sportapp.backend.repo.RationDayRepository;
import ru.mtuci.sportapp.backend.repo.RationItemRepository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ration")
public class RationController {

    private final AthleteRepo athleteRepo;
    private final RationDayRepository dayRepo;
    private final RationItemRepository itemRepo;

    public RationController(
            AthleteRepo athleteRepo,
            RationDayRepository dayRepo,
            RationItemRepository itemRepo
    ) {
        this.athleteRepo = athleteRepo;
        this.dayRepo = dayRepo;
        this.itemRepo = itemRepo;
    }

    // -------------------------------------------------------
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // -------------------------------------------------------

    private LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("date is required");
        }

        String value = raw.trim();

        // ISO: 2025-12-01
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException ignored) {}

        // dd.MM.yyyy
        try {
            return LocalDate.parse(value, DateTimeFormatter.ofPattern("dd.MM.yyyy"));
        } catch (DateTimeParseException ignored) {}

        throw new IllegalArgumentException("Unsupported date format: " + raw);
    }

    private String toFoodStatusString(FoodStatus fs) {
        return fs != null ? fs.name() : null;
    }

    private String toMealCategoryString(MealCategory cat) {
        return cat != null ? cat.name() : null;
    }

    private FoodStatus parseFoodStatus(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return FoodStatus.valueOf(raw);
        } catch (IllegalArgumentException e) {
            // если пришла левая строка – просто игнорируем
            return null;
        }
    }

    private MealCategory parseMealCategory(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return MealCategory.valueOf(raw);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    // -------------------------------------------------------
    // 1. СВОДКА ПО ВСЕМ СПОРТСМЕНАМ НА ДАТУ
    // -------------------------------------------------------

    @GetMapping("/summary")
    public List<RationSummaryRowDto> getSummary(
            @RequestParam("date") String dateStr,
            @RequestParam(value = "group", required = false) String group,
            @RequestParam(value = "search", required = false) String search
    ) {
        LocalDate date = parseDate(dateStr);

        // group приходит как:
        //  - "ALL"
        //  - "JUNIORS" / "SENIORS"
        //  - либо уже "Юниоры"/"Старшие" (если откуда-то ещё вызывается)
        String groupParam = (group == null || group.isBlank() || group.equalsIgnoreCase("ALL"))
                ? null
                : group;

        String searchParam = (search == null || search.isBlank())
                ? null
                : "%" + search.toLowerCase() + "%";

        List<Athlete> athletes = athleteRepo.search(groupParam, searchParam);

        return athletes.stream()
                .map(a -> {
                    Optional<RationDay> dayOpt =
                            dayRepo.findByAthlete_IdAndDate(a.getId(), date);

                    String status = dayOpt
                            .map(RationDay::getFoodStatus)
                            .map(Enum::name)
                            .orElse(null);

                    Double weight = dayOpt
                            .map(RationDay::getMorningWeight)
                            .orElse(null);

                    String notes = dayOpt
                            .map(RationDay::getComment)
                            .orElse(null);

                    return new RationSummaryRowDto(
                            a.getId(),        // athleteId
                            a.getFullName(),  // ФИО
                            a.getGrp(),       // группа ("Юниоры"/"Старшие"/что в базе)
                            null,             // photoUrl
                            status,
                            weight,
                            notes
                    );
                })
                .collect(Collectors.toList());
    }

    // -------------------------------------------------------
    // 2. НЕДЕЛЯ РАЦИОНА ОТДЕЛЬНОГО СПОРТСМЕНА (ПОКА НЕ ИСПОЛЬЗУЕМ)
    // -------------------------------------------------------

    @GetMapping("/{athleteId}")
    public ResponseEntity<WeeklyRationDto> getWeeklyRation(
            @PathVariable UUID athleteId,
            @RequestParam("week") String weekStr
    ) {
        Athlete athlete = athleteRepo.findById(athleteId)
                .orElseThrow(() -> new RuntimeException("Athlete not found: " + athleteId));

        LocalDate anyDate = parseDate(weekStr);
        LocalDate weekStart = anyDate.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = weekStart.plusDays(6);

        List<RationDay> days =
                dayRepo.findByAthlete_IdAndDateBetween(athleteId, weekStart, weekEnd);
        List<RationItem> items =
                itemRepo.findByAthlete_IdAndDateBetween(athleteId, weekStart, weekEnd);

        Map<LocalDate, RationDay> dayMap = days.stream()
                .collect(Collectors.toMap(RationDay::getDate, d -> d));

        Map<LocalDate, List<RationItem>> itemsMap = items.stream()
                .collect(Collectors.groupingBy(RationItem::getDate));

        List<RationDayDto> dayDtos = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            LocalDate d = weekStart.plusDays(i);

            RationDay day = dayMap.get(d);
            FoodStatus fs = day != null ? day.getFoodStatus() : null;
            Double weight = day != null ? day.getMorningWeight() : null;
            String comment = day != null ? day.getComment() : null;

            List<RationItemDto> itemDtos = itemsMap
                    .getOrDefault(d, List.of())
                    .stream()
                    .map(it -> new RationItemDto(
                            it.getId(),
                            it.getDate(),
                            toMealCategoryString(it.getCategory()),
                            it.getTitle(),
                            it.getCalories(),
                            it.getNotes()
                    ))
                    .collect(Collectors.toList());

            dayDtos.add(
                    new RationDayDto(
                            d,
                            toFoodStatusString(fs),
                            weight,
                            comment,
                            itemDtos
                    )
            );
        }

        WeeklyRationDto.AthleteInfoDto info =
                new WeeklyRationDto.AthleteInfoDto(athlete);

        WeeklyRationDto response = new WeeklyRationDto(
                info,
                weekStart,
                weekEnd,
                dayDtos
        );

        return ResponseEntity.ok(response);
    }

    // -------------------------------------------------------
    // 3. СОЗДАТЬ ПРИЁМ ПИЩИ
    // -------------------------------------------------------

    @PostMapping("/item")
    public ResponseEntity<RationItemDto> createItem(
            @RequestBody RationItemRequest req
    ) {
        Athlete athlete = athleteRepo.findById(req.getAthleteId())
                .orElseThrow(() -> new RuntimeException("Athlete not found"));

        RationItem item = new RationItem();
        item.setAthlete(athlete);
        item.setDate(req.getDate());

        MealCategory cat = parseMealCategory(req.getCategory());
        item.setCategory(cat);

        item.setTitle(req.getTitle());
        item.setCalories(req.getCalories());
        item.setNotes(req.getNotes());

        RationItem saved = itemRepo.save(item);

        RationItemDto dto = new RationItemDto(
                saved.getId(),
                saved.getDate(),
                toMealCategoryString(saved.getCategory()),
                saved.getTitle(),
                saved.getCalories(),
                saved.getNotes()
        );

        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    // -------------------------------------------------------
    // 4. РЕДАКТИРОВАТЬ ПРИЁМ ПИЩИ
    // -------------------------------------------------------

    @PatchMapping("/item/{id}")
    public ResponseEntity<RationItemDto> updateItem(
            @PathVariable Long id,
            @RequestBody RationItemRequest req
    ) {
        RationItem item = itemRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Ration item not found"));

        if (req.getDate() != null) {
            item.setDate(req.getDate());
        }

        if (req.getCategory() != null) {
            item.setCategory(parseMealCategory(req.getCategory()));
        }

        if (req.getTitle() != null) {
            item.setTitle(req.getTitle());
        }

        if (req.getCalories() != null) {
            item.setCalories(req.getCalories());
        }

        if (req.getNotes() != null) {
            item.setNotes(req.getNotes());
        }

        RationItem saved = itemRepo.save(item);

        RationItemDto dto = new RationItemDto(
                saved.getId(),
                saved.getDate(),
                toMealCategoryString(saved.getCategory()),
                saved.getTitle(),
                saved.getCalories(),
                saved.getNotes()
        );

        return ResponseEntity.ok(dto);
    }

    // -------------------------------------------------------
    // 5. УДАЛИТЬ ПРИЁМ ПИЩИ
    // -------------------------------------------------------

    @DeleteMapping("/item/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        if (!itemRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        itemRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------
    // 6. ОБНОВИТЬ ВЕС / СТАТУС / КОММЕНТАРИЙ ПО ДНЮ
    //    (ТО, ЧТО ДЁРГАЕТ КНОПКА "СОХРАНИТЬ" В МОДАЛКЕ)
    // -------------------------------------------------------

    @PatchMapping("/{athleteId}/weight")
    public ResponseEntity<Void> updateDayInfo(
            @PathVariable UUID athleteId,
            @RequestBody RationDayUpdateRequest req
    ) {
        Athlete athlete = athleteRepo.findById(athleteId)
                .orElseThrow(() -> new RuntimeException("Athlete not found"));

        if (req.getDate() == null) {
            return ResponseEntity.badRequest().build();
        }

        RationDay day = dayRepo
                .findByAthlete_IdAndDate(athleteId, req.getDate())
                .orElseGet(() -> {
                    RationDay d = new RationDay();
                    d.setAthlete(athlete);
                    d.setDate(req.getDate());
                    return d;
                });

        day.setMorningWeight(req.getMorningWeight());
        day.setComment(req.getComment());

        FoodStatus fs = parseFoodStatus(req.getFoodStatus());
        day.setFoodStatus(fs);

        dayRepo.save(day);

        return ResponseEntity.noContent().build();
    }
}
