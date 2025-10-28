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

    @GetMapping
    public List<Athlete> list(
            @RequestParam(value = "group", required = false) String grp,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "q", required = false) String q
    ) {
        // если q пустая или null — не фильтруем по имени
        String pattern = (q == null || q.isBlank())
                ? null
                : "%" + q.toLowerCase() + "%";

        return repository.search(grp, status, pattern);
    }

    @PostMapping
    public Athlete create(@RequestBody Athlete athlete) {
        if (athlete.getId() == null) {
            athlete.setId(UUID.randomUUID());
        }
        if (athlete.getStatus() == null) {
            athlete.setStatus("active");
        }
        return repository.save(athlete);
    }

    @PutMapping("/{id}")
    public Athlete update(@PathVariable UUID id, @RequestBody Athlete athlete) {
        athlete.setId(id);
        return repository.save(athlete);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        repository.deleteById(id);
    }
}
