package ru.mtuci.sportapp.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.mtuci.sportapp.backend.entity.Injury;
import ru.mtuci.sportapp.backend.entity.InjuryStatus;

import java.util.List;
import java.util.Optional;

public interface InjuryRepository extends JpaRepository<Injury, Long> {

    // ====== получить ВСЕ травмы с подтянутым спортсменом ======
    @Query("select i from Injury i join fetch i.athlete")
    List<Injury> findAllWithAthlete();

    // ====== получить конкретную травму с подтянутым спортсменом ======
    @Query("select i from Injury i join fetch i.athlete where i.id = :id")
    Optional<Injury> findByIdWithAthlete(@Param("id") Long id);

    // ====== фильтр по статусу (ACTIVE / CLOSED) ======
    @Query("""
           select i 
           from Injury i 
           join fetch i.athlete 
           where i.status = :status
           """)
    List<Injury> findByStatusWithAthlete(@Param("status") InjuryStatus status);

    // ====== травмы конкретного спортсмена ======
    @Query("""
           select i 
           from Injury i 
           join fetch i.athlete 
           where i.athlete.id = :athleteId
           """)
    List<Injury> findByAthleteWithAthlete(@Param("athleteId") Long athleteId);

    // ====== травмы конкретного спортсмена + статус ======
    @Query("""
           select i 
           from Injury i 
           join fetch i.athlete 
           where i.athlete.id = :athleteId 
             and i.status = :status
           """)
    List<Injury> findByAthleteAndStatusWithAthlete(
            @Param("athleteId") Long athleteId,
            @Param("status") InjuryStatus status
    );
}
