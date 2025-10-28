package ru.mtuci.sportapp.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.mtuci.sportapp.backend.entity.Athlete;

import java.util.List;
import java.util.UUID;

public interface AthleteRepo extends JpaRepository<Athlete, UUID> {

    @Query(value = """
            select a.*
            from athletes a
            where (:grp is null or a.grp = :grp)
              and (:status is null or a.status = :status)
              and (:search is null or lower(a.full_name) like :search)
            """,
            nativeQuery = true)
    List<Athlete> search(@Param("grp") String grp,
                         @Param("status") String status,
                         @Param("search") String search);
}
