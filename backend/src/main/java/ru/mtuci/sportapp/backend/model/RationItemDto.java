package ru.mtuci.sportapp.backend.model;

import java.time.LocalDate;

/**
 * Один прием пищи внутри дня.
 */
public class RationItemDto {

    private Long id;
    private LocalDate date;
    private String category;  // завтрак / обед / ужин / перекус
    private String title;     // что именно
    private Integer calories; // калораж
    private String notes;     // доп. заметки

    public RationItemDto() {
    }

    public RationItemDto(Long id,
                         LocalDate date,
                         String category,
                         String title,
                         Integer calories,
                         String notes) {
        this.id = id;
        this.date = date;
        this.category = category;
        this.title = title;
        this.calories = calories;
        this.notes = notes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
