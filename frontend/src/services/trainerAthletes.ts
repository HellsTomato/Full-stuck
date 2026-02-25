import type { Athlete } from "@/types";
import { api } from "./client";

function normalizeAthlete(a: any): Athlete {
  return {
    ...a,
    group: a.group || a.grp,
  } as Athlete;
}

export async function getMyAthletes(): Promise<Athlete[]> {
  const data = await api<any[]>("/api/trainers/me/athletes");
  return (data || []).map(normalizeAthlete);
}

export async function getMyAthleteIds(): Promise<Set<string>> {
  const data = await api<string[]>("/api/trainers/me/athletes/ids");
  return new Set(data || []);
}

export async function linkAthlete(athleteId: string): Promise<void> {
  await api<void>(`/api/trainers/me/athletes/${athleteId}`, {
    method: "POST",
  });
}

export async function unlinkAthlete(athleteId: string): Promise<void> {
  await api<void>(`/api/trainers/me/athletes/${athleteId}`, {
    method: "DELETE",
  });
}
