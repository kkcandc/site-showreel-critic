import { clamp } from '../timing';

export const CRITERIA = [
  'hook',
  'readability',
  'motion',
  'variety',
  'brand',
  'sync',
] as const;

export type Criterion = (typeof CRITERIA)[number];

export type Scores = Record<Criterion, number>;

export type Recipe = {
  headlineScale: number;
  contrast: number;
  cutOffset: number;
  motion: number;
  clutter: number;
  urlStart: number;
  accentMix: number;
  hookPunch: number;
};

export const LOCK: Recipe = {
  headlineScale: 1,
  contrast: 1,
  cutOffset: 0,
  motion: 0.94,
  clutter: 0,
  urlStart: 17,
  accentMix: 1,
  hookPunch: 1,
};

export const DRAFT: Recipe = {
  headlineScale: 0.44,
  contrast: 0.32,
  cutOffset: 0.22,
  motion: 0.16,
  clutter: 0.86,
  urlStart: 19.25,
  accentMix: 0.12,
  hookPunch: 0.12,
};

const LABELS: Record<Criterion, string> = {
  hook: 'Hook',
  readability: 'Phone readability',
  motion: 'Motion',
  variety: 'Variety',
  brand: 'Brand',
  sync: 'Sound sync',
};

export function criterionLabel(id: Criterion) {
  return LABELS[id];
}

function ramp(value: number, bad: number, good: number) {
  if (good === bad) return value >= good ? 10 : 1;
  const t = clamp((value - bad) / (good - bad), 0, 1);
  return 1 + t * 9;
}

export function measurements(recipe: Recipe) {
  const headlinePx = Math.round(156 * recipe.headlineScale);
  const urlHold = 20 - recipe.urlStart;
  const cutMs = Math.round(recipe.cutOffset * 1000);
  return { headlinePx, urlHold, cutMs };
}

export function scoreRecipe(recipe: Recipe): Scores {
  const { headlinePx, urlHold } = measurements(recipe);
  const readability =
    ramp(headlinePx, 62, 150) * 0.46 +
    ramp(recipe.contrast, 0.28, 0.96) * 0.32 +
    ramp(1 - recipe.clutter, 0.08, 0.92) * 0.22;
  const hook =
    ramp(recipe.hookPunch, 0.08, 0.96) * 0.62 +
    ramp(recipe.headlineScale, 0.4, 0.98) * 0.28 +
    ramp(recipe.motion, 0.1, 0.9) * 0.1;
  const motion = ramp(recipe.motion, 0.12, 0.92);
  const variety =
    ramp(1 - recipe.clutter, 0.05, 0.9) * 0.78 +
    ramp(recipe.motion, 0.15, 0.85) * 0.22;
  const brand =
    ramp(recipe.accentMix, 0.08, 0.95) * 0.42 +
    ramp(urlHold, 0.4, 2.7) * 0.58;
  const sync = ramp(0.24 - recipe.cutOffset, 0, 0.24);
  return { hook, readability, motion, variety, brand, sync };
}

export function worstCriteria(scores: Scores, count = 3): Criterion[] {
  return [...CRITERIA].sort((a, b) => scores[a] - scores[b] || a.localeCompare(b)).slice(0, count);
}

function toward(current: number, target: number, delta: number) {
  if (current < target) return Math.min(target, current + delta);
  if (current > target) return Math.max(target, current - delta);
  return current;
}

const FIX_COPY: Record<Criterion, string> = {
  hook: 'Hardened the opening slam so beat 1 hits with a full wordmark.',
  readability: 'Raised type, cleaned contrast, and stripped sticker clutter.',
  motion: 'Lengthened travels so cuts cross the frame instead of nudging.',
  variety: 'Cleared overlapping stickers so the six scenes can read apart.',
  brand: 'Locked phosphor and held arcadelab.gg for the final three seconds.',
  sync: 'Pulled scene cuts onto the 120 BPM kick grid.',
};

function applyFix(recipe: Recipe, criterion: Criterion): Recipe {
  const next = { ...recipe };
  if (criterion === 'hook') {
    next.hookPunch = toward(next.hookPunch, LOCK.hookPunch, 0.46);
    next.headlineScale = toward(next.headlineScale, LOCK.headlineScale, 0.18);
  } else if (criterion === 'readability') {
    next.headlineScale = toward(next.headlineScale, LOCK.headlineScale, 0.24);
    next.contrast = toward(next.contrast, LOCK.contrast, 0.28);
    next.clutter = toward(next.clutter, LOCK.clutter, 0.36);
  } else if (criterion === 'motion') {
    next.motion = toward(next.motion, LOCK.motion, 0.32);
  } else if (criterion === 'variety') {
    next.clutter = toward(next.clutter, LOCK.clutter, 0.42);
    next.motion = toward(next.motion, LOCK.motion, 0.16);
  } else if (criterion === 'brand') {
    next.accentMix = toward(next.accentMix, LOCK.accentMix, 0.46);
    next.urlStart = toward(next.urlStart, LOCK.urlStart, 1.2);
  } else {
    next.cutOffset = toward(next.cutOffset, LOCK.cutOffset, 0.12);
  }
  return next;
}

export type Iteration = {
  index: number;
  recipe: Recipe;
  scores: Scores;
  worst: Criterion[];
  notes: string[];
  applied: string[];
  passed: boolean;
};

function notesFor(recipe: Recipe, scores: Scores, worst: Criterion[]) {
  const { headlinePx, urlHold, cutMs } = measurements(recipe);
  const detail: Record<Criterion, string> = {
    hook: `Opening punch is ${recipe.hookPunch.toFixed(2)}. The first beat still drifts.`,
    readability: `Headline is ${headlinePx}px on a 1350px frame, contrast ${recipe.contrast.toFixed(2)}, clutter ${recipe.clutter.toFixed(2)}.`,
    motion: `Travel amplitude is ${recipe.motion.toFixed(2)}. Hits should cross the frame.`,
    variety: `Sticker clutter is ${recipe.clutter.toFixed(2)}, burying six otherwise distinct scenes.`,
    brand: `URL hold is ${urlHold.toFixed(1)}s and accent mix is ${recipe.accentMix.toFixed(2)}. The brief wants 2s+ in phosphor.`,
    sync: `Cuts sit ${cutMs}ms off the kick. The grid is every 500ms.`,
  };
  return worst.filter((id) => scores[id] < 8).map((id) => detail[id]);
}

export function runCritic(start: Recipe = DRAFT): Iteration[] {
  const trace: Iteration[] = [];
  let recipe = { ...start };
  let applied: string[] = [];
  for (let index = 0; index < 8; index += 1) {
    const scores = scoreRecipe(recipe);
    const worst = worstCriteria(scores);
    const passed = CRITERIA.every((id) => scores[id] >= 8);
    trace.push({
      index,
      recipe,
      scores,
      worst: passed ? [] : worst,
      notes: passed ? ['Every mark cleared 8. The sheet can ship.'] : notesFor(recipe, scores, worst),
      applied,
      passed,
    });
    if (passed) break;
    const fixing = worst.slice(0, 3);
    applied = fixing.map((id) => FIX_COPY[id]);
    for (const id of fixing) recipe = applyFix(recipe, id);
  }
  return trace;
}

export const TRACE = runCritic();

export const passedRecipe = TRACE[TRACE.length - 1]?.recipe ?? LOCK;

export function roundScore(value: number) {
  return Math.round(value * 10) / 10;
}
