package ru.mtuci.sportapp.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "trainer_athlete_links")
@IdClass(TrainerAthleteLinkId.class)
public class TrainerAthleteLink {

    @Id
    @Column(name = "trainer_id", nullable = false)
    private UUID trainerId;

    @Id
    @Column(name = "athlete_id", nullable = false)
    private UUID athleteId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getTrainerId() {
        return trainerId;
    }

    public void setTrainerId(UUID trainerId) {
        this.trainerId = trainerId;
    }

    public UUID getAthleteId() {
        return athleteId;
    }

    public void setAthleteId(UUID athleteId) {
        this.athleteId = athleteId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
