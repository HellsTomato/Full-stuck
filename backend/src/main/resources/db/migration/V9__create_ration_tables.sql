-- V9__create_ration_tables.sql

-- ==== Таблица дневной информации по рациону ====

CREATE TABLE ration_day (
    id             BIGSERIAL PRIMARY KEY,
    athlete_id     UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    date           DATE NOT NULL,
    food_status    VARCHAR(32),
    morning_weight DOUBLE PRECISION,
    comment        TEXT
);

CREATE INDEX idx_ration_day_athlete_date
    ON ration_day (athlete_id, date);

-- ==== Таблица приёмов пищи ====

CREATE TABLE ration_item (
    id         BIGSERIAL PRIMARY KEY,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    date       DATE NOT NULL,
    category   VARCHAR(32) NOT NULL,
    title      VARCHAR(255) NOT NULL,
    calories   INT,
    notes      TEXT
);

CREATE INDEX idx_ration_item_athlete_date
    ON ration_item (athlete_id, date);

CREATE INDEX idx_ration_item_date
    ON ration_item (date);
