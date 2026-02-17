package ru.mtuci.sportapp.backend.model;

import ru.mtuci.sportapp.backend.entity.Athlete;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Недельный рацион одного спортсмена.
 */
public class WeeklyRationDto {

    private AthleteInfoDto athlete; // ФИО, группа, id
    private LocalDate weekStart;    // понедельник
    private LocalDate weekEnd;      // воскресенье
    private List<RationDayDto> days; // семь дней

    public WeeklyRationDto() {
    }

    public WeeklyRationDto(AthleteInfoDto athlete,
                           LocalDate weekStart,
                           LocalDate weekEnd,
                           List<RationDayDto> days) {
        this.athlete = athlete;
        this.weekStart = weekStart;
        this.weekEnd = weekEnd;
        this.days = days;
    }

    public AthleteInfoDto getAthlete() {
        return athlete;
    }

    public void setAthlete(AthleteInfoDto athlete) {
        this.athlete = athlete;
    }

    public LocalDate getWeekStart() {
        return weekStart;
    }

    public void setWeekStart(LocalDate weekStart) {
        this.weekStart = weekStart;
    }

    public LocalDate getWeekEnd() {
        return weekEnd;
    }

    public void setWeekEnd(LocalDate weekEnd) {
        this.weekEnd = weekEnd;
    }

    public List<RationDayDto> getDays() {
        return days;
    }

    public void setDays(List<RationDayDto> days) {
        this.days = days;
    }

    /**
     * Вложенный DTO с инфой по спортсмену.
     */
    public static class AthleteInfoDto {
        private UUID id;
        private String fullName;
        private String groupName;

        public AthleteInfoDto() {
        }

        public AthleteInfoDto(UUID id, String fullName, String groupName) {
            this.id = id;
            this.fullName = fullName;
            this.groupName = groupName;
        }

        public AthleteInfoDto(Athlete athlete) {
            this.id = athlete.getId();
            this.fullName = athlete.getFullName();
            this.groupName = athlete.getGrp();
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getGroupName() {
            return groupName;
        }

        public void setGroupName(String groupName) {
            this.groupName = groupName;
        }
    }
}
