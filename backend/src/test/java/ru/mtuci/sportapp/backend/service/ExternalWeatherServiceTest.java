package ru.mtuci.sportapp.backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExternalWeatherServiceTest {

    @Test
    void returnsDemoWeatherWhenApiKeyIsMissing() {
        // Arrange: сервис без API ключа.
        ExternalWeatherService service = new ExternalWeatherService();
        ReflectionTestUtils.setField(service, "apiKey", "");

        // Act: запрашиваем погоду.
        var result = service.getCurrentWeather(55.7558, 37.6173);

        // Assert: сервис возвращает demo-ответ вместо падения.
        assertTrue(result.isPresent());
        assertTrue(result.get().demo);
        assertEquals("Demo City", result.get().locationName);
    }

    @Test
    void returnsEmptyWhenExternalApiIsUnavailable() {
        // Arrange: некорректный URL и минимальные retries/timeout.
        ExternalWeatherService service = new ExternalWeatherService();
        ReflectionTestUtils.setField(service, "apiKey", "test-key");
        ReflectionTestUtils.setField(service, "baseUrl", "bad://url");
        ReflectionTestUtils.setField(service, "maxRetries", 0);
        ReflectionTestUtils.setField(service, "requestTimeoutMs", 5);
        ReflectionTestUtils.setField(service, "minIntervalMs", 0L);

        // Act: вызов внешнего API завершается ошибкой коннекта.
        var result = service.getCurrentWeather(55.7558, 37.6173);

        // Assert: graceful degradation в Optional.empty().
        assertTrue(result.isEmpty());
    }
}
