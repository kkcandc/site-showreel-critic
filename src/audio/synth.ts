const SAMPLE_RATE = 48000;
const DURATION = 20;
const BEAT = 0.5;

export type RenderedScore = {
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
  lufs: number;
  peak: number;
};

function hashNoise(i: number) {
  let x = i | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  x = (x ^ (x >>> 16)) >>> 0;
  return x / 4294967296 * 2 - 1;
}

function biquad(b0: number, b1: number, b2: number, a1: number, a2: number) {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x: number) => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

function kWeightFactory() {
  const shelf = biquad(
    1.53512485958697,
    -2.69169618940638,
    1.19839281085285,
    -1.69065929318241,
    0.73248077421585,
  );
  const highpass = biquad(1, -2, 1, -1.99004745483398, 0.99007225036621);
  return (x: number) => highpass(shelf(x));
}

function integratedLufs(left: Float32Array, right: Float32Array, sampleRate: number) {
  const kwL = kWeightFactory();
  const kwR = kWeightFactory();
  const weightedL = new Float32Array(left.length);
  const weightedR = new Float32Array(right.length);
  for (let i = 0; i < left.length; i += 1) {
    weightedL[i] = kwL(left[i]);
    weightedR[i] = kwR(right[i]);
  }
  const block = Math.round(0.4 * sampleRate);
  const hop = Math.round(0.1 * sampleRate);
  const blocks: number[] = [];
  for (let start = 0; start + block <= left.length; start += hop) {
    let sum = 0;
    for (let i = start; i < start + block; i += 1) {
      sum += weightedL[i] * weightedL[i] + weightedR[i] * weightedR[i];
    }
    blocks.push(sum / block);
  }
  const gated = (floor: number) => blocks.filter((ms) => -0.691 + 10 * Math.log10(ms + 1e-12) >= floor);
  const meanOf = (list: number[]) => list.reduce((a, b) => a + b, 0) / Math.max(1, list.length);
  const absolute = gated(-70);
  const ungated = -0.691 + 10 * Math.log10(meanOf(absolute) + 1e-12);
  const relative = gated(ungated - 10);
  return -0.691 + 10 * Math.log10(meanOf(relative.length ? relative : absolute) + 1e-12);
}

function peakOf(left: Float32Array, right: Float32Array) {
  let peak = 0;
  for (let i = 0; i < left.length; i += 1) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  return peak;
}

function applyGain(left: Float32Array, right: Float32Array, gain: number) {
  for (let i = 0; i < left.length; i += 1) {
    left[i] *= gain;
    right[i] *= gain;
  }
}

function limit(left: Float32Array, right: Float32Array, sampleRate: number, ceiling = 0.98) {
  const release = Math.exp(-1 / (0.04 * sampleRate));
  let gr = 1;
  for (let i = 0; i < left.length; i += 1) {
    const peak = Math.max(Math.abs(left[i]), Math.abs(right[i]), 1e-8);
    const target = peak > ceiling ? ceiling / peak : 1;
    gr = target < gr ? target : target + (gr - target) * release;
    left[i] *= gr;
    right[i] *= gr;
  }
}

const BASS = [38, 41, 43, 46, 50, 46, 43, 41];
const ARP = [74, 77, 81, 77, 72, 77, 69, 74];

function midiHz(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

export function synthesize(): RenderedScore {
  const sampleRate = SAMPLE_RATE;
  const n = sampleRate * DURATION;
  const left = new Float32Array(n);
  const right = new Float32Array(n);
  let hatPrev = 0;
  let hatHp = 0;
  const hatAlpha = 0.82;

  for (let i = 0; i < n; i += 1) {
    const t = i / sampleRate;
    const beatPos = t / BEAT;
    const beatIdx = Math.floor(beatPos + 1e-8);
    const into = t - beatIdx * BEAT;
    const eighthIdx = Math.floor(t / 0.25 + 1e-8);
    const into8 = t - eighthIdx * 0.25;
    const bar = Math.floor(beatIdx / 4);

    const kickEnv = Math.exp(-into * 26);
    const kickFreq = 150 * Math.exp(-into * 22) + 46;
    const kick = Math.sin(2 * Math.PI * kickFreq * into) * kickEnv * (into < 0.4 ? 1 : 0);

    const snareOn = beatIdx % 4 === 1 || beatIdx % 4 === 3;
    const snareEnv = snareOn ? Math.exp(-into * 18) : 0;
    const snareTone = Math.sin(2 * Math.PI * 188 * into) * snareEnv * 0.45;
    const snareNoise = hashNoise(i) * snareEnv * 0.55;

    const hatEnv = Math.exp(-into8 * (eighthIdx % 2 === 0 ? 46 : 70));
    const noise = hashNoise(i + 17);
    hatHp = hatAlpha * (hatHp + noise - hatPrev);
    hatPrev = noise;
    const hat = hatHp * hatEnv * (eighthIdx % 2 === 0 ? 0.16 : 0.07);

    const bassNote = BASS[eighthIdx % BASS.length] + (bar >= 8 ? 12 : 0);
    const bassEnv = Math.exp(-into8 * 8) * (0.55 + 0.45 * (1 - kickEnv));
    const bassHz = midiHz(bassNote - 12);
    const bass =
      (Math.sin(2 * Math.PI * bassHz * t) * 0.7 +
        Math.sign(Math.sin(2 * Math.PI * bassHz * t)) * 0.3) *
      bassEnv *
      0.28;

    let arp = 0;
    if (t >= 6.5 && t < 17.2) {
      const arpNote = ARP[eighthIdx % ARP.length];
      const arpEnv = Math.exp(-into8 * 14);
      const sq = Math.sign(Math.sin(2 * Math.PI * midiHz(arpNote) * t));
      arp = sq * arpEnv * 0.07;
    }

    let stab = 0;
    for (const hit of [0, 3, 6.5, 10, 13.5, 17]) {
      const dt = t - hit;
      if (dt >= 0 && dt < 0.35) {
        const env = Math.exp(-dt * 10);
        const chord =
          Math.sign(Math.sin(2 * Math.PI * midiHz(62) * t)) +
          Math.sign(Math.sin(2 * Math.PI * midiHz(65) * t)) +
          Math.sign(Math.sin(2 * Math.PI * midiHz(69) * t));
        stab += (chord / 3) * env * 0.16;
      }
    }

    let roll = 0;
    if ((t >= 16.5 && t < 17) || (t >= 19.5 && t < 20)) {
      const local = t >= 19.5 ? t - 19.5 : t - 16.5;
      const step = Math.floor(local / 0.0625);
      const intoRoll = local - step * 0.0625;
      roll = hashNoise(i + 99) * Math.exp(-intoRoll * 40) * 0.2;
    }

    const mono = kick * 0.72 + snareTone + snareNoise * 0.8 + bass + stab + roll;
    const side = hat + arp;
    let l = mono + side * 0.35;
    let r = mono + side;
    const drive = 1.35;
    l = Math.tanh(l * drive);
    r = Math.tanh(r * drive);
    left[i] = l * 0.46;
    right[i] = r * 0.46;
  }

  let lufs = integratedLufs(left, right, sampleRate);
  const target = -14;
  applyGain(left, right, 10 ** ((target - lufs) / 20));
  limit(left, right, sampleRate, 0.97);
  lufs = integratedLufs(left, right, sampleRate);
  if (lufs < target - 0.35) {
    applyGain(left, right, 10 ** ((target - lufs) / 20));
    limit(left, right, sampleRate, 0.97);
    lufs = integratedLufs(left, right, sampleRate);
  }

  return { left, right, sampleRate, lufs, peak: peakOf(left, right) };
}
