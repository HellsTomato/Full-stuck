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

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class TokenAuthFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;

    public TokenAuthFilter(JwtTokenService jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // Ищем Bearer-токен в заголовке Authorization
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        // Не перезаписываем аутентификацию, если она уже установлена выше по цепочке.
        if (SecurityContextHolder.getContext().getAuthentication() == null
                && header != null
                && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            // Преобразуем валидный JWT в AuthPrincipal и поднимаем SecurityContext.
            jwtTokenService.parseAccessToken(token).ifPresent(this::authenticate);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticate(AuthPrincipal principal) {
        // Principal нужен контроллерам для доступа к userId/role текущего пользователя.
        List<GrantedAuthority> authorities = new ArrayList<>();
        // ROLE_* authorities используются в hasRole(...).
        authorities.add(new SimpleGrantedAuthority("ROLE_" + principal.role().name()));
        // Permission authorities используются в hasAuthority(...).
        for (Permission permission : RolePermissions.permissionsFor(principal.role())) {
            authorities.add(new SimpleGrantedAuthority(permission.name()));
        }
        var auth = new UsernamePasswordAuthenticationToken(principal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
