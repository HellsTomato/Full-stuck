package ru.mtuci.sportapp.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.mtuci.sportapp.backend.entity.TrainerAthleteLink;
import ru.mtuci.sportapp.backend.entity.TrainerAthleteLinkId;

import java.util.List;
import java.util.UUID;

public interface TrainerAthleteLinkRepo extends JpaRepository<TrainerAthleteLink, TrainerAthleteLinkId> {
    List<TrainerAthleteLink> findByTrainerId(UUID trainerId);

    boolean existsByTrainerIdAndAthleteId(UUID trainerId, UUID athleteId);

    @Modifying
    @Query("delete from TrainerAthleteLink l where l.trainerId = :trainerId and l.athleteId = :athleteId")
    int deleteLink(@Param("trainerId") UUID trainerId, @Param("athleteId") UUID athleteId);
}
