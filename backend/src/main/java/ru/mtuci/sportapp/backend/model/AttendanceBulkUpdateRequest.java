package ru.mtuci.sportapp.backend.model;

import ru.mtuci.sportapp.backend.entity.AttendanceStatus;
import ru.mtuci.sportapp.backend.entity.TrainingGroup;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

// Запрос от фронта на массовое обновление статусов посещаемости
public class AttendanceBulkUpdateRequest {

    private LocalDate date;              // дата тренировки
    private TrainingGroup group;         // группа (может быть null = все группы)
    private List<Item> items;            // список спортсменов со статусами

    // Один элемент обновления
    public static class Item {
        private UUID athleteId;          // ID спортсмена (UUID)
        private AttendanceStatus status; // новый статус

        public Item() {
        }

        public Item(UUID athleteId, AttendanceStatus status) {
            this.athleteId = athleteId;
            this.status = status;
        }

        public UUID getAthleteId() {
            return athleteId;
        }

        public void setAthleteId(UUID athleteId) {
            this.athleteId = athleteId;
        }

        public AttendanceStatus getStatus() {
            return status;
        }

        public void setStatus(AttendanceStatus status) {
            this.status = status;
        }
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public TrainingGroup getGroup() {
        return group;
    }

    public void setGroup(TrainingGroup group) {
        this.group = group;
    }

    public List<Item> getItems() {
        return items;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }
}
