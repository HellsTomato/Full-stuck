package ru.mtuci.sportapp.backend.model;

import java.util.UUID;

/**
 * Одна строка сводной таблицы "Рацион" (общий список спортсменов).
 */
public class RationSummaryRowDto {

    private UUID athleteId;   // id спортсмена
    private String fullName;  // ФИО
    private String groupName; // группа (Юниоры / Старшие)
    private String photoUrl;  // пока можно null
    private String foodStatus; // статус еды на дату
    private Double weight;     // утренний вес
    private String notes;      // примечания (комментарий)

    public RationSummaryRowDto() {
    }

    public RationSummaryRowDto(UUID athleteId,
                               String fullName,
                               String groupName,
                               String photoUrl,
                               String foodStatus,
                               Double weight,
                               String notes) {
        this.athleteId = athleteId;
        this.fullName = fullName;
        this.groupName = groupName;
        this.photoUrl = photoUrl;
        this.foodStatus = foodStatus;
        this.weight = weight;
        this.notes = notes;
    }

    public UUID getAthleteId() {
        return athleteId;
    }

    public void setAthleteId(UUID athleteId) {
        this.athleteId = athleteId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getFoodStatus() {
        return foodStatus;
    }

    public void setFoodStatus(String foodStatus) {
        this.foodStatus = foodStatus;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
