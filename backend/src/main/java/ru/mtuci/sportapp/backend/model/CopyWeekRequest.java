package ru.mtuci.sportapp.backend.model;

import ru.mtuci.sportapp.backend.entity.TrainingGroup;

// Запрос на копирование недели
public class CopyWeekRequest {

    private String fromWeekStart;      // от какой недели копировать (YYYY-MM-DD)
    private String toWeekStart;        // на какую неделю
    private TrainingGroup group;       // какую группу копировать (или null = все)

    public String getFromWeekStart() {
        return fromWeekStart;
    }

    public void setFromWeekStart(String fromWeekStart) {
        this.fromWeekStart = fromWeekStart;
    }

    public String getToWeekStart() {
        return toWeekStart;
    }

    public void setToWeekStart(String toWeekStart) {
        this.toWeekStart = toWeekStart;
    }

    public TrainingGroup getGroup() {
        return group;
    }

    public void setGroup(TrainingGroup group) {
        this.group = group;
    }
}
