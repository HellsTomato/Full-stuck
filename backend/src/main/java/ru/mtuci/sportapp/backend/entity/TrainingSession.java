package ru.mtuci.sportapp.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "training_sessions")
public class TrainingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate date;                 // дата тренировки

    private LocalTime time;                // время тренировки

    private String type;                   // тип тренировки (жим, спринт и т.д.)

    @Column(name = "load_level")
    private String loadLevel;              // нагрузка

    @Enumerated(EnumType.STRING)
    @Column(name = "group_type")
    private TrainingGroup groupType;       // JUNIORS / SENIORS

    @Column(columnDefinition = "text")
    private String notes;                  // заметки

    // ----- getters / setters -----

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

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getLoadLevel() {
        return loadLevel;
    }

    public void setLoadLevel(String loadLevel) {
        this.loadLevel = loadLevel;
    }

    public TrainingGroup getGroupType() {
        return groupType;
    }

    public void setGroupType(TrainingGroup groupType) {
        this.groupType = groupType;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
