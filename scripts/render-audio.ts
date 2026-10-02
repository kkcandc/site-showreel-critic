import { mkdirSync, writeFileSync } from 'node:fs';
import { synthesize, type RenderedScore } from '../src/audio/synth.ts';

function encodeWav(rendered: RenderedScore) {
  const { left, right, sampleRate } = rendered;
  const channels = 2;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = left.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < left.length; i += 1) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7fff, true);
    view.setInt16(offset + 2, r < 0 ? r * 0x8000 : r * 0x7fff, true);
    offset += 4;
  }
  return Buffer.from(buffer);
}

const rendered = synthesize();
mkdirSync('public', { recursive: true });
writeFileSync('public/score.wav', encodeWav(rendered));
console.log(
  JSON.stringify(
    {
      lufs: Number(rendered.lufs.toFixed(2)),
      peak: Number(rendered.peak.toFixed(3)),
      seconds: rendered.left.length / rendered.sampleRate,
    },
    null,
    2,
  ),
);

if (rendered.lufs < -15.5 || rendered.lufs > -12.5 || rendered.peak > 0.999) {
  console.error('Score is outside the −14 LUFS / peak target.');
  process.exit(1);
}
