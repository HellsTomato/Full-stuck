package ru.mtuci.sportapp.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.mtuci.sportapp.backend.entity.TrainingGroup;
import ru.mtuci.sportapp.backend.entity.TrainingSession;

import java.time.LocalDate;
import java.util.List;

public interface TrainingSessionRepository extends JpaRepository<TrainingSession, Long> {

    List<TrainingSession> findByDateBetween(LocalDate start, LocalDate end);

    List<TrainingSession> findByDateBetweenAndGroupType(LocalDate start, LocalDate end, TrainingGroup groupType);
}
