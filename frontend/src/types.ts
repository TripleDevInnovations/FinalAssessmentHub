
export interface AP2Category {
  main: number;
  extra: number;
}

export interface AP2 {
  planning: AP2Category;
  development: AP2Category;
  economy: AP2Category;
}

export interface PW {
  presentation: number;
  project: number;
}

export interface Entry {
  id: string;
  name: string;
  ap1: number;
  ap2: AP2;
  pw: PW;
}

export interface ExamPayload {
  Name: string;
  AP1: number;
  AP2: {
    planning: { main: number; extra: number | null };
    development: { main: number; extra: number | null };
    economy: { main: number; extra: number | null };
  };
  PW: {
    presentation: number;
    project: number;
  };
}
