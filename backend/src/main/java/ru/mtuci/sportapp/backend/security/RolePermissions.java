package ru.mtuci.sportapp.backend.security;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public final class RolePermissions {

        // Центральная матрица RBAC: какие permissions есть у каждой роли
    private static final Map<UserRole, Set<Permission>> MAP = Map.of(
            UserRole.TRAINER, EnumSet.of(
                    Permission.ATHLETES_READ,
                    Permission.ATHLETES_WRITE,
                    Permission.TRAINER_ATHLETE_LINKS_MANAGE,
                    Permission.TRAINER_PROFILE_MANAGE,
                    Permission.ATTENDANCE_MANAGE,
                    Permission.WEEKLY_PLAN_MANAGE,
                    Permission.INJURIES_MANAGE,
                    Permission.RATION_MANAGE,
                    Permission.REPORTS_READ
            ),
            UserRole.ATHLETE, EnumSet.of(
                    Permission.SELF_PROFILE_MANAGE
            )
    );

    private RolePermissions() {
    }

    public static Set<Permission> permissionsFor(UserRole role) {
                // Для неизвестной роли возвращаем пустой набор прав
        return MAP.getOrDefault(role, EnumSet.noneOf(Permission.class));
    }
}
