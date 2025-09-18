package ru.mtuci.sportapp.backend.controller;

import ru.mtuci.sportapp.backend.entity.Athlete;
import ru.mtuci.sportapp.backend.repo.AthleteRepo;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/athletes")
public class AthleteController {

    private final AthleteRepo repo;

    public AthleteController(AthleteRepo repo) {
        this.repo = repo;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam(required = false) String search,
                                    @RequestParam(required = false, name = "group") String group,
                                    @RequestParam(required = false) String status) {
        var items = repo.search(blank(group), blank(status), blank(search));
        return Map.of("items", items);
    }

    @PostMapping
    public Athlete create(@RequestBody Map<String, Object> body) {
        var a = new Athlete();
        a.setId(UUID.randomUUID());
        a.setFullName((String) body.get("fullName"));
        a.setBirthDate(LocalDate.parse((String) body.get("birthDate"))); // формат YYYY-MM-DD
        a.setGroup((String) body.get("group"));
        a.setPhone((String) body.getOrDefault("phone", null));
        a.setNotes((String) body.getOrDefault("notes", null));
        a.setStatus((String) body.getOrDefault("status", "active"));
        return repo.save(a);
    }

    @PatchMapping("/{id}")
    public Athlete patch(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        var a = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("fullName")) a.setFullName((String) body.get("fullName"));
        if (body.containsKey("birthDate")) a.setBirthDate(LocalDate.parse((String) body.get("birthDate")));
        if (body.containsKey("group")) a.setGroup((String) body.get("group"));
        if (body.containsKey("phone")) a.setPhone((String) body.get("phone"));
        if (body.containsKey("notes")) a.setNotes((String) body.get("notes"));
        if (body.containsKey("status")) a.setStatus((String) body.get("status"));
        return repo.save(a);
    }

    private static String blank(String s) { return (s == null || s.isBlank()) ? null : s; }
}


