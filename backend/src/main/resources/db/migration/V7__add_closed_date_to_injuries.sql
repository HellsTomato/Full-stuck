-- V7_add_closed_date_to_injuries.sql
ALTER TABLE injuries
ADD COLUMN IF NOT EXISTS closed_date date;
