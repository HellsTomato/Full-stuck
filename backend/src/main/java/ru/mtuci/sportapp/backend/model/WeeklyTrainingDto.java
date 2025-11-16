package ru.mtuci.sportapp.backend.model;

import ru.mtuci.sportapp.backend.entity.TrainingGroup;
import ru.mtuci.sportapp.backend.entity.TrainingSession;

public class WeeklyTrainingDto {

    private Long id;
    private String date;       // "2025-11-16"
    private String time;       // "18:30"
    private String type;
    private String loadLevel;
    private String group;      // "JUNIORS" / "SENIORS"
    private String notes;

    public WeeklyTrainingDto() {}

    // ----- маппер из сущности -----
    public static WeeklyTrainingDto fromEntity(TrainingSession e) {
        WeeklyTrainingDto dto = new WeeklyTrainingDto();
        dto.setId(e.getId());
        dto.setDate(e.getDate() != null ? e.getDate().toString() : null);
        dto.setTime(e.getTime() != null ? e.getTime().toString() : null);
        dto.setType(e.getType());
        dto.setLoadLevel(e.getLoadLevel());
        dto.setGroup(e.getGroupType() != null ? e.getGroupType().name() : null);
        dto.setNotes(e.getNotes());
        return dto;
    }

    // ----- getters / setters -----

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
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

    public String getGroup() {
        return group;
    }

    public void setGroup(String group) {
        this.group = group;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
