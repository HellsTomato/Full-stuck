package ru.mtuci.sportapp.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.mtuci.sportapp.backend.entity.Athlete;
import ru.mtuci.sportapp.backend.repo.AthleteRepo;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/athletes")
@RequiredArgsConstructor
@CrossOrigin
public class AthleteController {

    private final AthleteRepo repository;

    // --------------------------------------------------------------
    // GET /api/athletes?search=&group=
    // Полный поиск: по ФИО (LIKE) + по группе
    // --------------------------------------------------------------
    @GetMapping
    public List<Athlete> list(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "group", required = false) String group
    ) {
        String pattern = (search == null || search.isBlank())
                ? null
                : "%" + search.toLowerCase() + "%";

        return repository.search(group, pattern);
    }

    // --------------------------------------------------------------
    // POST — создание спортсмена
    // --------------------------------------------------------------
    @PostMapping
    public Athlete create(@RequestBody Athlete athlete) {
        if (athlete.getId() == null) {
            athlete.setId(UUID.randomUUID());
        }
        return repository.save(athlete);
    }

    // --------------------------------------------------------------
    // PATCH — частичное обновление
    // --------------------------------------------------------------
    @PatchMapping("/{id}")
    public Athlete patch(@PathVariable UUID id, @RequestBody Athlete body) {
        Athlete existing = repository.findById(id).orElseThrow();

        if (body.getFullName() != null) existing.setFullName(body.getFullName());
        if (body.getBirthDate() != null) existing.setBirthDate(body.getBirthDate());
        if (body.getGrp() != null) existing.setGrp(body.getGrp());
        if (body.getPhone() != null) existing.setPhone(body.getPhone());
        if (body.getNotes() != null) existing.setNotes(body.getNotes());

        return repository.save(existing);
    }

    // --------------------------------------------------------------
    // DELETE
    // --------------------------------------------------------------
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        repository.deleteById(id);
    }
}
