import {Composition, staticFile} from 'remotion';
import {getAudioDurationInSeconds, getVideoMetadata} from '@remotion/media-utils';
import {Reel} from './Reel';
import {ClippedReel} from './ClippedReel';
import {AiReel} from './AiProductivity';
import {YoutubePsychVideo} from './YoutubePsych';
import {CollageStory, type CollageScene} from './Collage';
import {StorycardStory, type StorycardScene, type StorycardTheme} from './Storycard';
import {EsportsStory, type EspScene} from './Esports';
import {LeadStory, leadDurationSec, type LeadBrand, type LeadScene} from './Lead';
import leadContent from './content-lead-demo.json';
import {GridStory, type GridHero, type GridScene} from './Gridstory';
import gridContent from './content-gridstory-kopi.json';
import esportsContent from './content-navi.json';
import content from './content.json';
import collageContent from './content-collage.json';
import storycardContent from './content-storycard.json';
import clippedMetadata from './clipped_metadata.json';

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;
const YT_WIDTH = 1920;
const YT_HEIGHT = 1080;

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
          const isYoutube16x9 =
            (content as {template?: string}).template === 'youtube-psych';
          const dim = isYoutube16x9
            ? {width: YT_WIDTH, height: YT_HEIGHT}
            : {width: WIDTH, height: HEIGHT};

          // A template can pin its own length via "durationSec" (e.g. a 3D demo
          // with no voiceover). Otherwise the duration follows the voiceover.
          const c = content as {durationSec?: number; template?: string; script?: string; leadScenes?: LeadScene[]; gridScenes?: GridScene[]};
          // A silent lead reel is as long as the sum of its scenes' durSec.
          const fixed =
            c.durationSec ??
            (!c.script && c.template === 'lead' ? leadDurationSec(c.leadScenes ?? [])
              : !c.script && c.template === 'gridstory' ? leadDurationSec(c.gridScenes ?? []) : undefined);
          if (typeof fixed === 'number') {
            return {...dim, durationInFrames: Math.ceil(fixed * FPS)};
          }
          let seconds = 20;
          try {
            seconds = await getAudioDurationInSeconds(staticFile('voiceover.wav'));
          } catch {
            // audio not generated yet — keep the fallback
          }
          return {
            ...dim,
            durationInFrames: Math.ceil((seconds + 0.6) * FPS),
          };
        }}
      />
      <Composition
        id="YoutubeLong"
        component={YoutubePsychVideo}
        durationInFrames={24 * 404}
        fps={24}
        width={YT_WIDTH}
        height={YT_HEIGHT}
      />
      <Composition
        id="ClippedReel"
        component={ClippedReel}
        durationInFrames={FPS * 55}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        calculateMetadata={async ({props}) => {
          const durationSec = (clippedMetadata as {durationSec?: number})?.durationSec;
          if (typeof durationSec === 'number') {
            return {durationInFrames: Math.ceil(durationSec * FPS)};
          }
          let frames = FPS * 55;
          try {
            const meta = await getVideoMetadata(
              staticFile((props as {videoSrc?: string})?.videoSrc || 'clipped_video.mp4'),
            );
            if (meta?.durationInSeconds) {
              frames = Math.ceil(meta.durationInSeconds * FPS);
            }
          } catch {
            // fallback
          }
          return {durationInFrames: frames};
        }}
      />
      <Composition
        id="AiReel"
        component={AiReel}
        durationInFrames={FPS * 55}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        calculateMetadata={async () => {
          let seconds = 55;
          try {
            seconds = await getAudioDurationInSeconds(staticFile('voiceover-ai.wav'));
          } catch {
            // fallback
          }
          return {
            durationInFrames: Math.ceil((seconds + 0.6) * FPS),
          };
        }}
      />
      {/* Silent preview of the collage template (no voiceover needed):
          scenes spread evenly so the look is visible in the Studio / stills. */}
      <Composition
        id="CollagePreview"
        component={CollageStory}
        durationInFrames={FPS * 28}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          words: [] as {text: string; fromMs: number; toMs: number}[],
          scenes: (collageContent.collageScenes ?? []) as CollageScene[],
          keywords: (collageContent.keywords ?? []) as string[],
        }}
      />
      {/* Silent preview of the storycard explainer template (no voiceover):
          scenes spread evenly so the CapiMail-style look is visible in Studio. */}
      <Composition
        id="StorycardPreview"
        component={StorycardStory}
        durationInFrames={FPS * 32}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          words: [] as {text: string; fromMs: number; toMs: number}[],
          scenes: (storycardContent.storycardScenes ?? []) as StorycardScene[],
          name: (storycardContent.name ?? 'CATATAN') as string,
          tag: (storycardContent as {tag?: string}).tag,
          keywords: (storycardContent.keywords ?? []) as string[],
          theme: ((storycardContent as {theme?: string}).theme ?? 'dark') as StorycardTheme,
        }}
      />
      {/* Silent preview of the esports match-recap template (no voiceover):
          scenes spread evenly so the hype scoreboard look is visible in Studio. */}
      <Composition
        id="EsportsPreview"
        component={EsportsStory}
        durationInFrames={FPS * 32}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          words: [] as {text: string; fromMs: number; toMs: number}[],
          scenes: (esportsContent.espScenes ?? []) as EspScene[],
          keywords: (esportsContent.keywords ?? []) as string[],
        }}
      />
      {/* Silent preview of the content-lead marketing template (fictional demo):
          length = sum of the scenes' durSec, exactly like the silent story ad. */}
      <Composition
        id="LeadPreview"
        component={LeadStory}
        durationInFrames={Math.ceil((leadDurationSec(leadContent.leadScenes as LeadScene[]) ?? 39) * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          words: [] as {text: string; fromMs: number; toMs: number}[],
          scenes: leadContent.leadScenes as LeadScene[],
          brand: leadContent.brand as LeadBrand,
          target: leadContent.target,
          disclaimer: leadContent.disclaimer,
          accent: leadContent.accent,
        }}
      />
      {/* Silent preview of the gridstory template (general history w/ stickman). */}
      <Composition
        id="GridstoryPreview"
        component={GridStory}
        durationInFrames={Math.ceil((leadDurationSec(gridContent.gridScenes as GridScene[]) ?? 45) * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          words: [] as {text: string; fromMs: number; toMs: number}[],
          scenes: gridContent.gridScenes as GridScene[],
          brand: gridContent.brand as LeadBrand,
          topic: gridContent.topic,
          hero: gridContent.hero as GridHero,
          accent: gridContent.accent,
        }}
      />
      {/* Light-mode preview of the same storycard content. */}
      <Composition
        id="StorycardPreviewLight"
        component={StorycardStory}
        durationInFrames={FPS * 32}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          words: [] as {text: string; fromMs: number; toMs: number}[],
          scenes: (storycardContent.storycardScenes ?? []) as StorycardScene[],
          name: (storycardContent.name ?? 'CATATAN') as string,
          tag: (storycardContent as {tag?: string}).tag,
          keywords: (storycardContent.keywords ?? []) as string[],
          theme: 'light' as StorycardTheme,
        }}
      />
    </>
  );
};

