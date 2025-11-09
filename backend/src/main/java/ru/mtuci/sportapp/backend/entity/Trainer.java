package ru.mtuci.sportapp.backend.entity;            // package — пакет с сущностями JPA

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "trainers")
@Data
public class Trainer {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String fullName;

    // ===== новые поля профиля =====

    @Column
    private String email;              // email — почта тренера

    @Column
    private String phone;              // phone — телефон

    @Column
    private String education;          // education — образование / курсы

    @Column(length = 2000)
    private String achievements;       // achievements — достижения, награды

    @Column
    private String photoUrl;           // photoUrl — ссылка на фото (или путь к файлу)
}
