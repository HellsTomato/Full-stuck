package ru.mtuci.sportapp.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.mtuci.sportapp.backend.entity.RationDay;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Репозиторий для сущности RationDay.
 */
public interface RationDayRepository extends JpaRepository<RationDay, Long> {

    Optional<RationDay> findByAthlete_IdAndDate(UUID athleteId, LocalDate date);

    List<RationDay> findByAthlete_IdAndDateBetween(UUID athleteId,
                                                   LocalDate start,
                                                   LocalDate end);
}
