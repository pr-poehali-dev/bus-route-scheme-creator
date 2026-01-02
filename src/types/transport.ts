export interface Stop {
  id: string;
  name: string;
  x: number;
  y: number;
  labelPosition: 'top' | 'bottom' | 'left' | 'right';
  isTerminal: boolean;
}

export interface Route {
  id: string;
  number: string;
  name: string;
  color: string;
  lineWidth: number;
  stops: string[];
  segments: RouteSegment[];
}

export interface RouteSegment {
  from: string;
  to: string;
  points: { x: number; y: number }[];
}

export const COLORS = [
  { name: 'Красная', value: '#DC2626' },
  { name: 'Синяя', value: '#2563EB' },
  { name: 'Зелёная', value: '#16A34A' },
  { name: 'Оранжевая', value: '#EA580C' },
  { name: 'Фиолетовая', value: '#9333EA' },
  { name: 'Розовая', value: '#DB2777' },
  { name: 'Бирюзовая', value: '#0891B2' },
  { name: 'Жёлтая', value: '#CA8A04' },
  { name: 'Индиго', value: '#4F46E5' },
  { name: 'Лаймовая', value: '#65A30D' },
];
