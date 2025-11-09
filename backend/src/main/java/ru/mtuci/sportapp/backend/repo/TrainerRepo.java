package ru.mtuci.sportapp.backend.repo;                   // пакет с репозиториями

import org.springframework.data.jpa.repository.JpaRepository;  // JpaRepository — базовые CRUD-методы
import ru.mtuci.sportapp.backend.entity.Trainer;          // Trainer — наша сущность

import java.util.Optional;                                // Optional — “может быть/может не быть”
import java.util.UUID;                                    // UUID — тип id

public interface TrainerRepo extends JpaRepository<Trainer, UUID> {
    Optional<Trainer> findByUsername(String username);    // findByUsername — поиск тренера по логину
}
