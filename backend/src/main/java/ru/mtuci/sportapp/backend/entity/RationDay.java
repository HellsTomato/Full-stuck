package ru.mtuci.sportapp.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
        name = "ration_day",
        uniqueConstraints = @UniqueConstraint(columnNames = {"athlete_id", "date"})
)
public class RationDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // автоинкремент PK
    private Long id; // идентификатор записи дня

    @ManyToOne(fetch = FetchType.LAZY) // связь с спортсменом
    @JoinColumn(name = "athlete_id", nullable = false)
    private Athlete athlete; // сюда подставляется твоя сущность Athlete

    @Column(nullable = false)
    private LocalDate date; // дата, к которой относится вес/статус/комментарий

    @Enumerated(EnumType.STRING)
    @Column(name = "food_status")
    private FoodStatus foodStatus; // статус питания на день (FED/HUNGRY/... )

    @Column(name = "morning_weight")
    private Double morningWeight; // утренний вес

    @Column(length = 2000)
    private String comment; // общие примечания по дню (самочувствие, аппетит и т.п.)

    // ----- getters/setters -----

    public Long getId() {
        return id;
    }

    public Athlete getAthlete() {
        return athlete;
    }

    public void setAthlete(Athlete athlete) {
        this.athlete = athlete;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public FoodStatus getFoodStatus() {
        return foodStatus;
    }

    public void setFoodStatus(FoodStatus foodStatus) {
        this.foodStatus = foodStatus;
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
}
