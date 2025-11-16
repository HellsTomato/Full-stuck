CREATE TABLE training_sessions (
    id           BIGSERIAL PRIMARY KEY,        -- id тренировки
    date         DATE        NOT NULL,         -- дата тренировки
    time         TIME,                         -- время начала (может быть NULL)
    type         VARCHAR(255),                 -- тип тренировки (силовая, кардио и т.п.)
    load_level   VARCHAR(255),                 -- уровень нагрузки
    group_type   VARCHAR(50)  NOT NULL,        -- группа (JUNIORS / SENIORS)
    notes        TEXT                          -- заметки тренера
);
