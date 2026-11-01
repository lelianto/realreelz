import {Composition, staticFile} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {Reel} from './Reel';
import content from './content.json';

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={Reel}
      durationInFrames={FPS * 20}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      // The real duration comes from the generated voiceover. If the audio
      // hasn't been generated yet, fall back to 20s so the Studio still opens.
      calculateMetadata={async () => {
        // A template can pin its own length via "durationSec" (e.g. a 3D demo
        // with no voiceover). Otherwise the duration follows the voiceover.
        const fixed = (content as {durationSec?: number}).durationSec;
        if (typeof fixed === 'number') {
          return {durationInFrames: Math.ceil(fixed * FPS)};
        }
        let seconds = 20;
        try {
          seconds = await getAudioDurationInSeconds(staticFile('voiceover.wav'));
        } catch {
          // audio not generated yet — keep the fallback
        }
        return {
          durationInFrames: Math.ceil((seconds + 0.6) * FPS),
        };
      }}
    />
  );
};
