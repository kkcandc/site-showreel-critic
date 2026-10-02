import { Composition } from 'remotion';
import { DURATION, FPS, HEIGHT, WIDTH } from '../timing';
import { ArcadeComposition } from './ArcadeComposition';

export function RemotionRoot() {
  return (
    <Composition
      id="ArcadeLabReel"
      component={ArcadeComposition}
      durationInFrames={DURATION * FPS}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
}
