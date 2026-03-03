package ru.mtuci.sportapp.backend.security;

// Гранулярные права, которые проверяются через hasAuthority(...)
public enum Permission {
    ATHLETES_READ,
    ATHLETES_WRITE,
    TRAINER_ATHLETE_LINKS_MANAGE,
    TRAINER_PROFILE_MANAGE,
    ATTENDANCE_MANAGE,
    WEEKLY_PLAN_MANAGE,
    INJURIES_MANAGE,
    RATION_MANAGE,
    REPORTS_READ,
    SELF_PROFILE_MANAGE
}
