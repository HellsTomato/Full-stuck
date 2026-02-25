ALTER TABLE trainers
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'TRAINER';

ALTER TABLE athletes
    ADD COLUMN IF NOT EXISTS username VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_athletes_username
    ON athletes (username)
    WHERE username IS NOT NULL;

CREATE TABLE IF NOT EXISTS trainer_athlete_links (
    trainer_id UUID NOT NULL,
    athlete_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (trainer_id, athlete_id),
    CONSTRAINT fk_trainer_athlete_links_trainer
        FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
    CONSTRAINT fk_trainer_athlete_links_athlete
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_sessions (
    token VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL,
    username VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
