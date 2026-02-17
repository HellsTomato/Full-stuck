package ru.mtuci.sportapp.backend.model;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Тело запроса для создания/обновления приема пищи.
 */
public class RationItemRequest {

    private UUID athleteId;
    private LocalDate date;
    private String category;
    private String title;
    private Integer calories;
    private String notes;

    public RationItemRequest() {
    }

    public UUID getAthleteId() {
        return athleteId;
    }

    public void setAthleteId(UUID athleteId) {
        this.athleteId = athleteId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getCalories() {
        return calories;
    }

    public void setCalories(Integer calories) {
        this.calories = calories;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
