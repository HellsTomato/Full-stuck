import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAthletes } from "@/services/athletes";
import { getMyAthleteIds, linkAthlete, unlinkAthlete } from "@/services/trainerAthletes";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import { Link } from "react-router-dom";
import { formatTrainingGroup } from "@/utils/groupLabels";

export default function Athletes() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["athletes", search, group],
    queryFn: () => getAthletes({ search, group }),
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

  return (
    <div className="p-6 space-y-4 text-[var(--color-text)]">
      <Topbar onSearch={setSearch}>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-muted)]">Группа</label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="input"
          >
            <option value="">Все</option>
            <option value="JUNIORS">Юниоры</option>
            <option value="SENIORS">Старшие</option>
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
    </div>
  );
}

export function Topbar({
  onSearch,
  children,
}: {
  onSearch: (s: string) => void;
  children: React.ReactNode;
}) {
  const [v, setV] = useState("");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex-1">
        <input
          placeholder="Поиск"
          className="input"
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            setTimeout(() => onSearch(e.target.value), 300);
          }}
        />
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
