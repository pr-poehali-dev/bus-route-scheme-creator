export interface Stop {
  id: string;
  name: string;
  x: number;
  y: number;
  labelPosition: 'top' | 'bottom' | 'left' | 'right';
}

export interface Route {
  id: string;
  number: string;
  color: string;
  stops: string[];
  lineWidth: number;
  lineStyle: 'solid' | 'dashed';
}

export interface Line {
  id: string;
  routeId: string;
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed';
  offset?: number;
}

export const COLORS = [
  '#0EA5E9',
  '#8B5CF6',
  '#F97316',
  '#10B981',
  '#EC4899',
  '#EAB308',
  '#06B6D4',
  '#F43F5E',
];
