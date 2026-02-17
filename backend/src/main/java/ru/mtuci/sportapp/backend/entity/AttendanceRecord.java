package ru.mtuci.sportapp.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "attendance_records",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_attendance_date_group_athlete",
                        columnNames = {"date", "group_type", "athlete_id"}
                )
        }
)
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // PK записи посещаемости

    @Column(nullable = false)
    private LocalDate date; // дата тренировки

    @Enumerated(EnumType.STRING)
    @Column(name = "group_type", nullable = false)
    private TrainingGroup groupType; // JUNIORS / SENIORS

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "athlete_id", nullable = false)
    private Athlete athlete; // спортсмен (UUID внутри)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status; // статус посещаемости

    // ----- getters / setters -----

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public TrainingGroup getGroupType() {
        return groupType;
    }

    public void setGroupType(TrainingGroup groupType) {
        this.groupType = groupType;
    }

    public Athlete getAthlete() {
        return athlete;
    }

    public void setAthlete(Athlete athlete) {
        this.athlete = athlete;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }
}
