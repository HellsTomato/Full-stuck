CREATE TABLE IF NOT EXISTS attendance_records (
    id          BIGSERIAL PRIMARY KEY,
    date        DATE        NOT NULL,
    group_type  VARCHAR(32) NOT NULL,
    athlete_id  UUID        NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    status      VARCHAR(32) NOT NULL,
    CONSTRAINT uk_attendance_date_group_athlete
        UNIQUE (date, group_type, athlete_id)
);
