export function formatTrainingGroup(group?: string | null): string {
  if (!group) return "—";

  if (group === "JUNIORS") return "Юниоры";
  if (group === "SENIORS") return "Старшие";

  return group;
}