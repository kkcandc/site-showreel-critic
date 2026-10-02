import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CRITERIA,
  TRACE,
  criterionLabel,
  roundScore,
  type Criterion,
} from '../critic/loop';
import { StageFrame } from '../film/StageFrame';
import { BEAT, BEAT_COUNT, WIDTH } from '../timing';

const THUMB = 132;
const SCALE = THUMB / WIDTH;

function passes(value: number) {
  return value >= 8;
}

export function CriticStudio() {
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const [step, setStep] = useState(reduced ? TRACE.length - 1 : 0);
  const [running, setRunning] = useState(!reduced);
  const [playhead, setPlayhead] = useState(-1);
  const [audioReady, setAudioReady] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const current = TRACE[Math.min(step, TRACE.length - 1)];

  useEffect(() => {
    if (!running || current.passed) return undefined;
    const timer = window.setTimeout(() => setStep((value) => Math.min(value + 1, TRACE.length - 1)), 1200);
    return () => window.clearTimeout(timer);
  }, [running, current.passed, step]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    const onTime = () => setPlayhead(Math.floor(audio.currentTime / BEAT));
    const onEnd = () => setPlayhead(-1);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('pause', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('pause', onEnd);
    };
  }, []);

  const run = () => {
    setStep(0);
    setRunning(true);
  };

  const audition = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }
    try {
      await audio.play();
    } catch {
      setAudioReady(false);
    }
  };

  return (
    <div>
      <div className="critic-head">
        <div>
          <p className="kicker">Contact sheet · one frame per beat</p>
          <h2>Score it until it clears.</h2>
        </div>
        {current.passed && <div className="stamp">All marks ≥ 8</div>}
      </div>
      <p className="lede">
        Pass {current.index + 1} of {TRACE.length}. The critic measures type size, contrast, travel, clutter,
        URL hold, and cut-to-kick error. It rewrites the three worst marks, then prints the sheet again.
      </p>
      <div className="sheet-scroll">
        <div className="sheet" role="img" aria-label="Contact sheet, one frame for each beat">
          {Array.from({ length: BEAT_COUNT }, (_, index) => {
            const t = index * BEAT;
            return (
              <div key={index} className={index === playhead ? 'thumb is-current' : 'thumb'}>
                <div style={{ width: 1080, height: 1350, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
                  <StageFrame t={t} recipe={current.recipe} />
                </div>
                <span className="thumb-index">{String(index + 1).padStart(2, '0')}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="meters">
        {CRITERIA.map((id: Criterion) => {
          const value = current.scores[id];
          const fixing = current.worst.includes(id);
          return (
            <div key={id} className={fixing ? 'meter fixing' : 'meter'}>
              <span>{criterionLabel(id)}</span>
              <div
                className="track"
                role="meter"
                aria-valuemin={1}
                aria-valuemax={10}
                aria-valuenow={roundScore(value)}
                aria-label={criterionLabel(id)}
              >
                <i className={passes(value) ? 'pass' : undefined} style={{ width: `${(value / 10) * 100}%` }} />
              </div>
              <b>{roundScore(value).toFixed(1)}</b>
            </div>
          );
        })}
      </div>
      {current.applied.length > 0 && <p className="applied">Just fixed: {current.applied.join(' ')}</p>}
      <ul className="notes" aria-live="polite">
        {current.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <div className="stepper">
        <button type="button" onClick={run}>
          {running && !current.passed ? 'Running' : 'Run the critic'}
        </button>
        <button type="button" onClick={() => { setRunning(false); setStep((value) => Math.max(0, value - 1)); }}>
          Prev
        </button>
        <button
          type="button"
          onClick={() => { setRunning(false); setStep((value) => Math.min(TRACE.length - 1, value + 1)); }}
        >
          Next
        </button>
        <button type="button" className="audition" onClick={audition} disabled={!audioReady}>
          Audition the score
        </button>
        <span>
          {current.passed ? 'Cleared' : `Fixing ${current.worst.length} marks`}
        </span>
      </div>
      <audio ref={audioRef} src="/score.wav" preload="none" onError={() => setAudioReady(false)} />
    </div>
  );
}
