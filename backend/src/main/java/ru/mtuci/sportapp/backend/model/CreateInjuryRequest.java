// backend/src/main/java/ru/mtuci/sportapp/backend/model/CreateInjuryRequest.java
package ru.mtuci.sportapp.backend.model;

import java.time.LocalDate;
import java.util.UUID;

public class CreateInjuryRequest {

    private UUID athleteId;
    private String type;
    private LocalDate date;
    private String notes;

    public UUID getAthleteId() {
        return athleteId;
    }

    public void setAthleteId(UUID athleteId) {
        this.athleteId = athleteId;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
