-- V6_create_injuries.sql
-- Таблица травм спортсменов

CREATE TABLE IF NOT EXISTS injuries (
    id           BIGSERIAL PRIMARY KEY,
    athlete_id   UUID        NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    injury_type  VARCHAR(255) NOT NULL,
    injury_date  DATE        NOT NULL,
    status       VARCHAR(32) NOT NULL,
    notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_injuries_status ON injuries(status);
CREATE INDEX IF NOT EXISTS idx_injuries_date   ON injuries(injury_date);
