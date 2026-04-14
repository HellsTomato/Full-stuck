# Лабораторная работа 4 — SEO и внешний API (демо)

В рамках ЛР4 добавлены изменения по двум направлениям:

1. SEO-улучшения (frontend + backend)
2. Интеграция внешнего погодного API через серверный адаптер

## Цель работы

- Добавить публичные SEO-эндпоинты: `/sitemap.xml` и `/robots.txt`.
- Сделать публичный экран до авторизации (лендинг), чтобы незарегистрированный пользователь мог ознакомиться с сервисом.
- Настроить нормальные мета-теги (title, description, OG, Twitter, canonical) и фавикон.
- Добавить серверный адаптер к внешнему API погоды с fallback-режимом для демо.

## Что было реализовано

### Backend

- `backend/src/main/java/ru/mtuci/sportapp/backend/controller/SeoController.java`
	- Добавлены `/sitemap.xml` и `/robots.txt`.
- `backend/src/main/java/ru/mtuci/sportapp/backend/controller/ExternalWeatherController.java`
	- Публичный endpoint `/api/external/weather`.
- `backend/src/main/java/ru/mtuci/sportapp/backend/service/ExternalWeatherService.java`
	- Адаптер к OpenWeatherMap, таймауты/retry, demo-fallback.
- `backend/src/main/java/ru/mtuci/sportapp/backend/security/SecurityConfig.java`
	- Разрешён публичный доступ к `/sitemap.xml`, `/robots.txt`, `/api/external/weather`.
- `backend/src/main/resources/application.properties`
	- Настройки `external.weather.*` и подключение ключа через env.
- `docker-compose.yml`
	- Проброс `OPENWEATHERMAP_API_KEY`.

### Frontend (новые SEO-изменения)

- `frontend/src/routes/LandingPage.tsx`
	- Добавлен публичный экран на `/` до входа/регистрации.
- `frontend/src/main.tsx`
	- Обновлён роутинг: `/` стал публичным, рабочие разделы остались под `PrivateRoute`.
- `frontend/index.html`
	- Базовые SEO-теги: `description`, `keywords`, `robots`, `canonical`.
	- Социальные теги: `og:*`, `twitter:*`.
	- Подключён фавикон `favicon.svg`.
- `frontend/src/utils/seo.ts`
	- Универсальный хук `usePageSeo` для динамической установки мета-тегов.
- `frontend/src/routes/LoginPage.tsx`
	- Динамические SEO-теги для страницы входа.
- `frontend/src/routes/RegisterPage.tsx`
	- Динамические SEO-теги для страницы регистрации.
- `frontend/public/favicon.svg`
	- Добавлен фавикон.
- `frontend/public/og-image.svg`
	- Добавлено изображение для social preview.

## Демо vs живой режим внешнего API

- Демо: если `OPENWEATHERMAP_API_KEY` не задан, сервер возвращает демонстрационные данные (`demo=true`).
- Живой режим: при наличии ключа backend запрашивает реальные данные OpenWeatherMap.

## Проверка локально

1. Проверить, что контейнеры запущены:

```powershell
docker compose ps
```

2. Проверить `sitemap.xml`:

```powershell
curl.exe -i "http://localhost:8080/sitemap.xml"
```

Ожидается `HTTP/200` и XML.

3. Проверить `robots.txt`:

```powershell
curl.exe -i "http://localhost:8080/robots.txt"
```

Ожидается `HTTP/200` и строка с `Sitemap:`.

4. Проверить endpoint внешней погоды:

```powershell
curl.exe -i "http://localhost:8080/api/external/weather?lat=55.7558&lon=37.6173"
```

Ожидается `HTTP/200` и JSON с полями `location`, `tempC`, `description` (и `demo` в demo-режиме).

5. Проверить SEO на фронтенде:

- Открыть `http://localhost:5173/` и убедиться, что открывается лендинг.
- Открыть исходный код страницы (View Page Source) и проверить `title`, `meta description`, `og:*`, `twitter:*`, `canonical`.
- Проверить отображение фавикона во вкладке браузера.

## Как увидеть сайт в поиске

Локальный `localhost` не индексируется. Чтобы ссылка появилась в Google/Яндекс, нужен публичный домен/URL и индексация через Google Search Console / Яндекс.Вебмастер.

## Как включить живой API (PowerShell)

```powershell
$env:OPENWEATHERMAP_API_KEY='ВАШ_КЛЮЧ'
docker compose build backend
docker compose up -d backend
```

После этого `/api/external/weather` будет возвращать реальные данные.

## Безопасность

- API-ключ не хранится в репозитории, берётся из переменных окружения.
- Серверный адаптер скрывает детали внешнего API от клиента.
- Demo-fallback оставлен намеренно для стабильной демонстрации на защите.

<!-- Корректное отображение на мобильных устройствах -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- Заголовок вкладки и основной заголовок в поисковой выдаче -->
<title>Sport Planner - платформа для тренера и спортсмена</title>

<!-- Краткое описание страницы для поисковых систем -->
<meta
  name="description"
  content="Sport Planner помогает тренеру управлять спортсменами, посещаемостью, планами и отчётами, а атлету - видеть персональный прогресс."
/>

<!-- Ключевые слова (влияют слабо, но могут использоваться как доп. сигнал) -->
<meta
  name="keywords"
  content="спорт, тренер, спортсмен, спортшкола, план тренировок, посещаемость, отчёты"
/>

<!-- Разрешаем индексировать страницу и переходить по ссылкам -->
<meta name="robots" content="index,follow" />

<!-- Цвет браузерного интерфейса на мобильных -->
<meta name="theme-color" content="#020617" />

<!-- Канонический URL: помогает избежать дублей страниц -->
<link rel="canonical" href="/" />

<!-- Иконка сайта во вкладке браузера -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

<!-- Open Graph: данные для превью в соцсетях/мессенджерах -->
<meta property="og:locale" content="ru_RU" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Sport Planner - платформа для тренера и спортсмена" />
<meta
  property="og:description"
  content="Сервис для тренеров и атлетов: планы, посещаемость, рацион, травмы и отчёты в одном кабинете."
/>
<meta property="og:image" content="/og-image.svg" />
<meta property="og:url" content="/" />

<!-- Twitter Card: превью при публикации ссылки в X/Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Sport Planner - платформа для тренера и спортсмена" />
<meta
  name="twitter:description"
  content="Сервис для тренеров и атлетов: планы, посещаемость, рацион, травмы и отчёты в одном кабинете."
/>
<meta name="twitter:image" content="/og-image.svg" />

<!-- Подключение JS-бандла приложения (сгенерирован сборщиком) -->
<script type="module" crossorigin src="/assets/index-2ehIt5SI.js"></script>

<!-- Подключение CSS-бандла приложения (сгенерирован сборщиком) -->
<link rel="stylesheet" crossorigin href="/assets/index-BQNHZxKb.css">
