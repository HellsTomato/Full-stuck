ALTER TABLE trainers
    ADD COLUMN email        VARCHAR(255),
    ADD COLUMN phone        VARCHAR(50),
    ADD COLUMN education    VARCHAR(255),
    ADD COLUMN achievements VARCHAR(2000),
    ADD COLUMN photo_url    VARCHAR(1024);
