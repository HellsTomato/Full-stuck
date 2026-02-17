package ru.mtuci.sportapp.backend.model;

import ru.mtuci.sportapp.backend.entity.AttendanceStatus;
import ru.mtuci.sportapp.backend.entity.TrainingGroup;

import java.time.LocalDate;
import java.util.UUID;

// DTO, которое улетает на фронт в таблицу посещаемости
public class AttendanceDto {

    private Long attendanceId;          // ID записи посещаемости (может быть null)
    private UUID athleteId;             // ID спортсмена (UUID!)
    private String fullName;            // ФИО спортсмена
    private TrainingGroup group;        // группа
    private LocalDate date;             // дата тренировки
    private AttendanceStatus status;    // статус посещения

    public AttendanceDto() {
    }

    public AttendanceDto(
            Long attendanceId,
            UUID athleteId,
            String fullName,
            TrainingGroup group,
            LocalDate date,
            AttendanceStatus status
    ) {
        this.attendanceId = attendanceId;
        this.athleteId = athleteId;
        this.fullName = fullName;
        this.group = group;
        this.date = date;
        this.status = status;
    }

    public Long getAttendanceId() {
        return attendanceId;
    }

    public void setAttendanceId(Long attendanceId) {
        this.attendanceId = attendanceId;
    }

    public UUID getAthleteId() {
        return athleteId;
    }

    public void setAthleteId(UUID athleteId) {
        this.athleteId = athleteId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public TrainingGroup getGroup() {
        return group;
    }

    public void setGroup(TrainingGroup group) {
        this.group = group;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }
}
