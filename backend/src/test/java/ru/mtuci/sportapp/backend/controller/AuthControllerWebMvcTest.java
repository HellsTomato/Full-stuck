package ru.mtuci.sportapp.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ru.mtuci.sportapp.backend.model.LoginRequest;
import ru.mtuci.sportapp.backend.model.LoginResponse;
import ru.mtuci.sportapp.backend.model.RegisterTrainerRequest;
import ru.mtuci.sportapp.backend.security.TokenAuthFilter;
import ru.mtuci.sportapp.backend.security.UserRole;
import ru.mtuci.sportapp.backend.service.AuthService;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerWebMvcTest {

    // MockMvc для HTTP-запросов к контроллеру без подъема полного сервера.
    @Autowired
    private MockMvc mockMvc;

    // ObjectMapper сериализует request DTO в JSON для POST-запросов.
    @Autowired
    private ObjectMapper objectMapper;

    // Сервис мокается, чтобы тестировать только контракт контроллера.
    @MockBean
    private AuthService authService;

    // Фильтр токена мокается, чтобы контекст WebMvc поднимался без security-зависимостей.
    @MockBean
    private TokenAuthFilter tokenAuthFilter;

    @Test
    void registerTrainerReturns201AndBody() throws Exception {
        // Arrange: сервис возвращает готовый ответ успешной регистрации.
        UUID userId = UUID.randomUUID();
        LoginResponse response = new LoginResponse("token", "token", "refresh", "coach", UserRole.TRAINER, userId);
        when(authService.registerTrainer(any())).thenReturn(response);

        RegisterTrainerRequest request = new RegisterTrainerRequest();
        request.setUsername("coach");
        request.setPassword("secret12");
        request.setFullName("Coach One");

        // Act + Assert: контроллер отдает 201 и ожидаемые JSON поля.
        mockMvc.perform(post("/api/register/trainer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("coach"))
                .andExpect(jsonPath("$.role").value("TRAINER"))
                .andExpect(jsonPath("$.refreshToken").value("refresh"));
    }

    @Test
    void loginTrainerReturns400OnValidationError() throws Exception {
        // Arrange: некорректный payload (пустой пароль).
        LoginRequest request = new LoginRequest();
        request.setUsername("u");
        request.setPassword("");

        // Пустой пароль нарушает @NotBlank в LoginRequest.
        mockMvc.perform(post("/api/login/trainer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void meReturns401WithoutAuthentication() throws Exception {
        // Assert: /auth/me без аутентификации должен вернуть 401.
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutReturns204ForAnonymousRequest() throws Exception {
        // Logout endpoint должен корректно отвечать даже без активной сессии.
        // Это важно для идемпотентного клиентского logout flow.
        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNoContent());
    }
}
