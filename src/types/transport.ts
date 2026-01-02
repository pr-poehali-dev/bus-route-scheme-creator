export interface Stop {
  id: string;
  name: string;
  x: number;
  y: number;
  labelPosition: 'top' | 'bottom' | 'left' | 'right';
  routes: string[];
  isTerminal: boolean;
}

export interface Route {
  id: string;
  number: string;
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed';
  stops: string[];
  path: { x: number; y: number }[];
}

export const COLORS = [
  '#EF4444',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1',
  '#84CC16',
];

export const LINE_WIDTHS = [2, 3, 4, 5, 6, 8];
