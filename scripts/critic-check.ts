import { CRITERIA, LOCK, TRACE, passedRecipe, roundScore } from '../src/critic/loop.ts';

const last = TRACE[TRACE.length - 1];
let failed = false;

function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed = true;
}

console.log(`passes: ${TRACE.length}`);
for (const pass of TRACE) {
  const scores = CRITERIA.map((id) => `${id.slice(0, 4)} ${roundScore(pass.scores[id]).toFixed(1)}`).join('  ');
  console.log(`#${pass.index} ${pass.passed ? 'PASS' : '....'}  ${scores}`);
}

check('draft fails', TRACE[0] !== undefined && !TRACE[0].passed);
check('final passes', Boolean(last?.passed));
check('three to six passes', TRACE.length >= 3 && TRACE.length <= 6, String(TRACE.length));
for (const id of CRITERIA) {
  check(`${id} >= 8`, (last?.scores[id] ?? 0) >= 8, String(roundScore(last?.scores[id] ?? 0)));
}
check('cuts on the grid', passedRecipe.cutOffset === 0);
check('url hold', passedRecipe.urlStart <= 17.5, String(passedRecipe.urlStart));
check('headline locked', passedRecipe.headlineScale >= 0.95);
check('motion locked', Math.abs(passedRecipe.motion - LOCK.motion) < 0.001);

if (failed) process.exit(1);
