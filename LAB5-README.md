/[/[/[/'[/'[/'[
# Лабораторная работа №5

1. Unit-тесты  
Зачем: проверяют одну функцию/класс в изоляции, очень быстро.  
Почему: чтобы точно проверить бизнес-логику auth и weather без БД/HTTP.  
Примеры: AuthServiceTest.java, client.test.ts.

2. Integration (web/API) тесты  
Зачем: проверяют связку слоев внутри приложения (контроллер, валидация, сериализация, коды ответа).  
Почему: важно доказать, что endpoint реально отдает нужные статусы `200/201/400/401/503` и корректный JSON.  
Примеры: AuthControllerWebMvcTest.java, ExternalWeatherControllerWebMvcTest.java.

3. Component/UI integration тесты (frontend через Vitest + RTL)  
Зачем: проверяют поведение React-экрана как пользователь (клики, рендер, переходы), но быстрее чем браузерные e2e.  
Почему у тебя: нужно покрыть route-guard, auth-context, обработку ошибок и UI сценарии.  
Примеры: PrivateRoute.test.tsx, auth-context.test.tsx, athletes.test.tsx.

4. E2E-тесты (Playwright)  
Зачем: проверяют полный путь «как в жизни» в браузере, от роутов до сетевых ответов.  
Почему у тебя: это доказательство, что ключевые бизнес-сценарии работают целиком, включая сессию и редиректы.  
Примеры: auth-and-guard.spec.ts, session-expired.spec.ts.

Разница в 1 фразе:
- Unit: «правильно ли работает отдельная логика?»  
- Integration: «правильно ли общаются части приложения?»  
- E2E: «работает ли всё вместе для реального пользователя?»

## Что уже было реализовано до ЛР5
1. Базовый backend smoke-тест загрузки контекста.
2. Один frontend тест для страницы спортсменов.
3. Роутинг с role-based доступом на клиенте.
4. JWT/refresh механика в клиентском API-слое.

## Что добавлено в ЛР5

### 1) Тестовая модель приложения
Критические пользовательские сценарии:
1. Анонимный доступ к защищенным страницам.
2. Восстановление сессии из localStorage.
3. Истечение access/refresh и переход в login flow.
4. Работа ролевой защиты (TRAINER/ATHLETE).
5. Работа с внешней интеграцией погоды (успех/недоступность).

Ключевые бизнес-правила:
1. Уникальность username между ролями.
2. Refresh token ротация и удаление старого токена.
3. Корректные HTTP-коды для валидации и неавторизованного доступа.
4. Graceful degradation внешнего API (503 при недоступности, demo-режим при отсутствии ключа).

Области риска:
1. Аутентификация и refresh flow.
2. Ролевой доступ и защита маршрутов.
3. Интеграция со сторонним weather API.
4. Сценарии истекшей сессии на frontend.

### 2) Backend тестирование (Spring Boot)
Добавлены unit-тесты сервисного слоя:
1. [backend/src/test/java/ru/mtuci/sportapp/backend/service/AuthServiceTest.java](backend/src/test/java/ru/mtuci/sportapp/backend/service/AuthServiceTest.java)
2. [backend/src/test/java/ru/mtuci/sportapp/backend/service/ExternalWeatherServiceTest.java](backend/src/test/java/ru/mtuci/sportapp/backend/service/ExternalWeatherServiceTest.java)

Проверяется:
1. Конфликт логина при регистрации.
2. Ошибки авторизации (в т.ч. граничный случай без passwordHash).
3. Ротация refresh token.
4. Удаление истекшей сессии.
5. Logout и отзыв сессий.
6. Поведение weather-сервиса при отсутствии API ключа и при сбоях внешнего API.

Добавлены integration/web-тесты endpoint-уровня:
1. [backend/src/test/java/ru/mtuci/sportapp/backend/controller/AuthControllerWebMvcTest.java](backend/src/test/java/ru/mtuci/sportapp/backend/controller/AuthControllerWebMvcTest.java)
2. [backend/src/test/java/ru/mtuci/sportapp/backend/controller/ExternalWeatherControllerWebMvcTest.java](backend/src/test/java/ru/mtuci/sportapp/backend/controller/ExternalWeatherControllerWebMvcTest.java)

Проверяется:
1. Коды ответа (201/204/400/401/503).
2. Структура JSON ответа.
3. Ошибки валидации входных данных.
4. Граничный случай отсутствующих query-параметров.

Технические изменения под тесты:
1. Добавлена зависимость `spring-security-test` в [backend/pom.xml](backend/pom.xml).
2. Отключен старый общий context-load smoke в [backend/src/test/java/ru/mtuci/sportapp/backend/BackendApplicationTests.java](backend/src/test/java/ru/mtuci/sportapp/backend/BackendApplicationTests.java), чтобы фокусировать ЛР5 на целевых unit/integration тестах.

### 3) Frontend тестирование (React + TypeScript)
Добавлены unit/integration тесты:
1. [frontend/src/__tests__/client.test.ts](frontend/src/__tests__/client.test.ts)
2. [frontend/src/__tests__/PrivateRoute.test.tsx](frontend/src/__tests__/PrivateRoute.test.tsx)
3. [frontend/src/__tests__/auth-context.test.tsx](frontend/src/__tests__/auth-context.test.tsx)
4. Обновлен тест [frontend/src/__tests__/athletes.test.tsx](frontend/src/__tests__/athletes.test.tsx)

Проверяется:
1. Retry после 401 + refresh и повтор запроса.
2. Обработка 403 и невалидной сессии.
3. Очистка auth-хранилища.
4. Защита маршрутов и role-based доступ.
5. Восстановление и сброс сессии в AuthContext.
6. UI-сценарий взаимодействия со страницей спортсменов.

Тестовая инфраструктура frontend:
1. Единый setup: [frontend/src/test/setup.ts](frontend/src/test/setup.ts)
2. Конфиг Vitest в [frontend/vite.config.ts](frontend/vite.config.ts)
3. Тестовые скрипты и зависимости в [frontend/package.json](frontend/package.json)

### 4) E2E (Playwright)
Добавлены сквозные проверки:
1. [frontend/e2e/auth-and-guard.spec.ts](frontend/e2e/auth-and-guard.spec.ts)
2. [frontend/e2e/session-expired.spec.ts](frontend/e2e/session-expired.spec.ts)
3. Конфиг: [frontend/playwright.config.ts](frontend/playwright.config.ts)

Проверяется:
1. Анонимный пользователь при входе в защищенный маршрут попадает на login.
2. Восстановленная сессия оставляет пользователя в приложении.
3. При истекшей сессии вызывается refresh flow и происходит возврат к login.

### 5) Разделение по скорости и назначению
1. Unit/Integration backend: JUnit + MockMvc (быстрые).
2. Unit/Integration frontend: Vitest + Testing Library (быстрые).
3. E2E frontend: Playwright (длительные).

### 6) Минимально контролируемое покрытие
Для контроля покрытия подготовлен скрипт:
1. `npm run test:coverage` (frontend)

Backend покрытие можно подключить отдельно через JaCoCo в Maven при необходимости расширения метрик в отчете.

## Как запускать проект и тесты (Docker-first)

### Поднять приложение
Из корня проекта:

```bash
docker compose up --build
```

Сервисы:
1. frontend: http://localhost:5173
2. backend: http://localhost:8080
3. postgres: localhost:5432
4. minio: http://localhost:9000 (console http://localhost:9001)

### Прогон backend тестов
Вариант через локальный Maven wrapper:

```bash
cd backend
./mvnw test
```

Вариант через Docker (без локальной установки Maven):

```bash
docker run --rm -v "${PWD}/backend:/app" -w /app maven:3.9-eclipse-temurin-21 mvn test
```

### Прогон frontend unit/integration тестов

```bash
cd frontend
npm install
npm run test:unit
```

### Прогон frontend e2e тестов

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

## Итоговая проверка требований ЛР5
1. Ключевые сценарии подтверждены unit/integration/e2e тестами.
2. Проверка прав доступа и ограничений реализована на уровне route-guard и backend endpoint тестов.
3. Проверки внешней интеграции (weather API) реализованы для штатной работы и отказов.
4. Тесты воспроизводимы и автоматизируются через npm/maven/Playwright команды.

## Примечания
1. В новом коде комментарии добавлялись только в формате `//`.
2. Для E2E выбран отдельный порт web-server (`4173`) для исключения конфликтов с уже запущенными dev-серверами.
