package ru.mtuci.sportapp.backend.repo;

import ru.mtuci.sportapp.backend.entity.Athlete;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface AthleteRepo extends JpaRepository<Athlete, UUID> {

    @Query("""
    select a from Athlete a
     where (:grp is null or a.group = :grp)
       and (:status is null or a.status = :status)
       and (:search is null or lower(a.fullName) like lower(concat('%', :search, '%')))
  """)
    List<Athlete> search(@Param("grp") String group,
                         @Param("status") String status,
                         @Param("search") String search);
}
