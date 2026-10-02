import { useEffect, useRef, useState } from 'react';
import type { Recipe } from '../critic/loop';
import { HEIGHT, WIDTH } from '../timing';
import { StageFrame } from './StageFrame';

export function FitFrame({
  t,
  recipe,
  maxWidth = 460,
}: {
  t: number;
  recipe: Recipe;
  maxWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = width > 0 ? width / WIDTH : 0;
  return (
    <div ref={ref} style={{ width: '100%', maxWidth, overflow: 'hidden' }}>
      <div style={{ height: HEIGHT * scale, overflow: 'hidden' }}>
        {scale > 0 && (
          <div style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <StageFrame t={t} recipe={recipe} />
          </div>
        )}
      </div>
    </div>
  );
}
