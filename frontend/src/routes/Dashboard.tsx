// frontend/src/routes/Dashboard.tsx

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWeekPlan } from "@/services/weeklyPlan";
import { getAttendance } from "@/services/attendance";
import { getAthletes } from "@/services/athletes";
import { useNavigate } from "react-router-dom";
import type { Attendance } from "@/types";

// ===== ДАТЫ =====

// Превращаем Date в строку формата YYYY-MM-DD
function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Сегодняшняя дата в формате YYYY-MM-DD
function isoToday() {
  return iso(new Date());
}

// Находим понедельник для недели, в которую входит date
function mondayOf(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 (ВС) - 6 (СБ)
  const diff = (day === 0 ? -6 : 1) - day; // сдвиг до понедельника
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// Короткие обозначения дней
const DAYS = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

// ===== ГРУППЫ =====

// Лейблы для отображения
const GROUP_LABELS: Record<string, string> = {
  JUNIORS: "Юниоры",
  SENIORS: "Старшие",
};

// Ключ в localStorage — тот же, что и у WeeklyPlan
const GROUP_KEY = "weeklyPlan.groupFilter";

// Обрезаем дату до YYYY-MM-DD (если вдруг с временем)
function normalizeDateStr(value: string | undefined | null): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

export default function Dashboard() {
  const nav = useNavigate();

  const today = isoToday();      // сегодня
  const weekStart = mondayOf();  // понедельник текущей недели

  // Читаем выбранную группу из localStorage
  const storedGroup =
    (typeof window !== "undefined" &&
      window.localStorage.getItem(GROUP_KEY)) ||
    "ALL";

  // ===== СПОРТСМЕНЫ (чтобы собрать группы, если надо где-то ещё использовать) =====
  const { data: athletes } = useQuery({
    queryKey: ["athletes"],
    queryFn: () => getAthletes({}),
  });

  // Уникальные группы из списка спортсменов
  const groups = useMemo(() => {
    const set = new Set<string>();
    (athletes?.items || []).forEach((a: any) => set.add(a.group));
    return Array.from(set);
  }, [athletes]);

  // ===== НЕДЕЛЬНЫЙ ПЛАН =====
  const { data: trainings = [] } = useQuery({
    queryKey: ["weekly", weekStart, storedGroup],
    // fetchWeekPlan ожидает (weekStart, groupCode)
    queryFn: () => fetchWeekPlan(weekStart, storedGroup),
  });

  // Находим тренировку на сегодня для выбранной группы
  const todaySession = useMemo(() => {
    return trainings.find((t: any) => {
      const d = normalizeDateStr(t.date);
      return (
        d === today &&
        (storedGroup === "ALL" || t.group === storedGroup)
      );
    });
  }, [trainings, storedGroup, today]);

  // ===== ПОСЕЩАЕМОСТЬ НА СЕГОДНЯ =====

  // Для "ALL" мы не передаём group вообще — бэк вернёт посещаемость по всем группам,
  // у которых сегодня есть тренировка.
  const effectiveGroupForAttendance =
    storedGroup === "ALL" ? undefined : storedGroup;

  const { data: attendanceItems = [] } = useQuery<Attendance[]>({
    // В ключ кладём today + effectiveGroup, чтобы кэш различал группы
    queryKey: ["attendance", today, effectiveGroupForAttendance ?? "ALL"],
    queryFn: () =>
      getAttendance({
        date: today,
        group: effectiveGroupForAttendance,
      }),
  });

  // Считаем количество по енамам (PRESENT / LATE / ABSENT),
  // которые мы нормализовали в сервисе attendance.ts
  const present = attendanceItems.filter(
    (x) => x.status === "PRESENT"
  ).length;

  const late = attendanceItems.filter((x) => x.status === "LATE").length;

  const absent = attendanceItems.filter(
    (x) => x.status === "ABSENT"
  ).length;

  // ===== ДНИ НЕДЕЛИ (для маленького календаря справа) =====
  const weekCells = useMemo(() => {
    const base = new Date(today);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const isoD = iso(d);

      const has = trainings.some((t: any) => {
        const td = normalizeDateStr(t.date);
        return (
          td === isoD &&
          (storedGroup === "ALL" || t.group === storedGroup)
        );
      });

      return {
        iso: isoD,
        label: DAYS[d.getDay()],
        dayNum: d.getDate(),
        isToday: isoD === today,
        has,
      };
    });
  }, [trainings, storedGroup, today]);

  // Смена группы — синхронизируем с WeeklyPlan через localStorage
  const changeGroup = (g: string) => {
    window.localStorage.setItem(GROUP_KEY, g);
    window.location.reload(); // перерисуем Dashboard с новой группой
  };

  return (
    <div className="p-4 md:p-6 space-y-4 text-[var(--color-text)]">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
        {/* ===== ЛЕВАЯ КАРТОЧКА: СЕГОДНЯШНЯЯ ТРЕНИРОВКА ===== */}
        <div className="card-dark">
          <div className="px-4 py-2 border-b border-[var(--color-border)] text-sm font-semibold flex justify-between">
            <span>Сегодняшняя тренировка</span>
            <span className="text-[10px] opacity-70">
              Группа:{" "}
              {storedGroup === "ALL"
                ? "Все"
                : GROUP_LABELS[storedGroup]}
            </span>
          </div>

          <div className="p-4 text-sm">
            {todaySession ? (
              <>
                <div className="mb-2 text-[var(--color-text)]">
                  {todaySession.time || "—"}
                </div>

                <div className="mb-1">
                  Тип: <b>{todaySession.type}</b>
                </div>

                <div className="mb-2">
                  Нагрузка: <b>{todaySession.loadLevel}</b>
                </div>

                <div className="mb-1">
                  Присутствуют: <b>{present}</b>
                </div>

                <div className="mb-1">
                  Опоздали: <b>{late}</b>
                </div>

                <div className="mb-2">
                  Отсутствуют: <b>{absent}</b>
                </div>

                {todaySession.notes && (
                  <pre className="whitespace-pre-wrap opacity-80 mt-2">
                    {todaySession.notes}
                  </pre>
                )}
              </>
            ) : (
              <div className="opacity-60">
                На сегодня тренировка не запланирована
              </div>
            )}
          </div>
        </div>

        {/* ===== ПРАВАЯ КОЛОНКА ===== */}
        <div className="space-y-3">
          {/* Выбор группы */}
          <div className="card-dark p-3 flex items-center gap-2">
            <label className="text-sm opacity-70">Группа:</label>
            <select
              className="px-3 py-2 rounded-xl bg-[var(--color-bg)] border text-sm"
              value={storedGroup}
              onChange={(e) => changeGroup(e.target.value)}
            >
              <option value="ALL">Все</option>
              <option value="JUNIORS">Юниоры</option>
              <option value="SENIORS">Старшие</option>
            </select>
          </div>

          {/* Недельный мини-календарь */}
          <div className="card-dark">
            <div className="px-4 py-2 border-b text-sm font-semibold opacity-70">
              Неделя
            </div>
            <div className="p-3 grid grid-cols-7 gap-1">
              {weekCells.map((c) => (
                <div
                  key={c.iso}
                  className={[
                    "h-12 grid place-items-center rounded-md border text-xs",
                    c.isToday
                      ? "border-[var(--color-primary)] bg-[var(--color-surface)]"
                      : "border-[var(--color-border)]",
                    c.has ? "bg-[var(--color-border)]" : "",
                  ].join(" ")}
                >
                  <div className="font-medium">{c.label}</div>
                  <div className="opacity-70 text-[10px]">{c.dayNum}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== БЫСТРЫЕ ДЕЙСТВИЯ ===== */}
      <div className="card-dark">
        <div className="px-4 py-2 border-b opacity-70 text-sm font-semibold">
          Быстрые действия
        </div>
        <div className="p-3 flex flex-wrap gap-2">
          <button onClick={() => nav("/attendance")} className="btn-outline">
            Отметить посещаемость
          </button>
          <button onClick={() => nav("/injuries")} className="btn-outline">
            Добавить травму
          </button>
          <button onClick={() => nav("/reports")} className="btn-outline">
            Сформировать отчёт
          </button>
        </div>
      </div>
    </div>
  );
}
