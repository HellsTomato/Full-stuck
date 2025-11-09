CREATE TABLE trainers (
    id UUID PRIMARY KEY,               -- id — первичный ключ (UUID, заполняем в Java)
    username VARCHAR(255) NOT NULL UNIQUE,  -- username — уникальный логин тренера
    password_hash VARCHAR(255) NOT NULL,    -- password_hash — хэш пароля
    full_name VARCHAR(255) NOT NULL         -- full_name — ФИО тренера
);
