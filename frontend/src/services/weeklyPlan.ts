import { api } from "./client";

export type TrainingGroup = "ALL" | "JUNIORS" | "SENIORS";

export type WeeklyTraining = {
  id?: number;
  date: string;                  // YYYY-MM-DD
  time: string;                  // HH:MM
  type: string;
  loadLevel: string;
  group: "JUNIORS" | "SENIORS";
  notes: string;
};

// ───────────────────────────────────
// Получить план недели
// ───────────────────────────────────
export async function fetchWeekPlan(
  weekStart: string,
  group: TrainingGroup
): Promise<WeeklyTraining[]> {
  const params = new URLSearchParams();
  params.set("weekStart", weekStart);
  params.set("group", group);

  const url = `/api/weekly-plan?${params.toString()}`;
  return api<WeeklyTraining[]>(url);
}

// ───────────────────────────────────
// Сохранить / создать тренировку
// ───────────────────────────────────
export async function saveWeeklyTraining(training: WeeklyTraining) {
  const payload = {
    id: training.id ?? null,
    date: training.date,
    time: training.time || "",
    type: training.type || "",
    loadLevel: training.loadLevel || "",
    group: training.group, // "JUNIORS" / "SENIORS"
    notes: training.notes || "",
  };

  return api<WeeklyTraining>("/api/weekly-plan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ───────────────────────────────────
// Удалить тренировку
// ───────────────────────────────────
export async function deleteWeeklyTraining(id: number) {
  return api<void>(`/api/weekly-plan/${id}`, {
    method: "DELETE",
  });
}

// ───────────────────────────────────
// Копировать неделю
// ───────────────────────────────────
export type CopyWeekPayload = {
  fromWeekStart: string;
  toWeekStart: string;
  group?: "JUNIORS" | "SENIORS" | null; // null → все группы
};

export async function copyWeek(payload: CopyWeekPayload) {
  const body = {
    fromWeekStart: payload.fromWeekStart,
    toWeekStart: payload.toWeekStart,
    group: payload.group ?? null,
  };

  return api<void>("/api/weekly-plan/copy", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
