export const FPS = 30;
export const DURATION = 20;
export const WIDTH = 1080;
export const HEIGHT = 1350;
export const BPM = 120;
export const BEAT = 60 / BPM;

export const FRAME_COUNT = FPS * DURATION;
export const BEAT_COUNT = Math.round(DURATION / BEAT);

export const SCENES = [
  { id: 'hook', index: '01', label: 'Hook', start: 0, end: 3 },
  { id: 'cabinet', index: '02', label: 'Cabinet', start: 3, end: 6.5 },
  { id: 'roster', index: '03', label: 'Roster', start: 6.5, end: 10 },
  { id: 'play', index: '04', label: 'Play', start: 10, end: 13.5 },
  { id: 'proof', index: '05', label: 'Proof', start: 13.5, end: 17 },
  { id: 'end', index: '06', label: 'Lockup', start: 17, end: 20 },
] as const;

export type SceneId = (typeof SCENES)[number]['id'];

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function expoOut(t: number) {
  const x = clamp(t, 0, 1);
  return x >= 1 ? 1 : 1 - 2 ** (-10 * x);
}

export function slam(t: number, duration: number) {
  if (t <= 0) return 0;
  return expoOut(t / duration);
}

export function timecode(t: number) {
  const frame = Math.max(0, Math.floor(t * FPS + 1e-6));
  const ff = frame % FPS;
  const totalSeconds = Math.floor(frame / FPS);
  const ss = totalSeconds % 60;
  const mm = Math.floor(totalSeconds / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(mm)}:${pad(ss)}:${pad(ff)}`;
}

export function beatIndex(t: number) {
  return Math.max(0, Math.min(BEAT_COUNT - 1, Math.floor(t / BEAT + 1e-6)));
}
