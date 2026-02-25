package ru.mtuci.sportapp.backend.entity;            // package — пакет с сущностями JPA

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Data;
import ru.mtuci.sportapp.backend.security.UserRole;
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.TRAINER;

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
