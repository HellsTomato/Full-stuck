// backend/src/main/java/ru/mtuci/sportapp/backend/model/CreateInjuryRequest.java
package ru.mtuci.sportapp.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public class CreateInjuryRequest {

    @NotNull
    private UUID athleteId;

    @NotBlank
    @Size(max = 120)
    private String type;

    private LocalDate date;

    @Size(max = 2000)
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
