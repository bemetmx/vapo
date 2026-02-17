
export interface CalibrationPoint {
  nominal: number;
  mReceived: number; // Medición inicial como se recibe el equipo
  m1: number;
  m2: number;
  m3: number;
  average: number;
  error: number;
  stdDev: number;
}

export interface TolerancePoint {
  nominal: number;
  min: number;
  max: number;
  average: number;
  isCompliant: boolean;
}

export interface CalibrationReport {
  id: string;
  clientName: string;
  equipmentData: {
    brand: string;
    model: string;
    serial: string;
    agent: string; // Sevoflurano, Isoflurano, etc.
  };
  standardEquipment: string;
  testFlow: number; // Nuevo: Flujo utilizado para las pruebas (LPM)
  envConditions: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  date: string;
  measurements: CalibrationPoint[];
  tolerances: TolerancePoint[];
  observations: string;
  aiSummary?: string;
}

// Added missing enums and interfaces for Incident Management
export enum Severity {
  LOW = 'Baja',
  MEDIUM = 'Media',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export enum Status {
  PENDIENTE = 'PENDIENTE',
  EN_PROGRESO = 'EN_PROGRESO',
  RESUELTO = 'RESUELTO'
}

export interface Incident {
  id: string;
  equipmentName: string;
  model: string;
  serialNumber: string;
  department: string;
  severity: Severity;
  description: string;
  reportedBy: string;
  status: Status;
  date: string;
  aiAnalysis?: {
    urgencyScore: number;
    riskAssessment: string;
    suggestedAction: string;
  };
}

export interface Stats {
  total: number;
  pending: number;
  resolved: number;
  critical: number;
}
