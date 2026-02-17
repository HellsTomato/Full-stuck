
export type Athlete = {
  id: string;
  fullName: string;
  birthDate: string;
  group: string;
  phone?: string;
  notes?: string;
  status?: "active" | "archived";
};

export type SessionItem = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: string;
  load?: string;
  notes?: string;
  group: string;
};

export type Attendance = {
  id: string;
  athleteId: string;
  sessionId: string;
  status: "Присутствовал" | "Опоздал" | "Отсутствовал";
  comment?: string;
};

export type InjuryStatus = 'ACTIVE' | 'CLOSED'

export type Injury = {
  id: number
  athleteId: string
  fullName: string
  group: string
  birthDate?: string | null
  type: string
  date: string
  status: InjuryStatus
  closedDate?: string | null
  notes?: string | null
};

export type Nutrition = {
  id: string;
  athleteId: string;
  date: string;
  weightKg?: number;
  notes?: string;
  flag?: "ОК" | "Требует внимания";
};
