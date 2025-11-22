package ru.mtuci.sportapp.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.mtuci.sportapp.backend.entity.Athlete;

import java.util.List;
import java.util.UUID;

public interface AthleteRepo extends JpaRepository<Athlete, UUID> {

    @Query(value = """
            SELECT *
            FROM athletes
            WHERE (:grp IS NULL OR grp = :grp)
              AND (:search IS NULL OR LOWER(full_name) LIKE :search)
            ORDER BY full_name ASC
            """,
            nativeQuery = true)
    List<Athlete> search(
            @Param("grp") String group,
            @Param("search") String search
    );
}
