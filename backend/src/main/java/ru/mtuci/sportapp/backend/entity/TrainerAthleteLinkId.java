package ru.mtuci.sportapp.backend.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class TrainerAthleteLinkId implements Serializable {
    private UUID trainerId;
    private UUID athleteId;

    public TrainerAthleteLinkId() {
    }

    public TrainerAthleteLinkId(UUID trainerId, UUID athleteId) {
        this.trainerId = trainerId;
        this.athleteId = athleteId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TrainerAthleteLinkId that)) return false;
        return Objects.equals(trainerId, that.trainerId) && Objects.equals(athleteId, that.athleteId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(trainerId, athleteId);
    }
}
