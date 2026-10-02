import { clamp } from './timing';

export const ink = {
  void: '#12090e',
  slab: '#1b1016',
  phosphor: '#d2ff3c',
  coral: '#ff3b30',
  gold: '#ffbf47',
  paper: '#f3ecdf',
  ice: '#9fd0ff',
  mud: '#5c5148',
  mudHot: '#6a4038',
} as const;

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function mix(a: string, b: string, t: number) {
  const u = clamp(t, 0, 1);
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const c = pa.map((channel, i) => Math.round(channel + (pb[i] - channel) * u));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
