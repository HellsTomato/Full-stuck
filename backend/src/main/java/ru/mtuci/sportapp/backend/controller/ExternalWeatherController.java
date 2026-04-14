package ru.mtuci.sportapp.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.mtuci.sportapp.backend.service.ExternalWeatherService;

import java.util.Map;

/**
 * Контроллер для фронтенда — предоставляет нормализованные данные от внешнего погодного API.
 * Возвращает 503, если внешний сервис не настроен или недоступен (graceful degradation).
 *
 * - Этот контроллер является серверной прослойкой (adapter) к внешнему API.
 *   Фронтенд вызывает этот локальный endpoint, а не напрямую OpenWeatherMap.
 * - Такой подход позволяет скрыть ключи, добавлять таймауты/retries и нормализовать формат.
 */
@RestController
@RequestMapping("/api/external")
@RequiredArgsConstructor
public class ExternalWeatherController {

    private final ExternalWeatherService weatherService;

    @GetMapping("/weather")
    public ResponseEntity<?> weather(@RequestParam double lat, @RequestParam double lon) {
        var maybe = weatherService.getCurrentWeather(lat, lon);
        if (maybe.isEmpty()) {
            // Внешний API не настроен или недоступен — возвращаем 503 для graceful degradation.
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", "external weather service unavailable"));
        }
        var dto = maybe.get();
        // Возвращаем флаг demo=true, если данные демо-режима — это помогает
        // фронтенду показать, что данные не реальные.
        return ResponseEntity.ok(Map.of(
            "location", dto.locationName,
            "tempC", dto.temperatureCelsius,
            "description", dto.description,
            "demo", dto.demo
        ));
    }
}
