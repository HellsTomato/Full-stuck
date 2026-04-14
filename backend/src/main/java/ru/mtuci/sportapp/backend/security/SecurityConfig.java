package ru.mtuci.sportapp.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, TokenAuthFilter tokenAuthFilter) throws Exception {
    // Базовый security-пайплайн для RBAC: stateless + фильтр токена + правила доступа
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {
                })
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
            // 401 — пользователь не аутентифицирован
                        .authenticationEntryPoint((request, response, authException) -> response.sendError(401))
            // 403 — пользователь аутентифицирован, но не хватает прав
                        .accessDeniedHandler((request, response, accessDeniedException) -> response.sendError(403))
                )
                .authorizeHttpRequests(auth -> auth
            // Публичные эндпоинты для входа/регистрации
                        .requestMatchers(HttpMethod.POST, "/api/login/**", "/api/register/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/refresh", "/api/auth/logout").permitAll()
                        // ЛР4: специально разрешаем публичный доступ к /sitemap.xml и /robots.txt,
                        // а также к адаптеру внешнего API `/api/external/weather`.
                        // Обоснование для защиты: sitemap/robots должны быть доступны поисковым ботам,
                        // внешний адаптер публичен, потому что возвращает только общую (публичную)
                        // информацию погоды и не раскрывает секреты (ключ хранится на сервере).
                        .requestMatchers(HttpMethod.GET, "/sitemap.xml", "/robots.txt").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/external/weather").permitAll()
                        // Фото грузятся через <img src>, браузер не добавляет Bearer-токен к таким запросам.
                        .requestMatchers(HttpMethod.GET, "/api/trainers/profile/photo/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/athletes/photo/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/athletes/me").hasAuthority(Permission.SELF_PROFILE_MANAGE.name())
                        .requestMatchers(HttpMethod.POST, "/api/athletes/me/photo").hasRole("ATHLETE")
                        // ЛР3: удаление собственного фото доступно только роли ATHLETE.
                        .requestMatchers(HttpMethod.DELETE, "/api/athletes/me/photo").hasRole("ATHLETE")
                        .requestMatchers(HttpMethod.PATCH, "/api/athletes/me").hasAuthority(Permission.SELF_PROFILE_MANAGE.name())
                        .requestMatchers(HttpMethod.GET, "/api/athletes/**").hasAuthority(Permission.ATHLETES_READ.name())
                        .requestMatchers(HttpMethod.POST, "/api/athletes/**").hasRole("ATHLETE")
                        .requestMatchers(HttpMethod.PATCH, "/api/athletes/**").hasAuthority(Permission.ATHLETES_WRITE.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/athletes/**").hasAuthority(Permission.ATHLETES_WRITE.name())
                        .requestMatchers("/api/trainers/me/athletes/**").hasAuthority(Permission.TRAINER_ATHLETE_LINKS_MANAGE.name())
                        .requestMatchers(HttpMethod.GET, "/api/trainers/profile/**").hasAuthority(Permission.TRAINER_PROFILE_MANAGE.name())
                        .requestMatchers(HttpMethod.PUT, "/api/trainers/profile/**").hasAuthority(Permission.TRAINER_PROFILE_MANAGE.name())
                        .requestMatchers(HttpMethod.POST, "/api/trainers/profile/**").hasAuthority(Permission.TRAINER_PROFILE_MANAGE.name())
                        // ЛР3: удаление фото тренера защищено тем же permission, что и управление профилем.
                        .requestMatchers(HttpMethod.DELETE, "/api/trainers/profile/photo").hasAuthority(Permission.TRAINER_PROFILE_MANAGE.name())
                        .requestMatchers(HttpMethod.POST, "/api/attendance/bulk").hasAuthority(Permission.ATTENDANCE_MANAGE.name())
                        .requestMatchers(HttpMethod.POST, "/api/weekly-plan/**").hasAuthority(Permission.WEEKLY_PLAN_MANAGE.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/weekly-plan/**").hasAuthority(Permission.WEEKLY_PLAN_MANAGE.name())
                        .requestMatchers(HttpMethod.POST, "/api/injuries/**").hasAuthority(Permission.INJURIES_MANAGE.name())
                        .requestMatchers(HttpMethod.PATCH, "/api/injuries/**").hasAuthority(Permission.INJURIES_MANAGE.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/injuries/**").hasAuthority(Permission.INJURIES_MANAGE.name())
                        .requestMatchers(HttpMethod.POST, "/api/ration/**").hasAuthority(Permission.RATION_MANAGE.name())
                        .requestMatchers(HttpMethod.PATCH, "/api/ration/**").hasAuthority(Permission.RATION_MANAGE.name())
                        .requestMatchers(HttpMethod.DELETE, "/api/ration/**").hasAuthority(Permission.RATION_MANAGE.name())
                        .requestMatchers(HttpMethod.GET, "/api/reports/**").hasAuthority(Permission.REPORTS_READ.name())
                        // Любой API требует аутентификацию
                        .requestMatchers("/api/**").authenticated()
                        // Принцип deny-by-default для всего, что не описано выше
                        .anyRequest().denyAll()
                )
                .addFilterBefore(tokenAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Пароли храним только в виде хэша
        return new BCryptPasswordEncoder();
    }
}
