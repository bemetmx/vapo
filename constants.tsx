
import { Severity, Status } from './types';

export const NOMINAL_VALUES = [0, 1, 2, 3, 4, 5];

export const TOLERANCE_RANGES = {
  0: { min: 0, max: 0 },
  1: { min: 0.8, max: 1.2 },
  2: { min: 1.6, max: 2.4 },
  3: { min: 2.4, max: 3.6 },
  4: { min: 3.6, max: 4.8 },
  5: { min: 4.8, max: 6.0 }
};

export const VAPORIZER_MODELS = [
  { name: 'Vapor 2000', defaultFlow: 2.5 },
  { name: 'Sigma Delta', defaultFlow: 2.0 },
  { name: 'V60', defaultFlow: 2.0 },
  { name: 'Vapor 19.1', defaultFlow: 2.5 },
  { name: 'Tec 3', defaultFlow: 5.0 },
  { name: 'Tec 4', defaultFlow: 5.0 },
  { name: 'Tec 5', defaultFlow: 5.0 },
  { name: 'Tec 6 Plus', defaultFlow: 5.0 },
  { name: 'Tec 7', defaultFlow: 5.0 }
];

export const INITIAL_MEASUREMENTS = NOMINAL_VALUES.map(val => ({
  nominal: val,
  mReceived: 0,
  m1: 0,
  m2: 0,
  m3: 0,
  average: 0,
  error: 0,
  stdDev: 0
}));

export const DEPARTMENTS = [
  'UCI Adultos',
  'UCI Neonatal',
  'Quirófanos',
  'Urgencias',
  'Hospitalización',
  'Imágenes Diagnósticas'
];

export const SEVERITY_COLORS = {
  [Severity.LOW]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [Severity.MEDIUM]: 'bg-blue-50 text-blue-700 border-blue-200',
  [Severity.HIGH]: 'bg-orange-50 text-orange-700 border-orange-200',
  [Severity.CRITICAL]: 'bg-red-50 text-red-700 border-red-200',
};

export const STATUS_COLORS = {
  [Status.PENDIENTE]: 'bg-orange-100 text-orange-800',
  [Status.EN_PROGRESO]: 'bg-blue-100 text-blue-800',
  [Status.RESUELTO]: 'bg-emerald-100 text-emerald-800',
};
