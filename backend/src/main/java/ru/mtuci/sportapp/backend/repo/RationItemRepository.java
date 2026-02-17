package ru.mtuci.sportapp.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.mtuci.sportapp.backend.entity.RationItem;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Репозиторий для сущности RationItem.
 */
public interface RationItemRepository extends JpaRepository<RationItem, Long> {

    List<RationItem> findByAthlete_IdAndDateBetween(UUID athleteId,
                                                    LocalDate start,
                                                    LocalDate end);
}
