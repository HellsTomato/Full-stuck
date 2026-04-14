package ru.mtuci.sportapp.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;

/**
 * Простой адаптер для внешнего погодного API (OpenWeatherMap).
 * Реализует:
 * - чтение ключа из настроек (через env переменную),
 * - таймауты и повторные попытки, 
 * - очень простой rate-limit (min interval между запросами),
 * - нормализацию ответа в локальную DTO.
 *
 * Это минимальная, безопасная реализация для ЛР — без добавления внешних зависимостей.
 *
 * - Ключ читается из `external.weather.api.key` (env OPENWEATHERMAP_API_KEY).
 * - При отсутствии ключа метод возвращает `Optional.empty()` (graceful degradation).
 * - Для теста можно вызвать `/api/external/weather?lat=55.7558&lon=37.6173`.
 */
@Service
public class ExternalWeatherService {

    @Value("${external.weather.base-url:https://api.openweathermap.org/data/2.5}")
    private String baseUrl;

    @Value("${external.weather.api.key:}")
    private String apiKey;

    @Value("${external.weather.request-timeout-ms:5000}")
    private int requestTimeoutMs;

    @Value("${external.weather.max-retries:2}")
    private int maxRetries;

    @Value("${external.weather.min-interval-ms:1000}")
    private long minIntervalMs;

    private final ObjectMapper mapper = new ObjectMapper();

    // Примитивный rate-limiter
    private volatile long lastRequestTs = 0;

    public Optional<WeatherDto> getCurrentWeather(double lat, double lon) {
        // Если ключ не настроен — возвращаем демонстрационные данные (graceful degradation).
        // Это удобно для локальной демонстрации/защиты: фронтенд получает корректный
        // формат ответа и может показать пример, не требуя настоящего ключа.
        if (apiKey == null || apiKey.isBlank()) {
            WeatherDto demo = new WeatherDto("Demo City", 20.0, "clear sky (demo)", true);
            return Optional.of(demo);
        }

        // Простая синхронизация, чтобы поддерживать minIntervalMs между запросами
        synchronized (this) {
            long now = Instant.now().toEpochMilli();
            long wait = minIntervalMs - (now - lastRequestTs);
            if (wait > 0) {
                try { Thread.sleep(wait); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
            }
            lastRequestTs = Instant.now().toEpochMilli();
        }

        String target = String.format("%s/weather?lat=%s&lon=%s&units=metric&appid=%s", baseUrl, lat, lon, apiKey);

        int attempt = 0;
        while (true) {
            try {
                URL url = new URL(target);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(requestTimeoutMs);
                conn.setReadTimeout(requestTimeoutMs);
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Accept", "application/json;charset=UTF-8");

                int code = conn.getResponseCode();
                InputStream is = (code >= 200 && code < 300) ? conn.getInputStream() : conn.getErrorStream();
                if (is == null) {
                    throw new RuntimeException("No response stream from weather API");
                }

                JsonNode root = mapper.readTree(is);
                if (code < 200 || code >= 300) {
                    // Нормализуем ошибку как отсутствие данных
                    return Optional.empty();
                }

                // Парсим минимальный набор полей
                double temp = root.path("main").path("temp").asDouble(Double.NaN);
                String description = "";
                if (root.has("weather") && root.get("weather").isArray() && root.get("weather").size() > 0) {
                    description = root.get("weather").get(0).path("description").asText("");
                }
                String name = root.path("name").asText("");

                WeatherDto dto = new WeatherDto(name, temp, description, false);
                return Optional.of(dto);
            } catch (Exception e) {
                attempt++;
                if (attempt > maxRetries) {
                    return Optional.empty();
                }
                // Backoff (linear)
                try { Thread.sleep(500L * attempt); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
            }
        }
    }

    public static class WeatherDto {
        public final String locationName;
        public final double temperatureCelsius;
        public final String description;
        public final boolean demo;

        public WeatherDto(String locationName, double temperatureCelsius, String description) {
            this(locationName, temperatureCelsius, description, false);
        }

        public WeatherDto(String locationName, double temperatureCelsius, String description, boolean demo) {
            this.locationName = locationName;
            this.temperatureCelsius = temperatureCelsius;
            this.description = description;
            this.demo = demo;
        }
    }
}
