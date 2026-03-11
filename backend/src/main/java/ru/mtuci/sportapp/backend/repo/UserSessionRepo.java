package ru.mtuci.sportapp.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.mtuci.sportapp.backend.entity.UserSession;

import java.util.UUID;

public interface UserSessionRepo extends JpaRepository<UserSession, String> {
    // Массовый отзыв refresh-сессий пользователя (logout/повторный вход).
	void deleteByUserId(UUID userId);
}
