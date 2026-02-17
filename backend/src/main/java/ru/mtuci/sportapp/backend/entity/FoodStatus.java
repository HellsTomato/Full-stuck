package ru.mtuci.sportapp.backend.entity;

/**
 * Статус питания на день.
 * Коды должны совпадать с тем, что шлёт фронт:
 * FULL / PARTIAL / NONE
 */
public enum FoodStatus {
    FULL,     // Полный рацион
    PARTIAL,  // Частичный рацион
    NONE      // Нет питания
}
