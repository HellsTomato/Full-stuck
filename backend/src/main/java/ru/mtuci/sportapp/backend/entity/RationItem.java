package ru.mtuci.sportapp.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "ration_item")
public class RationItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // идентификатор приёма пищи

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "athlete_id", nullable = false)
    private Athlete athlete; // владелец рациона

    @Column(nullable = false)
    private LocalDate date; // дата приёма пищи (в рамках недели)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MealCategory category; // категория (завтрак/обед/перекус/...)

    @Column(nullable = false)
    private String title; // название блюда

    private Integer calories; // калорийность (может быть null)

    @Column(length = 2000)
    private String notes; // доп. заметки по конкретному приёму пищи

    // ----- getters/setters -----

    public Long getId() {
        return id;
    }

    public Athlete getAthlete() {
        return athlete;
    }

    public void setAthlete(Athlete athlete) {
        this.athlete = athlete;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public MealCategory getCategory() {
        return category;
    }

    public void setCategory(MealCategory category) {
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
