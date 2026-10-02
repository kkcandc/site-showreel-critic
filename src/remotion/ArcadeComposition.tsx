import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig } from 'remotion';
import { passedRecipe } from '../critic/loop';
import { StageFrame } from '../film/StageFrame';

export const ArcadeComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: '#12090e' }}>
      <Audio src="/score.wav" />
      <StageFrame t={frame / fps} recipe={passedRecipe} />
    </AbsoluteFill>
  );
};
