package ru.mtuci.sportapp.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.mtuci.sportapp.backend.entity.UserSession;

public interface UserSessionRepo extends JpaRepository<UserSession, String> {
}
