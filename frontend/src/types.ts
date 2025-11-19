
export interface AP2Category {
  main?: number;
  extra?: number;
}

export interface PW {
  project?: number;
  presentation?: number;
}

export interface AP2 {
  planning: AP2Category;
  development: AP2Category;
  economy: AP2Category;
  pw: PW
}

export interface Entry {
  id: string;
  name: string;
  ap1?: number;
  ap2: AP2;
}

export interface ExamPayload {
  name: string;
  ap1?: number;
  ap2: AP2;
}

export interface GradeAndPoints {
  points?: number;
  grade?: number;
}

export interface CalculationResult {
  AP1: GradeAndPoints;
  AP2: {
    planning: GradeAndPoints;
    development: GradeAndPoints;
    economy: GradeAndPoints;
    pw: {
      project: GradeAndPoints;
      presentation: GradeAndPoints;
      overall: GradeAndPoints;
    };
    overall: GradeAndPoints;
  }
  Overall: GradeAndPoints;
  Status: {
    passed: boolean;
    reasons: Array<String>;
  };
}
