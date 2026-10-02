import { memo, useLayoutEffect, useRef } from 'react';
import type { Recipe } from '../critic/loop';
import { GAMES, PROOF, STUDIO } from '../content';
import { ink, mix } from '../palette';
import { BEAT, SCENES, beatIndex, timecode } from '../timing';
import { drawPlayfield } from './playfield';

type Tones = {
  panel: string;
  hot: string;
  paper: string;
  gold: string;
  accent: string;
};

function tonesFor(recipe: Recipe): Tones {
  return {
    panel: mix('#3a332c', ink.phosphor, recipe.accentMix * recipe.contrast),
    hot: mix(ink.mudHot, ink.coral, recipe.contrast),
    paper: mix(ink.mud, ink.paper, recipe.contrast),
    gold: mix('#6b5638', ink.gold, recipe.contrast),
    accent: mix('#5a5648', ink.phosphor, recipe.accentMix),
  };
}

function overshoot(local: number, distance: number, motion: number) {
  if (local <= 0) return 0;
  const t = local / 0.14;
  if (t >= 1) return 0;
  return Math.sin(t * Math.PI) * distance * 0.16 * (0.35 + motion);
}

function PlayCanvas({
  t,
  motion,
  width,
  height,
}: {
  t: number;
  motion: number;
  width: number;
  height: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawPlayfield(ctx, width, height, t, motion);
  }, [t, motion, width, height]);
  return (
    <canvas ref={ref} width={width} height={height} style={{ display: 'block', width: '100%', height: '100%' }} />
  );
}

function activeScene(t: number, cutOffset: number) {
  const starts = SCENES.map((scene, index) => (index === 0 ? scene.start : scene.start + cutOffset));
  let active = 0;
  for (let i = 0; i < starts.length; i += 1) {
    if (t + 1e-6 >= starts[i]) active = i;
  }
  const scene = SCENES[active];
  const start = starts[active];
  return { scene, local: Math.max(0, t - start) };
}

