import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  fetchWeekPlan,
  saveWeeklyTraining,
  deleteWeeklyTraining,
  copyWeek,
  WeeklyTraining,
  TrainingGroup,
} from "@/services/weeklyPlan";

import { useToast } from "@/components/Toast";

// ———————————————————————————————
// Для отображения названий групп
// ———————————————————————————————
const GROUP_LABELS: Record<string, string> = {
  JUNIORS: "Юниоры",
  SENIORS: "Старшие",
};

// ———————————————————————————————
// Получение ISO даты
// ———————————————————————————————
function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ———————————————————————————————
// Генерация дат недели
// ———————————————————————————————
function getWeekDates(startISO: string): string[] {
  const dates: string[] = [];
  const base = new Date(startISO);

  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    dates.push(toISODate(d));
  }

  return dates;
}

export default function WeeklyPlan() {
  const qc = useQueryClient();
  const toast = useToast();

  // ———————————————————————————————
  // Неделя
  // ———————————————————————————————
  const [weekStart, setWeekStart] = useState<string>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // понедельник
    now.setDate(now.getDate() + diff);
    now.setHours(0, 0, 0, 0);
    return toISODate(now);
  });

  // ———————————————————————————————
  // Группа
  // ———————————————————————————————
  const [groupFilter, setGroupFilter] = useState<TrainingGroup>("ALL");

  // ———————————————————————————————
  // Редактируемая тренировка
  // ———————————————————————————————
  const [editing, setEditing] = useState<WeeklyTraining | null>(null);

  // ———————————————————————————————
  // Загрузка тренировок на неделю
  // ———————————————————————————————
  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ["weekly-plan", weekStart, groupFilter],
    queryFn: () => fetchWeekPlan(weekStart, groupFilter),
  });

  // ———————————————————————————————
  // Сохранение тренировки
  // ———————————————————————————————
  const saveMut = useMutation({
    mutationFn: saveWeeklyTraining,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly-plan", weekStart, groupFilter] });
      setEditing(null);
      toast.success("Сохранено");
    },
  });

  // ———————————————————————————————
  // Удаление тренировки
  // ———————————————————————————————
  const deleteMut = useMutation({
    mutationFn: deleteWeeklyTraining,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly-plan", weekStart, groupFilter] });
      toast.success("Удалено");
    },
  });

  // ———————————————————————————————
  // Копирование недели
  // ———————————————————————————————
  const copyMut = useMutation({
    mutationFn: copyWeek,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly-plan", weekStart, groupFilter] });
      toast.success("Неделя скопирована");
    },
  });

  function handleCopy() {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);

    copyMut.mutate({
      fromWeekStart: toISODate(prev),
      toWeekStart: weekStart,
      group: groupFilter === "ALL" ? null : groupFilter,
    });
  }

  // ———————————————————————————————
  // Переход по неделям (НОРМАЛЬНЫЙ, РАБОЧИЙ)
  // ———————————————————————————————
  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(toISODate(d)); // << НИКАКИХ getMonday — РАБОТАЕТ ВСЕГДА
  };

  // ———————————————————————————————
  // Даты недели
  // ———————————————————————————————
  const dates = getWeekDates(weekStart);

  // ———————————————————————————————
  // Чтобы разбить тренировки по дням
  // ———————————————————————————————
  const grouped: Record<string, WeeklyTraining[]> = {};
  for (const t of trainings) {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  }

  // ———————————————————————————————
  // UI
  // ———————————————————————————————
  return (
    <div className="p-6 text-[var(--color-text)] space-y-4">

      {/* Верхняя панель */}
      <div className="flex items-center gap-3 flex-wrap">
        <button className="btn rounded-2xl" onClick={() => shiftWeek(-1)}>
          ← Пред. неделя
        </button>

        <div className="font-semibold text-lg">
          {weekStart} — {dates[6]}
        </div>

        <button className="btn rounded-2xl" onClick={() => shiftWeek(1)}>
          След. неделя →
        </button>

        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value as TrainingGroup)}
          className="px-3 py-2 rounded-2xl
                     bg-[var(--color-bg)]
                     border border-[var(--color-border)]
                     text-[var(--color-text)]"
        >
          <option value="ALL">Все группы</option>
          <option value="JUNIORS">Юниоры</option>
          <option value="SENIORS">Старшие</option>
        </select>

        <button className="btn rounded-2xl" onClick={handleCopy}>
          Копировать неделю
        </button>
      </div>

      {/* Форма редактирования */}
      {editing && (
        <div className="card-dark p-4 space-y-3 rounded-2xl">

          <div className="text-xl font-semibold">
            {editing.id ? "Редактировать тренировку" : "Создать тренировку"}
          </div>

          <div className="grid gap-3 md:grid-cols-3">

            {/* Дата */}
            <input
              type="date"
              value={editing.date}
              onChange={(e) => setEditing(prev => prev ? { ...prev, date: e.target.value } : prev)}
              className="px-3 py-2 rounded-2xl
                         bg-[var(--color-bg)]
                         border border-[var(--color-border)]
                         text-[var(--color-text)]"
            />

            {/* Время */}
            <input
              type="time"
              value={editing.time}
              onChange={(e) => setEditing(prev => prev ? { ...prev, time: e.target.value } : prev)}
              className="px-3 py-2 rounded-2xl
                         bg-[var(--color-bg)]
                         border border-[var(--color-border)]
                         text-[var(--color-text)]"
            />

            {/* Группа */}
            <select
              value={editing.group}
              onChange={(e) =>
                setEditing(prev =>
                  prev ? { ...prev, group: e.target.value as "JUNIORS" | "SENIORS" } : prev
                )
              }
              className="px-3 py-2 rounded-2xl
                         bg-[var(--color-bg)]
                         border border-[var(--color-border)]
                         text-[var(--color-text)]"
            >
              <option value="JUNIORS">Юниоры</option>
              <option value="SENIORS">Старшие</option>
            </select>

            {/* Тип */}
            <input
              type="text"
              placeholder="Тип тренировки"
              value={editing.type}
              onChange={(e) => setEditing(prev => prev ? { ...prev, type: e.target.value } : prev)}
              className="px-3 py-2 rounded-2xl
                         bg-[var(--color-bg)]
                         border border-[var(--color-border)]
                         text-[var(--color-text)] md:col-span-3"
            />

            {/* Нагрузка */}
            <input
              type="text"
              placeholder="Нагрузка"
              value={editing.loadLevel}
              onChange={(e) => setEditing(prev => prev ? { ...prev, loadLevel: e.target.value } : prev)}
              className="px-3 py-2 rounded-2xl
                         bg-[var(--color-bg)]
                         border border-[var(--color-border)]
                         text-[var(--color-text)] md:col-span-3"
            />

            {/* Заметки */}
            <textarea
              placeholder="Заметки"
              value={editing.notes}
              onChange={(e) => setEditing(prev => prev ? { ...prev, notes: e.target.value } : prev)}
              className="px-3 py-2 rounded-2xl min-h-[80px]
                         bg-[var(--color-bg)]
                         border border-[var(--color-border)]
                         text-[var(--color-text)] md:col-span-3"
            />

            {/* Кнопки */}
            <div className="flex justify-end gap-3 md:col-span-3">
              <button
                className="btn rounded-2xl"
                onClick={() => setEditing(null)}
              >
                Отмена
              </button>

              <button
                className="btn rounded-2xl"
                onClick={() => editing && saveMut.mutate(editing)}
              >
                Сохранить
              </button>

              {editing.id && (
                <button
                  className="btn-danger rounded-2xl"
                  onClick={() => deleteMut.mutate(editing.id!)}
                >
                  Удалить
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Список тренировки по дням */}
      <div className="card-dark rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-4">Загрузка...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-2">Дата</th>
                <th className="text-left px-4 py-2">Тренировки</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => (
                <tr
                  key={date}
                  className="border-b border-[var(--color-border)]"
                >
                  <td className="px-4 py-3 font-semibold">{date}</td>

                  <td className="px-4 py-3 space-y-2">
                    {(grouped[date] || []).length === 0 ? (
                      <div className="text-gray-400">Нет тренировок</div>
                    ) : (
                      grouped[date].map((t) => (
                        <div
                          key={t.id}
                          className="bg-[var(--color-surface)] p-3 rounded-xl flex justify-between"
                        >
                          <div>
                            <b>{t.time || "—"}</b> — {t.type}
                            <div className="text-xs text-gray-400 mt-1">
                              {GROUP_LABELS[t.group]} • {t.loadLevel}
                              {t.notes && ` — ${t.notes}`}
                            </div>
                          </div>

                          <button
                            className="btn-xs"
                            onClick={() => setEditing(t)}
                          >
                            Изм.
                          </button>
                        </div>
                      ))
                    )}
                  </td>

                  <td className="px-4">
                    <button
                      className="btn-xs"
                      onClick={() =>
                        setEditing({
                          id: undefined,
                          date,
                          time: "",
                          type: "",
                          loadLevel: "",
                          group: "JUNIORS",
                          notes: "",
                        })
                      }
                    >
                      + Добавить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
