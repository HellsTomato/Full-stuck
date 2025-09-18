
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

export type Injury = {
  id: string;
  athleteId: string;
  kind: string;
  date: string;
  status: "Активная" | "Закрыта";
  recommendations?: string;
};

export type Nutrition = {
  id: string;
  athleteId: string;
  date: string;
  weightKg?: number;
  notes?: string;
  flag?: "ОК" | "Требует внимания";
};