function HookScene({ t, recipe, tones }: { t: number; recipe: Recipe; tones: Tones }) {
  const { local } = activeScene(t, recipe.cutOffset);
  const size = 148 * recipe.headlineScale;
  const shift = overshoot(local, 220, recipe.motion * recipe.hookPunch);
  const bounce = overshoot(Math.max(0, local - 0.5), 70, recipe.hookPunch);
  const impact = Math.exp(-local * (10 + recipe.hookPunch * 14)) * recipe.hookPunch;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 48,
          top: 132,
          width: 640,
          height: 820,
          background: tones.panel,
        }}
      />
      <div
        className="display"
        style={{
          position: 'absolute',
          left: 78 - shift,
          top: 210,
          fontSize: size,
          lineHeight: 0.78,
          letterSpacing: '-0.045em',
          color: ink.void,
          textShadow: `${impact * 10}px 0 ${ink.coral}, ${-impact * 8}px 0 ${ink.ice}`,
        }}
      >
        Arcade
      </div>
      <div
        className="display"
        style={{
          position: 'absolute',
          left: 560 + shift * 0.35,
          top: 390,
          fontSize: size * 1.12,
          lineHeight: 0.78,
          color: tones.hot,
          letterSpacing: '-0.04em',
        }}
      >
        Lab
      </div>
      <div
        style={{
          position: 'absolute',
          left: 588,
          top: 548 - bounce,
          width: 86,
          height: bounce > 20 ? 70 : 86,
          borderRadius: '50%',
          background: tones.gold,
          border: `6px solid ${ink.void}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 86,
          top: 860,
          width: 520,
          color: ink.void,
          fontSize: 28 * (0.7 + recipe.headlineScale * 0.3),
          fontWeight: 600,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
        }}
      >
        Strange games.
        <br />
        Public cabinet.
      </div>
      <div
        className="display"
        style={{
          position: 'absolute',
          right: 36,
          top: 150,
          fontSize: 42,
          color: tones.paper,
          letterSpacing: '0.08em',
        }}
      >
        01
      </div>
    </>
  );
}

function CabinetScene({ t, recipe, tones }: { t: number; recipe: Recipe; tones: Tones }) {
  const { local } = activeScene(t, recipe.cutOffset);
  const nudge = overshoot(local, 36, recipe.motion);
  const svgW = 500;
  const svgH = Math.round(svgW * (1100 / 640));
  const scale = svgW / 640;
  const screen = {
    x: 118 * scale,
    y: 210 * scale,
    w: 404 * scale,
    h: 470 * scale,
  };
  return (
    <>
      <div style={{ position: 'absolute', left: 72, top: 168, width: 400 }}>
        <div className="display" style={{ fontSize: 22, letterSpacing: '0.16em', color: tones.accent }}>
          Cabinet {STUDIO.cabinet}
        </div>
        <div
          className="display"
          style={{
            marginTop: 16,
            fontSize: 86 * recipe.headlineScale,
            lineHeight: 0.82,
            color: tones.paper,
            transform: `translateX(${-nudge}px)`,
          }}
        >
          Lights
          <br />
          on
        </div>
        <p style={{ margin: '22px 0 0', fontSize: 24, lineHeight: 1.35, color: tones.paper }}>
          Phosphor series. One screen, two buttons, a coin door that still sticks.
        </p>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 40,
          top: 120,
          width: svgW,
          height: svgH,
          transform: `translateX(${nudge}px)`,
        }}
      >
        <svg viewBox="0 0 640 1100" width={svgW} height={svgH}>
          <rect x="70" y="30" width="500" height="980" fill="#241018" stroke={tones.paper} strokeWidth="8" />
          <rect x="108" y="68" width="424" height="110" fill={tones.panel} />
          <text
            x="320"
            y="140"
            textAnchor="middle"
            fill={ink.void}
            fontFamily="Oxanium, sans-serif"
            fontSize="54"
            fontWeight="800"
          >
            ARCADE LAB
          </text>
          <rect x="118" y="210" width="404" height="470" fill="#07060a" />
          <rect x="108" y="710" width="424" height="200" fill="#140910" stroke={tones.gold} strokeWidth="4" />
          <circle cx="230" cy="810" r="36" fill={tones.paper} />
          <circle cx="400" cy="790" r="28" fill={ink.coral} />
          <circle cx="470" cy="850" r="28" fill={tones.accent} />
          <rect x="250" y="940" width="140" height="36" fill={tones.gold} />
        </svg>
        <div style={{ position: 'absolute', left: screen.x, top: screen.y, width: screen.w, height: screen.h }}>
          <PlayCanvas t={t} motion={recipe.motion} width={Math.round(screen.w)} height={Math.round(screen.h)} />
        </div>
      </div>
    </>
  );
}

function RosterScene({ t, recipe, tones }: { t: number; recipe: Recipe; tones: Tones }) {
  const active = beatIndex(t) % GAMES.length;
  return (
    <div style={{ position: 'absolute', left: 64, right: 36, top: 120, bottom: 96, display: 'flex', flexDirection: 'column' }}>
      <div className="display" style={{ fontSize: 22, letterSpacing: '0.16em', color: tones.accent, marginBottom: 16 }}>
        On the glass
      </div>
      {GAMES.map((game, index) => {
        const on = index === active;
        return (
          <div
            key={game.code}
            style={{
              flex: on ? 2.1 : 1,
              display: 'grid',
              gridTemplateColumns: '110px 1fr auto',
              gap: 18,
              alignItems: 'center',
              padding: '0 22px',
              background: on ? tones.panel : 'transparent',
              color: on ? ink.void : tones.paper,
              borderTop: `3px solid ${on ? ink.void : tones.accent}`,
              transform: `translateX(${on ? 0 : 18}px)`,
            }}
          >
            <span className="display" style={{ fontSize: 36 * recipe.headlineScale }}>
              {game.code}
            </span>
            <span className="display" style={{ fontSize: (on ? 58 : 34) * recipe.headlineScale, lineHeight: 0.9 }}>
              {game.title}
            </span>
            <span style={{ fontWeight: 600, fontSize: 22 }}>{game.year}</span>
          </div>
        );
      })}
    </div>
  );
}

function PlayScene({ t, recipe, tones }: { t: number; recipe: Recipe; tones: Tones }) {
  const { local } = activeScene(t, recipe.cutOffset);
  const score = String(Math.min(999999, Math.floor(local * 920 + 1200))).padStart(6, '0');
  const into = (t / BEAT) % 1;
  const pop = into < 0.16 ? Math.sin((into / 0.16) * Math.PI) : 0;
  const showCombo = beatIndex(t) % 4 === 2;
  return (
    <>
      <div style={{ position: 'absolute', left: 48, right: 48, top: 108, bottom: 96 }}>
        <PlayCanvas t={t} motion={recipe.motion} width={984} height={1080} />
      </div>
      <div style={{ position: 'absolute', left: 72, top: 132, color: tones.paper }}>
        <div className="display" style={{ fontSize: 22, letterSpacing: '0.14em', color: tones.accent }}>
          Neon Drift
        </div>
        <div className="display" style={{ fontSize: 84 * recipe.headlineScale, lineHeight: 0.9, marginTop: 8 }}>
          {score}
        </div>
      </div>
      {showCombo && (
        <div
          className="display"
          style={{
            position: 'absolute',
            right: 72,
            bottom: 180,
            fontSize: 72 * recipe.headlineScale,
            color: ink.void,
            background: tones.hot,
            padding: '8px 18px 4px',
            transform: `scale(${1 + pop * 0.08})`,
          }}
        >
          Combo x4
        </div>
      )}
    </>
  );
}

function ProofScene({ t, recipe, tones }: { t: number; recipe: Recipe; tones: Tones }) {
  const { local } = activeScene(t, recipe.cutOffset);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 108,
          height: 18,
          background: `repeating-linear-gradient(-45deg, ${tones.accent} 0 12px, ${ink.void} 12px 24px)`,
        }}
      />
      {PROOF.map((item, index) => {
        const p = local + 1e-6 >= index * BEAT ? 1 : 0;
        return (
          <div
            key={item.label}
            style={{
              position: 'absolute',
              left: 72,
              right: 56,
              top: 200 + index * 310,
              clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              borderBottom: `10px solid ${index === 2 ? tones.hot : tones.accent}`,
              paddingBottom: 8,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 28, letterSpacing: '-0.03em', color: tones.paper }}>
              {item.label}
            </span>
            <span
              className="display"
              style={{ fontSize: 168 * recipe.headlineScale, lineHeight: 0.76, color: tones.paper }}
            >
              {item.value}
            </span>
          </div>
        );
      })}
    </>
  );
}

function EndScene({ t, recipe, tones }: { t: number; recipe: Recipe; tones: Tones }) {
  const { local } = activeScene(t, recipe.cutOffset);
  const urlOn = t + 1e-6 >= recipe.urlStart;
  const size = 92 * recipe.headlineScale;
  const down = Math.floor(t / BEAT) % 2 === 0;
  const shift = overshoot(local, 160, recipe.motion);
  const urlImpact = urlOn ? Math.exp(-(t - recipe.urlStart) * 12) * recipe.hookPunch : 0;
  return (
    <>
      <div
        className="display"
        style={{
          position: 'absolute',
          right: -20,
          bottom: -70,
          fontSize: 420,
          lineHeight: 0.8,
          color: tones.paper,
          opacity: 0.08,
        }}
      >
        04
      </div>
      <div
        className="display"
        style={{
          position: 'absolute',
          left: 64 - shift,
          top: 150,
          width: 860,
          fontSize: 168 * recipe.headlineScale,
          lineHeight: 0.8,
          color: tones.paper,
          letterSpacing: '-0.045em',
        }}
      >
        Play
        <br />
        <span style={{ fontSize: '0.62em' }}>the lab</span>
      </div>
      <div
        className="display"
        style={{
          position: 'absolute',
          left: 64,
          top: 560,
          maxWidth: 900,
          fontSize: urlOn ? size : 40 * recipe.headlineScale,
          lineHeight: 0.9,
          color: urlOn ? ink.void : tones.paper,
          background: urlOn ? tones.accent : 'transparent',
          padding: urlOn ? '12px 18px 8px' : 0,
          letterSpacing: urlOn ? '-0.03em' : '0.08em',
          textShadow: urlOn ? `${urlImpact * 8}px 0 ${ink.coral}` : undefined,
        }}
      >
        {urlOn ? STUDIO.url : 'Signal pending'}
      </div>
      <div
        className="display"
        style={{
          position: 'absolute',
          right: 64,
          bottom: 150,
          width: 300,
          height: 92,
          display: 'grid',
          placeItems: 'center',
          background: down ? tones.hot : 'transparent',
          color: down ? ink.void : tones.paper,
          border: `4px solid ${tones.hot}`,
          transform: `translateY(${down ? 10 : 0}px)`,
          fontSize: 28,
          letterSpacing: '0.08em',
        }}
      >
        Insert coin
      </div>
    </>
  );
}

function SceneBody({ t, recipe, tones }: { t: number; recipe: Recipe; tones: Tones }) {
  const { scene } = activeScene(t, recipe.cutOffset);
  if (scene.id === 'hook') return <HookScene t={t} recipe={recipe} tones={tones} />;
  if (scene.id === 'cabinet') return <CabinetScene t={t} recipe={recipe} tones={tones} />;
  if (scene.id === 'roster') return <RosterScene t={t} recipe={recipe} tones={tones} />;
  if (scene.id === 'play') return <PlayScene t={t} recipe={recipe} tones={tones} />;
  if (scene.id === 'proof') return <ProofScene t={t} recipe={recipe} tones={tones} />;
  return <EndScene t={t} recipe={recipe} tones={tones} />;
}

function Stickers({ clutter, hot }: { clutter: number; hot: string }) {
  if (clutter < 0.15) return null;
  const items = [
    { text: 'WIP', x: 180, y: 180, rot: -8 },
    { text: 'HOT', x: 640, y: 260, rot: 6 },
    { text: 'NEW', x: 420, y: 640, rot: -3 },
    { text: '???', x: 760, y: 780, rot: 4 },
  ];
  return (
    <>
      {items.map((item) => (
        <div
          key={item.text}
          className="display"
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            zIndex: 4,
            background: hot,
            color: ink.void,
            fontSize: 28,
            padding: '4px 8px',
            transform: `rotate(${item.rot}deg)`,
            opacity: 0.35 + clutter * 0.65,
          }}
        >
          {item.text}
        </div>
      ))}
    </>
  );
}

export const StageFrame = memo(function StageFrame({ t, recipe }: { t: number; recipe: Recipe }) {
  const tones = tonesFor(recipe);
  const beat = beatIndex(t) + 1;
  const recOn = Math.floor(t / BEAT) % 2 === 0;
  const { scene } = activeScene(t, recipe.cutOffset);
  return (
    <div className="al-frame" data-scene={scene.id}>
      <SceneBody t={t} recipe={recipe} tones={tones} />
      <div className="al-wash" style={{ opacity: (1 - recipe.contrast) * 0.62 }} />
      <Stickers clutter={recipe.clutter} hot={tones.hot} />
      <div className="al-bars" aria-hidden="true">
        <i style={{ background: ink.phosphor }} />
        <i style={{ background: ink.coral }} />
        <i style={{ background: ink.gold }} />
        <i style={{ background: ink.ice }} />
      </div>
      <div className="al-rail">
        <span>Arcade Lab · Est. 1987</span>
      </div>
      <div className="al-meta">
        <span>{timecode(t)}</span>
        <span>
          {scene.index} {scene.label}
        </span>
        <span>Beat {String(beat).padStart(2, '0')}</span>
        <span className="al-rec" style={{ opacity: recOn ? 1 : 0.25 }}>
          Rec
        </span>
      </div>
      <div className="al-scan" style={{ backgroundPositionY: `${(t * 18) % 4}px` }} />
    </div>
  );
});
