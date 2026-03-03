package ru.mtuci.sportapp.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import ru.mtuci.sportapp.backend.entity.UserSession;
import ru.mtuci.sportapp.backend.repo.UserSessionRepo;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class TokenAuthFilter extends OncePerRequestFilter {

    // Репозиторий с активными сессиями: по токену получаем userId и роль
    private final UserSessionRepo userSessionRepo;

    public TokenAuthFilter(UserSessionRepo userSessionRepo) {
        this.userSessionRepo = userSessionRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // Ищем Bearer-токен в заголовке Authorization
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            // Если токен найден в БД сессий — поднимаем Authentication в SecurityContext
            userSessionRepo.findById(token).ifPresent(this::authenticate);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticate(UserSession session) {
        // Principal нужен контроллерам для доступа к userId/role текущего пользователя
        AuthPrincipal principal = new AuthPrincipal(session.getUserId(), session.getUsername(), session.getRole());
        List<GrantedAuthority> authorities = new ArrayList<>();
        // ROLE_* используется в hasRole(...)
        authorities.add(new SimpleGrantedAuthority("ROLE_" + session.getRole().name()));
        // Permission authorities используются в hasAuthority(...)
        for (Permission permission : RolePermissions.permissionsFor(session.getRole())) {
            authorities.add(new SimpleGrantedAuthority(permission.name()));
        }
        var auth = new UsernamePasswordAuthenticationToken(principal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
