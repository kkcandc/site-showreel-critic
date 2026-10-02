import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { passedRecipe } from '../critic/loop';
import { StageFrame } from '../film/StageFrame';

export function StagePage() {
  const initial = Number(new URLSearchParams(window.location.search).get('t') ?? '0');
  const [t, setT] = useState(Number.isFinite(initial) ? initial : 0);

  useEffect(() => {
    window.seek = (next: number) => {
      flushSync(() => setT(next));
    };
    return () => {
      delete window.seek;
    };
  }, []);

  return <StageFrame t={t} recipe={passedRecipe} />;
}
