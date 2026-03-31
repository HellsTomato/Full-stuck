import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAthletes } from "@/services/athletes";
import { getMyAthleteIds, linkAthlete, unlinkAthlete } from "@/services/trainerAthletes";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toast";
import { Link, useSearchParams } from "react-router-dom";
import { formatTrainingGroup } from "@/utils/groupLabels";

export default function Athletes() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  // ЛР3: источник правды для фильтров/сортировки/пагинации — URL query params.
  const search = params.get("search") ?? "";
  const group = params.get("group") ?? "";
  const rawSortBy = params.get("sortBy");
  const rawSortDir = params.get("sortDir");
  const sortBy = rawSortBy === "birthDate" || rawSortBy === "group" ? rawSortBy : "fullName";
  const sortDir = rawSortDir === "desc" ? "desc" : "asc";
  const rawPage = Number(params.get("page") ?? "0");
  const rawSize = Number(params.get("size") ?? "10");
  const page = Number.isFinite(rawPage) && rawPage >= 0 ? rawPage : 0;
  const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 10;
  const toast = useToast();

  // Серверная фильтрация/сортировка/пагинация: фронт передает только параметры.
  const { data, isLoading } = useQuery({
    queryKey: ["athletes", search, group, sortBy, sortDir, page, size],
    queryFn: () => getAthletes({ search, group, sortBy, sortDir, page, size }),
  });

  const { data: linkedIds } = useQuery({
    queryKey: ["trainer-athlete-ids"],
    queryFn: () => getMyAthleteIds(),
  });

  const linkMut = useMutation({
    mutationFn: linkAthlete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainer-athlete-ids"] });
      qc.invalidateQueries({ queryKey: ["trainer-athletes"] });
      toast.push("Атлет добавлен в ваш список", "success");
    },
  });

  const unlinkMut = useMutation({
    mutationFn: unlinkAthlete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainer-athlete-ids"] });
      qc.invalidateQueries({ queryKey: ["trainer-athletes"] });
      toast.push("Атлет удалён из вашего списка", "success");
    },
  });

  function onToggleAthlete(id: string) {
    if (linkedIds?.has(id)) {
      unlinkMut.mutate(id);
      return;
    }
    linkMut.mutate(id);
  }

  const totalPages = data?.totalPages ?? 0;
  const canPrev = page > 0;
  const canNext = totalPages > 0 && page < totalPages - 1;

  // Удобный helper: любые изменения UI сразу отражаем в URL.
  const updateParams = (next: Record<string, string>) => {
    const draft = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (!v) {
        draft.delete(k);
      } else {
        draft.set(k, v);
      }
    });
    setParams(draft);
  };

  const sortOptions = useMemo(
    () => [
      { value: "fullName:asc", label: "ФИО A-Z" },
      { value: "fullName:desc", label: "ФИО Z-A" },
      { value: "birthDate:asc", label: "Дата рождения (старше)" },
      { value: "birthDate:desc", label: "Дата рождения (младше)" },
      { value: "group:asc", label: "Группа A-Z" },
      { value: "group:desc", label: "Группа Z-A" },
    ],
    []
  );

  const sortValue = `${sortBy}:${sortDir}`;

  return (
    <div className="p-6 space-y-4 text-[var(--color-text)]">
      <Topbar search={search} onSearch={(v) => updateParams({ search: v, page: "0" })}>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-muted)]">Группа</label>
          <select
            value={group}
            onChange={(e) => updateParams({ group: e.target.value, page: "0" })}
            className="input"
          >
            <option value="">Все</option>
            <option value="JUNIORS">Юниоры</option>
            <option value="SENIORS">Старшие</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-muted)]">Сортировка</label>
          <select
            value={sortValue}
            onChange={(e) => {
              // Храним sortBy/sortDir отдельно, чтобы backend валидировал и применял корректно.
              const [nextSortBy, nextSortDir] = e.target.value.split(":");
              updateParams({ sortBy: nextSortBy, sortDir: nextSortDir, page: "0" });
            }}
            className="input"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-muted)]">На странице</label>
          <select
            value={String(size)}
            onChange={(e) => updateParams({ size: e.target.value, page: "0" })}
            className="input"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
      </Topbar>

      <div className="card-dark overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-[var(--color-muted)]">Загрузка…</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-surface)]">
              <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-2 text-[var(--color-muted)]">
                <th>ФИО</th>
                <th>Группа</th>
                <th>Телефон</th>
                <th>Дата рождения</th>
                <th>Примечания</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {data?.items?.length ? (
                data.items.map((a) => {
                  const linked = linkedIds?.has(a.id) ?? false;
                  return (
                    <tr key={a.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface)]/80">
                      <td className="px-4 py-2">
                        <Link to={`/athletes/${a.id}`} className="text-[var(--color-primary)]">
                          {a.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-2">{formatTrainingGroup(a.group)}</td>
                      <td className="px-4 py-2">{a.phone || "—"}</td>
                      <td className="px-4 py-2">{a.birthDate || "—"}</td>
                      <td className="px-4 py-2 max-w-[20rem] truncate">{a.notes || "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => onToggleAthlete(a.id)}
                          className="btn-outline text-sm rounded-2xl px-3 py-1.5"
                        >
                          {linked ? "Убрать" : "Выбрать"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-[var(--color-muted)]">Нет данных</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--color-muted)]">
          Всего: {data?.total ?? 0}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!canPrev}
            onClick={() => updateParams({ page: String(Math.max(page - 1, 0)) })}
            className="btn-outline text-sm rounded-2xl px-3 py-1.5 disabled:opacity-50"
          >
            Назад
          </button>
          <span className="text-sm text-[var(--color-muted)]">
            Страница {totalPages === 0 ? 0 : page + 1} из {totalPages}
          </span>
          <button
            disabled={!canNext}
            onClick={() => updateParams({ page: String(page + 1) })}
            className="btn-outline text-sm rounded-2xl px-3 py-1.5 disabled:opacity-50"
          >
            Вперед
          </button>
        </div>
      </div>
    </div>
  );
}

export function Topbar({
  search,
  onSearch,
  children,
}: {
  search: string;
  onSearch: (s: string) => void;
  children: React.ReactNode;
}) {
  const [v, setV] = useState(search);

  useEffect(() => {
    // При back/forward-навигации подхватываем значение из URL.
    setV(search);
  }, [search]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex-1">
        <input
          placeholder="Поиск"
          className="input"
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            onSearch(e.target.value);
          }}
        />
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
