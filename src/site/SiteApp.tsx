import { lazy, Suspense, useState } from 'react';
import { GAMES, PROOF, STUDIO } from '../content';
import { passedRecipe } from '../critic/loop';
import { FitFrame } from '../film/FitFrame';
import { DURATION, FPS, FRAME_COUNT, HEIGHT, WIDTH } from '../timing';
import { CriticStudio } from './CriticStudio';

const ReelPlayer = lazy(() => import('./ReelPlayer').then((mod) => ({ default: mod.ReelPlayer })));

export function SiteApp() {
  const [t, setT] = useState(1);
  const [showPlayer, setShowPlayer] = useState(false);
  const [hasMaster, setHasMaster] = useState(true);

  return (
    <>
      <a className="skip" href="#roster">
        Skip to roster
      </a>
      <div className="page" id="top">
        <header className="top">
          <a className="brand" href="#top">
            <strong>{STUDIO.name}</strong>
            <span>Cabinet {STUDIO.cabinet} · Public</span>
          </a>
          <nav className="nav">
            <a href="#roster">Roster</a>
            <a href="#reel">Reel</a>
            <a href="#critic">Critic</a>
          </nav>
        </header>

        <section className="hero">
          <div>
            <p className="kicker">A fictional studio · twenty seconds</p>
            <h1>Games with the lights still on.</h1>
            <p className="deck">
              Arcade Lab builds short, mean, beautiful games and the cabinets they live in. The reel is a pure
              function of time, cut to a kick grid, and it does not ship until the contact sheet clears an eight.
            </p>
            <div className="hero-actions">
              <a className="btn" href="#reel">
                Play the reel
              </a>
              <a className="btn ghost" href="#critic">
                Open the critic
              </a>
            </div>
            <ul className="facts">
              {PROOF.map((item) => (
                <li key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="frame-card">
            <FitFrame t={t} recipe={passedRecipe} />
            <label className="scrub">
              <span>Seek</span>
              <input
                type="range"
                min={0}
                max={DURATION - 1 / FPS}
                step={1 / FPS}
                value={t}
                onChange={(event) => setT(Number(event.target.value))}
                aria-label="Scrub the showreel frame"
              />
              <span>{t.toFixed(2)}s</span>
            </label>
          </div>
        </section>

        <section className="section" id="roster">
          <p className="kicker">Four on the floor</p>
          <h2>Roster</h2>
          <p className="lede">One idea per cabinet. The reel gives each game its own technique, then gets out of the way.</p>
          <div className="roster">
            {GAMES.map((game) => (
              <a className="game" href="#reel" key={game.code}>
                <em>{game.code}</em>
                <span>
                  <b>{game.title}</b>
                  <p>{game.blurb}</p>
                </span>
                <em>
                  {game.genre} · {game.year}
                </em>
              </a>
            ))}
          </div>
        </section>

        <section className="section" id="reel">
          <p className="kicker">Showreel · {DURATION}.0s · {WIDTH}×{HEIGHT}</p>
          <h2>The twenty seconds.</h2>
          <p className="lede">
            Headless Chrome paints every frame from <code>seek(t)</code>. FFmpeg stitches H.264 at CRF 16. The score is
            synthesized in this repo — kicks on the grid, no stock audio, no paid API.
          </p>
          <div className="reel-grid">
            <div>
              {hasMaster ? (
                <video
                  className="master"
                  src="/arcade-lab-reel.mp4"
                  poster="/poster.png"
                  controls
                  playsInline
                  preload="metadata"
                  onError={() => setHasMaster(false)}
                />
              ) : (
                <FitFrame t={1} recipe={passedRecipe} maxWidth={640} />
              )}
              <button type="button" className="audition" style={{ marginTop: 12 }} onClick={() => setShowPlayer((v) => !v)}>
                {showPlayer ? 'Hide live composition' : 'Scrub the Remotion composition'}
              </button>
              {showPlayer && (
                <div className="player-shell" style={{ marginTop: 12 }}>
                  <Suspense fallback={<p className="lede">Loading the composition…</p>}>
                    <ReelPlayer />
                  </Suspense>
                </div>
              )}
            </div>
            <div>
              <ul className="spec">
                <li>
                  <span>Canvas</span>
                  <b>
                    {WIDTH}×{HEIGHT}
                  </b>
                </li>
                <li>
                  <span>Rate</span>
                  <b>{FPS} fps · {FRAME_COUNT} frames</b>
                </li>
                <li>
                  <span>Grid</span>
                  <b>120 BPM · 40 beats</b>
                </li>
                <li>
                  <span>Picture</span>
                  <b>H.264 · yuv420p · CRF 16</b>
                </li>
                <li>
                  <span>Score</span>
                  <b>Synthesized · −14 LUFS</b>
                </li>
                <li>
                  <span>URL hold</span>
                  <b>{STUDIO.url} · last 3s</b>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="critic">
          <CriticStudio />
        </section>

        <footer className="colophon">
          <p>
            {STUDIO.name} is a fictional studio. Frames, type, and the soundtrack were made in this repository. No paid
            generation APIs.
          </p>
          <p>
            Inspired by the showreel prompt from{' '}
            <a href="https://x.com/byEugenVoyager/status/2104956225846714589">Eugen Voyager</a>.
          </p>
        </footer>
      </div>
    </>
  );
}
