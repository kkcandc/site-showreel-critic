import { Player } from '@remotion/player';
import { ArcadeComposition } from '../remotion/ArcadeComposition';
import { FPS, FRAME_COUNT, HEIGHT, WIDTH } from '../timing';

export function ReelPlayer() {
  return (
    <Player
      component={ArcadeComposition}
      durationInFrames={FRAME_COUNT}
      fps={FPS}
      compositionWidth={WIDTH}
      compositionHeight={HEIGHT}
      controls
      style={{ width: '100%' }}
      acknowledgeRemotionLicense
    />
  );
}
