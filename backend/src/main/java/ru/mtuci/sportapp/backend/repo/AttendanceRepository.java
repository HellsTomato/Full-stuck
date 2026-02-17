package ru.mtuci.sportapp.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.mtuci.sportapp.backend.entity.AttendanceRecord;
import ru.mtuci.sportapp.backend.entity.TrainingGroup;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {

    // все записи за дату
    List<AttendanceRecord> findByDate(LocalDate date);

    // записи за дату и группу
    List<AttendanceRecord> findByDateAndGroupType(LocalDate date, TrainingGroup groupType);
}
