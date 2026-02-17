package ru.mtuci.sportapp.backend.model;

import java.time.LocalDate;

/**
 * DTO для обновления информации по дню рациона:
 * вес, комментарий, статус еды.
 */
public class RationDayUpdateRequest {

    private LocalDate date;        // дата дня, к которому всё относится
    private Double morningWeight;  // утренний вес
    private String comment;        // примечания
    private String foodStatus;     // статус еды (строкой: FULL / PARTIAL / NONE)

    public RationDayUpdateRequest() {
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Double getMorningWeight() {
        return morningWeight;
    }

    public void setMorningWeight(Double morningWeight) {
        this.morningWeight = morningWeight;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getFoodStatus() {
        return foodStatus;
    }

    public void setFoodStatus(String foodStatus) {
        this.foodStatus = foodStatus;
    }
}
