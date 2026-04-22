package ru.mtuci.sportapp.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import ru.mtuci.sportapp.backend.security.TokenAuthFilter;
import ru.mtuci.sportapp.backend.service.ExternalWeatherService;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ExternalWeatherController.class)
@AutoConfigureMockMvc(addFilters = false)
class ExternalWeatherControllerWebMvcTest {

    // MockMvc гоняет HTTP-контракт контроллера без реального web-сервера.
    @Autowired
    private MockMvc mockMvc;

    // Мокаем внешний сервис, чтобы управлять его ответами в каждом кейсе.
    @MockBean
    private ExternalWeatherService weatherService;

    // Мок security-фильтра для стабильной загрузки WebMvc контекста.
    @MockBean
    private TokenAuthFilter tokenAuthFilter;

    @Test
    void weatherReturns200WhenServiceProvidesData() throws Exception {
        // Arrange: сервис вернул погодные данные.
        var dto = new ExternalWeatherService.WeatherDto("Moscow", 18.3, "clear sky", true);
        when(weatherService.getCurrentWeather(55.75, 37.61)).thenReturn(Optional.of(dto));

        // Act + Assert: endpoint отвечает 200 и правильной структурой JSON.
        mockMvc.perform(get("/api/external/weather")
                        .param("lat", "55.75")
                        .param("lon", "37.61"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.location").value("Moscow"))
                .andExpect(jsonPath("$.description").value("clear sky"))
                .andExpect(jsonPath("$.demo").value(true));
    }

    @Test
    void weatherReturns503WhenServiceUnavailable() throws Exception {
        // Arrange: внешний сервис недоступен (Optional.empty()).
        when(weatherService.getCurrentWeather(55.75, 37.61)).thenReturn(Optional.empty());

        // Act + Assert: контроллер возвращает 503 и нормализованную ошибку.
        mockMvc.perform(get("/api/external/weather")
                        .param("lat", "55.75")
                        .param("lon", "37.61"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("external weather service unavailable"));
    }

    @Test
    void weatherReturns400WhenLonIsMissing() throws Exception {
        // Контроллер требует обязательные query params lat/lon.
        // Здесь валидируем граничный случай неполного запроса.
        mockMvc.perform(get("/api/external/weather").param("lat", "55.75"))
                .andExpect(status().isBadRequest());
    }
}
