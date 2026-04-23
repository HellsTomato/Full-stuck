# Лабораторная работа №6 - Контейнеризация и автоматизация развертывания

## Что реализовано

### 1) Архитектура контейнеризации
Сервисы и роли:
- frontend (Nginx + статика Vite)
- backend (Spring Boot API)
- db (PostgreSQL)
- object storage (MinIO)

Сетевая схема:
- сервисы объединены в выделенную сеть `app_net`
- frontend проксирует `/api` в backend
- backend использует db и minio по внутренним именам сервисов

### 2) Контейнеризация компонентов
- `frontend/Dockerfile` и `frontend/nginx.conf` для раздачи SPA и reverse proxy
- `backend/Dockerfile` (multi-stage build для Spring Boot)
- `.dockerignore` для frontend/backend

### 3) Оркестрация docker compose
- запуск всего стека одной командой: `docker compose up --build -d`
- настроены порты, тома и переменные окружения
- добавлены `healthcheck` для db/minio/backend/frontend
- добавлен порядок запуска по готовности зависимостей через `depends_on.condition: service_healthy`
- добавлены `restart: unless-stopped` для устойчивости к падениям

### 4) Безопасная и управляемая конфигурация
- параметры вынесены в env-переменные и шаблон `.env.example`
- локальные env-файлы исключены из Git (`.env`, `.env.*`), шаблон остается в репозитории
- backend использует env для DB и JWT/TTL параметров

### 5) CI/CD
Добавлен pipeline GitHub Actions (`.github/workflows/ci-cd.yml`):
- backend: тесты и пакетирование
- frontend: lint (`tsc --noEmit`), unit-тесты, сборка
- сборка Docker-образов backend/frontend
- автоматический deploy по `push` в `master` (через SSH) при наличии секретов:
  - `DEPLOY_HOST`
  - `DEPLOY_USER`
  - `DEPLOY_SSH_KEY`
  - `DEPLOY_PATH`

## Проверка конфигурации

### Локальная воспроизводимость
```bash
docker compose --env-file .env up --build -d
```

### Проверка health сервисов
```bash
docker compose ps
curl http://localhost:8080/api/health
curl http://localhost:5173/
```

### Проверка сохранения функциональности
- frontend доступен на `http://localhost:5173`
- backend API доступен на `http://localhost:8080`
- загрузка и чтение фото через MinIO сохраняются
- миграции Flyway применяются при старте backend

### Проверка устойчивости к типовым сбоям
1. Падение backend:
```bash
docker compose stop backend
docker compose ps
```
Ожидание: сервис восстановится при `docker compose up -d backend`, зависимые сервисы продолжают работать.

2. Недоступность внешнего weather API:
- при проблемах внешней зависимости backend возвращает контролируемый ответ (по реализованной логике обработчика внешнего API)

3. Ошибка миграции:
- при ошибке Flyway backend не переходит в healthy-состояние, что видно в `docker compose ps` и логах
