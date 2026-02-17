package ru.mtuci.sportapp.backend.model;

import java.time.LocalDate;
import java.util.List;

/**
 * Инфа по одному дню недели рациона.
 */
public class RationDayDto {

    private LocalDate date;              // дата
    private String foodStatus;           // статус еды
    private Double weight;              // утренний вес
    private String comment;             // комментарий
    private List<RationItemDto> items;  // список приемов пищи

    public RationDayDto() {
    }

    public RationDayDto(LocalDate date,
                        String foodStatus,
                        Double weight,
                        String comment,
                        List<RationItemDto> items) {
        this.date = date;
        this.foodStatus = foodStatus;
        this.weight = weight;
        this.comment = comment;
        this.items = items;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getFoodStatus() {
        return foodStatus;
    }

    public void setFoodStatus(String foodStatus) {
        this.foodStatus = foodStatus;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public List<RationItemDto> getItems() {
        return items;
    }

    public void setItems(List<RationItemDto> items) {
        this.items = items;
    }
}
