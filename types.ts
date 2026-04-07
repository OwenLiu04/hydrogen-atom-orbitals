export interface QuantumNumbers {
  n: number;
  l: number;
  m: number;
}

export interface OrbitalData {
  points: Float32Array;
  colors: Float32Array;
}

export interface TutorResponse {
  markdown: string;
}

export type ViewMode = 'points' | 'surface';
