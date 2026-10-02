import { ink } from '../palette';
import { expoOut } from '../timing';

const LANES = [-1, 0, 1, 1, 0, -1, 0, 1];

function unit(seed: number) {
  const n = Math.abs(Math.sin(seed * 127.1) * 43758.5453);
  return n - Math.floor(n);
}

export function drawPlayfield(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  motion: number,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1a0c14';
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 9; i += 1) {
    const depth = unit(i + 3);
    const bw = w * (0.05 + unit(i + 9) * 0.07);
    const bh = h * (0.08 + depth * 0.22);
    const drift = ((t * (12 + motion * 30) * (0.3 + depth) + i * 80) % (w + 120)) - 60;
    ctx.fillStyle = i % 2 === 0 ? '#2a121c' : '#341823';
    ctx.fillRect(drift, h * 0.34 - bh, bw, bh);
    ctx.fillStyle = ink.gold;
    ctx.fillRect(drift, h * 0.34 - bh, bw, 4);
  }

  ctx.fillStyle = ink.coral;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.16, Math.min(w, h) * 0.075, 0, Math.PI * 2);
  ctx.fill();

  const horizon = h * 0.4;
  const glow = ctx.createLinearGradient(0, horizon - 40, 0, horizon + 30);
  glow.addColorStop(0, 'rgba(210,255,60,0)');
  glow.addColorStop(1, 'rgba(210,255,60,0.45)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, horizon - 40, w, 70);

  ctx.fillStyle = '#10080e';
  ctx.beginPath();
  ctx.moveTo(w * 0.3, horizon);
  ctx.lineTo(w * 0.7, horizon);
  ctx.lineTo(w * 1.08, h + 2);
  ctx.lineTo(w * -0.08, h + 2);
  ctx.closePath();
  ctx.fill();

  const speed = 220 + motion * 520;
  const scroll = t * speed;
  ctx.strokeStyle = ink.phosphor;
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.beginPath();
  ctx.moveTo(w * 0.3, horizon);
  ctx.lineTo(-w * 0.02, h);
  ctx.moveTo(w * 0.7, horizon);
  ctx.lineTo(w * 1.02, h);
  ctx.stroke();

  for (let i = 0; i < 14; i += 1) {
    const cycle = (i * 70 - (scroll % 70)) / (14 * 70);
    const p = (cycle + 1) % 1;
    const eased = p * p;
    const y = horizon + eased * (h - horizon);
    const half = (0.02 + eased * 0.46) * w;
    const len = Math.max(4, (1 - p) * h * 0.045);
    ctx.strokeStyle = p > 0.92 ? 'transparent' : ink.phosphor;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, y);
    ctx.lineTo(w * 0.5, Math.min(h, y + len));
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - half, y);
    ctx.lineTo(w * 0.5 + half, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const beat = t / 0.5;
  const idx = Math.floor(beat);
  const frac = beat - idx;
  const from = LANES[((idx % LANES.length) + LANES.length) % LANES.length];
  const to = LANES[(((idx + 1) % LANES.length) + LANES.length) % LANES.length];
  const snap = frac < 0.16 ? expoOut(frac / 0.16) : 1;
  const lane = from + (to - from) * snap * (0.35 + motion * 0.65);
  const cx = w * 0.5 + lane * w * 0.14;
  const cy = h * 0.78;
  const s = Math.min(w, h) / 280;

  ctx.fillStyle = ink.paper;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 48 * s);
  ctx.lineTo(cx + 34 * s, cy + 36 * s);
  ctx.lineTo(cx - 34 * s, cy + 36 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = ink.coral;
  ctx.fillRect(cx - 10 * s, cy - 8 * s, 20 * s, 14 * s);
  ctx.fillStyle = ink.void;
  ctx.fillRect(cx - 22 * s, cy + 18 * s, 12 * s, 8 * s);
  ctx.fillRect(cx + 10 * s, cy + 18 * s, 12 * s, 8 * s);
}
