// backend/src/main/java/ru/mtuci/sportapp/backend/model/InjuryDto.java
package ru.mtuci.sportapp.backend.model;

import ru.mtuci.sportapp.backend.entity.Athlete;
import ru.mtuci.sportapp.backend.entity.Injury;
import ru.mtuci.sportapp.backend.entity.InjuryStatus;

import java.time.LocalDate;
import java.util.UUID;

public class InjuryDto {

    private Long id;
    private UUID athleteId;
    private String fullName;
    private String group;          // grp из Athlete
    private LocalDate birthDate;

    private String type;
    private LocalDate date;        // дата возникновения
    private InjuryStatus status;
    private LocalDate closedDate;  // дата закрытия (если есть)
    private String notes;

    public static InjuryDto fromEntity(Injury injury) {
        InjuryDto dto = new InjuryDto();
        Athlete a = injury.getAthlete();

        dto.id = injury.getId();
        dto.athleteId = a.getId();
        dto.fullName = a.getFullName();
        dto.group = a.getGrp();
        dto.birthDate = a.getBirthDate();
        dto.type = injury.getType();
        dto.date = injury.getDate();
        dto.status = injury.getStatus();
        dto.closedDate = injury.getClosedDate();
        dto.notes = injury.getNotes();

        return dto;
    }

    // --- getters / setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getGroup() {
        return group;
    }

    public void setGroup(String group) {
        this.group = group;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public InjuryStatus getStatus() {
        return status;
    }

    public void setStatus(InjuryStatus status) {
        this.status = status;
    }

    public LocalDate getClosedDate() {
        return closedDate;
    }

    public void setClosedDate(LocalDate closedDate) {
        this.closedDate = closedDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
