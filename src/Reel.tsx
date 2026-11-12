import {useEffect, useMemo, useState} from 'react';
import {DEFAULT_HANDLE} from './brand';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {createTikTokStyleCaptions, type Caption} from '@remotion/captions';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import rawContent from './content.json';
import {StickmanStory, type StoryScene} from './Stickman';
import type {Rival, StoryFormat} from './StickFormats';
import {ChronicleStory, type ChronScene} from './Chronicle';
import {CollageStory, type CollageScene} from './Collage';
import {ParableStory, type ParScene} from './Parable';
import {ExplainerStory, type ExplainerScene} from './Explainer';
import {AiProductivityStory, type AiScene} from './AiProductivity';
import {YoutubePsychStory, type YtChapter, type YtScene} from './YoutubePsych';
import {FieldnotesStory, type FieldScene} from './Fieldnotes';
import {StorycardStory, type StorycardScene, type StorycardTheme} from './Storycard';
import {EsportsStory, type EspScene} from './Esports';
import {LeadStory, type LeadBrand, type LeadScene} from './Lead';

type Scene = {
  type: 'intro' | 'tip' | 'outro';
  fromSec: number;
  kicker?: string;
  heading?: string;
  sub?: string;
  n?: number;
  icon?: string;
  title?: string;
  stat?: number;
  statUnit?: string;
  note?: string;
  color?: string;
};

type PlanetLabel = {
  text: string;
  detail?: string;
  cue?: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
};

type Content = {
  template?: string;
  title?: string;
  kicker?: string;
  subtitle?: string;
  script?: string;
  accent?: string;
  music?: string;
  musicVolume?: number;
  durationSec?: number;
  scenes?: Scene[];
  highlights?: string[];
  // planet template
  planetColor?: string;
  landColor?: string;
  atmosphere?: string;
  statsCue?: string;
  labels?: PlanetLabel[];
  stats?: {value: string; unit: string}[];
  // stickman template
  name?: string;
  keywords?: string[];
  storyScenes?: StoryScene[];
  captionFixes?: Record<string, string>;
  // chronicle template (sepia history)
  chronScenes?: ChronScene[];
  // collage template (torn-paper scrapbook geopolitics)
  collageScenes?: CollageScene[];
  // fieldnotes template (editorial "special edition" clipping)
  masthead?: string;
  edition?: string;
  dateTag?: string;
  fieldScenes?: FieldScene[];
  // parable template (cold allegory / Konoha)
  parableScenes?: ParScene[];
  // explainer template (modern vector explainer)
  explainerScenes?: ExplainerScene[];
  // ai-productivity template (AI productivity & side job motion graphics)
  watermark?: string;
  aiScenes?: AiScene[];
  // youtube-psych template (16:9 long-form documentary on psychology, fallacy & history)
  channelName?: string;
  chapters?: YtChapter[];
  ytScenes?: YtScene[];
  // storycard template (editorial explainer in the CapiMail story look)
  tag?: string;
  theme?: StorycardTheme; // 'dark' (default) | 'light'
  storycardScenes?: StorycardScene[];
  // esports template (MLBB/MPL match-recap hype scoreboard)
  espScenes?: EspScene[];
  // lead template (content-lead marketing walkthrough: hook -> steps -> cta)
  brand?: LeadBrand;
  target?: string;
  disclaimer?: string;
  leadScenes?: LeadScene[];
};

const content = rawContent as unknown as Content;
const ACCENT = content.accent ?? '#8f7bff';
const scenes = content.scenes ?? [];
type Page = ReturnType<typeof createTikTokStyleCaptions>['pages'][number];
type Word = {text: string; fromMs: number; toMs: number};

// ----------------------------------------------------------------------------
// Persistent brand watermark (constant opacity on every frame, all templates)
// ----------------------------------------------------------------------------
const Watermark: React.FC = () => {
  if (
    content.template === 'ai' ||
    content.template === 'ai-productivity' ||
    content.template === 'youtube-psych' ||
    content.template === 'storycard' ||
    content.template === 'esports' ||
    content.template === 'lead'
  ) {
    return null; // Custom HUD / badge rendered inside template
  }
  // stickman duel scoreboard / mundur year rail occupy the top band
  const fmt = (content as {format?: string}).format;
  const top = content.template === 'stickman' && (fmt === 'duel' || fmt === 'mundur') ? 236 : 84;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top,
          right: 46,
          padding: '9px 20px',
          borderRadius: 999,
          background: 'rgba(15,15,22,0.5)',
          color: 'rgba(255,255,255,0.92)',
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontWeight: 900,
          fontSize: 30,
          letterSpacing: 0.5,
          textShadow: '0 2px 10px rgba(0,0,0,0.55)',
        }}
      >
        {content.watermark ?? DEFAULT_HANDLE}
      </div>
    </AbsoluteFill>
  );
};

// ----------------------------------------------------------------------------
// Template dispatcher
// ----------------------------------------------------------------------------
export const Reel: React.FC = () => {
  const inner =
    content.template === 'youtube-psych' ? (
      <YoutubePsychReel />
    ) : content.template === 'ai' || content.template === 'ai-productivity' ? (
      <AiProductivityReel />
    ) : content.template === 'explainer' ? (
      <ExplainerReel />
    ) : content.template === 'storycard' ? (
      <StorycardReel />
    ) : content.template === 'stickman' ? (
      <StickmanReel />
    ) : content.template === 'chronicle' ? (
      <ChronicleReel />
    ) : content.template === 'esports' ? (
      <EsportsReel />
    ) : content.template === 'lead' ? (
      <LeadReel />
    ) : content.template === 'collage' ? (
      <CollageReel />
    ) : content.template === 'parable' ? (
      <ParableReel />
    ) : content.template === 'planet' ? (
      <PlanetReel />
    ) : content.template === 'fieldnotes' ? (
      <FieldnotesReel />
    ) : content.template === 'reflective' ? (
      <ReflectiveReel />
    ) : (
      <TipsReel />
    );
  return (
    <>
      {inner}
      <Watermark />
    </>
  );
};

// ----------------------------------------------------------------------------
// Shared: audio (voiceover + optional music with fade), caption loading
// ----------------------------------------------------------------------------
const MusicTrack: React.FC = () => {
  const {durationInFrames} = useVideoConfig();
  const vol = content.musicVolume ?? 0.14;
  if (!content.music) return null;
  return (
    <Audio
      src={staticFile(content.music)}
      loop
      volume={(f) =>
        interpolate(
          f,
          [0, 18, durationInFrames - 25, durationInFrames],
          [0, vol, vol, 0],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        )
      }
    />
  );
};

const SharedAudio: React.FC = () => {
  return (
    <>
      <Audio src={staticFile('voiceover.wav')} />
      <MusicTrack />
    </>
  );
};

const tokensToWords = (tokens: Word[]): Word[] => {
  const words: Word[] = [];
  for (const t of tokens) {
    const startsNewWord = words.length === 0 || t.text.startsWith(' ');
    if (startsNewWord) {
      words.push({text: t.text.trimStart(), fromMs: t.fromMs, toMs: t.toMs});
    } else {
      const w = words[words.length - 1];
      w.text += t.text;
      w.toMs = t.toMs;
    }
  }
  return words;
};

const useCaptions = () => {
  const [data, setData] = useState<{pages: Page[]; words: Word[]} | null>(null);
  const [handle] = useState(() => delayRender('captions'));
  useEffect(() => {
    fetch(staticFile('captions.json'))
      .then((r) => (r.ok ? r.json() : []))
      .then((caps: Caption[]) => {
        const safe = caps ?? [];
        const {pages} = createTikTokStyleCaptions({
          captions: safe,
          combineTokensWithinMilliseconds: 1000,
        });
        const words = tokensToWords(
          safe.map((c) => ({text: c.text, fromMs: c.startMs, toMs: c.endMs})),
        );
        setData({pages, words});
        continueRender(handle);
      })
      .catch(() => {
        setData({pages: [], words: []});
        continueRender(handle);
      });
  }, [handle]);
  return data;
};

// ============================================================================
// FIELDNOTES template — editorial "special edition" clipping (Catatan style)
// ============================================================================
const FieldnotesReel: React.FC = () => {
  const data = useCaptions();
  const words = useMemo(() => {
    const fixes = content.captionFixes ?? {};
    return (data?.words ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [data]);
  return (
    <AbsoluteFill style={{background: '#1c1915'}}>
      <SharedAudio />
      {words.length ? (
        <FieldnotesStory
          words={words}
          scenes={(content.fieldScenes as FieldScene[]) ?? []}
          masthead={content.masthead ?? 'CATATAN'}
          edition={content.edition ?? 'EDISI KHUSUS'}
          dateTag={content.dateTag}
          keywords={content.keywords ?? []}
          accent={content.accent ?? '#b23a2e'}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================
// YOUTUBE PSYCHOLOGY, FALLACY & HISTORY (16:9 Long-Form Documentary)
// ============================================================================
const YoutubePsychReel: React.FC = () => {
  const data = useCaptions();
  const words = useMemo(() => {
    const fixes = content.captionFixes ?? {};
    return (data?.words ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [data]);
  return (
    <AbsoluteFill style={{background: '#070a12'}}>
      <SharedAudio />
      {words.length ? (
        <YoutubePsychStory
          words={words}
          scenes={(content.ytScenes as YtScene[]) ?? []}
          chapters={(content.chapters as YtChapter[]) ?? []}
          title={content.title}
          watermark={content.watermark ?? DEFAULT_HANDLE}
          channelName={content.channelName ?? 'LOGIKA & PIKIRAN'}
          keywords={content.keywords ?? []}
          accent={content.accent ?? '#e5b84b'}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================
// AI PRODUCTIVITY & SIDE JOB template — Motion Graphics
// ============================================================================
const AiProductivityReel: React.FC = () => {
  const data = useCaptions();
  const words = useMemo(() => {
    const fixes = content.captionFixes ?? {};
    return (data?.words ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [data]);
  return (
    <AbsoluteFill style={{background: '#050811'}}>
      <SharedAudio />
      {words.length ? (
        <AiProductivityStory
          words={words}
          scenes={(content.aiScenes as AiScene[]) ?? []}
          name={content.name ?? 'AI × SIDE JOB'}
          watermark={content.watermark ?? DEFAULT_HANDLE}
          keywords={content.keywords ?? []}
          accent={content.accent ?? '#00f2fe'}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================
// EXPLAINER template — Modern Vector Explainer (Kurzgesagt/Vox style)
// ============================================================================
const ExplainerReel: React.FC = () => {
  const data = useCaptions();
  const words = useMemo(() => {
    const fixes = content.captionFixes ?? {};
    return (data?.words ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [data]);
  return (
    <AbsoluteFill style={{background: '#080c16'}}>
      <SharedAudio />
      {words.length ? (
        <ExplainerStory
          words={words}
          scenes={
            (content.explainerScenes as ExplainerScene[]) ??
            (content.storyScenes as unknown as ExplainerScene[]) ??
            []
          }
          name={content.name ?? ''}
          keywords={content.keywords ?? []}
          accent={content.accent ?? '#ffd23f'}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================
// STORYCARD template — editorial explainer in the CapiMail story look
// ============================================================================
const StorycardReel: React.FC = () => {
  const data = useCaptions();
  const words = useMemo(() => {
    const fixes = content.captionFixes ?? {};
    return (data?.words ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [data]);
  return (
    <AbsoluteFill style={{background: content.theme === 'light' ? '#F3ECE0' : '#0E1714'}}>
      <SharedAudio />
      {words.length ? (
        <StorycardStory
          words={words}
          scenes={(content.storycardScenes as StorycardScene[]) ?? []}
          name={content.name ?? 'CATATAN'}
          tag={content.tag}
          keywords={content.keywords ?? []}
          theme={content.theme}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================
// STICKMAN template — flat 2D story, scenes cut on narration cue words
// ============================================================================
const StickmanReel: React.FC = () => {
  const data = useCaptions();
  const words = useMemo(() => {
    const fixes = content.captionFixes ?? {};
    return (data?.words ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [data]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <SharedAudio />
      {words.length ? (
        <StickmanStory
          words={words}
          scenes={content.storyScenes ?? []}
          name={content.name ?? ''}
          keywords={content.keywords ?? []}
          accent={content.accent ?? '#ffd23f'}
          hue={(content as {hue?: number}).hue ?? 0}
          baseHair={(content as {hair?: string}).hair}
          baseMoustache={(content as {moustache?: boolean}).moustache}
          format={(content as {format?: StoryFormat}).format}
          rival={(content as {rival?: Rival}).rival}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================
// CHRONICLE template — cinematic sepia history/philosophy, SVG scenes on cues
// ============================================================================
const ChronicleReel: React.FC = () => {
  const data = useCaptions();
  const words = useMemo(() => {
    const fixes = content.captionFixes ?? {};
    return (data?.words ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [data]);
  return (
    <AbsoluteFill style={{background: '#160d05'}}>
      <SharedAudio />
      {words.length ? (
        <ChronicleStory
          words={words}
          scenes={content.chronScenes ?? []}
          keywords={content.keywords ?? []}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================
// ESPORTS template — MLBB/MPL match-recap hype scoreboard, SVG scenes on cues
// ============================================================================
// ============================================================================
// LEAD template — content-lead marketing walkthrough (product demo story).
// Silent by default (per-scene durSec, music only); with a `script` it plays
// the voiceover and cuts scenes on cue words.
// ============================================================================
const LeadReel: React.FC = () => {
  const narrated = Boolean(content.script);
  const data = useCaptions();
  const words = useMemo(() => {
    if (!narrated) return [];
    const fixes = content.captionFixes ?? {};
    return (data?.words ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [data, narrated]);
  return (
    <AbsoluteFill style={{background: '#E9EEF2'}}>
      {narrated ? <SharedAudio /> : <MusicTrack />}
      <LeadStory
        words={words}
        scenes={content.leadScenes ?? []}
        brand={content.brand ?? {name: content.name ?? 'brand'}}
        target={content.target}
        disclaimer={content.disclaimer}
        keywords={content.keywords ?? []}
        accent={content.accent}
      />
    </AbsoluteFill>
  );
};

const EsportsReel: React.FC = () => {
  const data = useCaptions();
  const words = useMemo(() => {
    const fixes = content.captionFixes ?? {};
    return (data?.words ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [data]);
  return (
    <AbsoluteFill style={{background: '#070a14'}}>
      <SharedAudio />
      {words.length ? (
        <EsportsStory
          words={words}
          scenes={content.espScenes ?? []}
          keywords={content.keywords ?? []}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================
// COLLAGE template — torn-paper scrapbook geopolitics, SVG scenes on cues
// ============================================================================
const CollageReel: React.FC = () => {
  const data = useCaptions();
  const words = useMemo(() => {
    const fixes = content.captionFixes ?? {};
    return (data?.words ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [data]);
  return (
    <AbsoluteFill style={{background: '#2a1d10'}}>
      <SharedAudio />
      <CollageStory
        words={words}
        scenes={content.collageScenes ?? []}
        keywords={content.keywords ?? []}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// PARABLE template — cold allegory (Negeri Konoha), SVG power imagery on cues
// ============================================================================
const ParableReel: React.FC = () => {
  const data = useCaptions();
  const words = useMemo(() => {
    const fixes = content.captionFixes ?? {};
    return (data?.words ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [data]);
  return (
    <AbsoluteFill style={{background: '#04070b'}}>
      <SharedAudio />
      {words.length ? (
        <ParableStory
          words={words}
          scenes={content.parableScenes ?? []}
          keywords={content.keywords ?? []}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// ============================================================================
// REFLECTIVE template — spoken reflection, warm & calm, emphasized key quotes
// ============================================================================
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const findHighlightWindow = (words: Word[], quote: string) => {
  const q = normalize(quote).split(' ').filter(Boolean);
  if (q.length < 2) return null;
  const w = words.map((x) => normalize(x.text).replace(/\s+/g, ''));
  const head = q.slice(0, 3).join(' ');
  const tail = q[q.length - 1];
  for (let i = 0; i < w.length; i++) {
    if (w.slice(i, i + 3).join(' ') === head) {
      const maxLen = q.length + 8;
      for (let j = i + q.length - 1; j < Math.min(w.length, i + maxLen); j++) {
        if (w[j] === tail) return {fromMs: words[i].fromMs, toMs: words[j].toMs};
      }
      const end = Math.min(i + q.length - 1, w.length - 1);
      return {fromMs: words[i].fromMs, toMs: words[end].toMs};
    }
  }
  return null;
};

const ReflectiveReel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const data = useCaptions();
  const timeMs = (frame / fps) * 1000;

  const highlights = useMemo(() => {
    if (!data) return [];
    return (content.highlights ?? [])
      .map((quote) => ({quote, win: findHighlightWindow(data.words, quote)}))
      .filter((h): h is {quote: string; win: {fromMs: number; toMs: number}} =>
        Boolean(h.win),
      );
  }, [data]);

  const activeHl = highlights.find(
    (h) => timeMs >= h.win.fromMs && timeMs < h.win.toMs,
  );

  const drift = Math.sin(frame / 90) * 20;
  const fadeIn = interpolate(frame, [0, 14], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [1, 0],
    {extrapolateLeft: 'clamp'},
  );

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(170deg, #241a12 0%, #140f14 55%, #0b0910 100%)',
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: 'white',
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      <SharedAudio />

      {/* warm light from above */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 45% at 50% ${18 + drift / 8}%, ${ACCENT}33, transparent 72%)`,
        }}
      />
      {/* soft drifting motes */}
      {[...Array(6)].map((_, i) => {
        const t = frame / 120 + i;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 173) % 100}%`,
              top: `${20 + ((i * 37) % 60) + Math.sin(t) * 4}%`,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: ACCENT,
              opacity: 0.12 + 0.08 * Math.sin(t * 1.3),
              filter: 'blur(2px)',
            }}
          />
        );
      })}

      {/* kicker */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 8,
          color: ACCENT,
          opacity: 0.8,
        }}
      >
        {content.kicker}
      </div>

      {/* center stage */}
      <AbsoluteFill
        style={{justifyContent: 'center', alignItems: 'center', padding: '0 110px'}}
      >
        {!data ? null : activeHl ? (
          <QuoteCard quote={activeHl.quote} win={activeHl.win} timeMs={timeMs} />
        ) : (
          <RunningCaption pages={data.pages} timeMs={timeMs} />
        )}
      </AbsoluteFill>

      {/* thin progress */}
      <div
        style={{
          position: 'absolute',
          bottom: 110,
          left: 150,
          right: 150,
          height: 3,
          background: 'rgba(255,255,255,0.12)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(frame / durationInFrames) * 100}%`,
            background: ACCENT,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const RunningCaption: React.FC<{pages: Page[]; timeMs: number}> = ({
  pages,
  timeMs,
}) => {
  const page = pages.find((p, i) => {
    const next = pages[i + 1]?.startMs ?? Infinity;
    return timeMs >= p.startMs && timeMs < next;
  });
  if (!page) return null;
  const words = tokensToWords(page.tokens);
  return (
    <div
      style={{
        textAlign: 'center',
        lineHeight: 1.35,
        fontSize: 62,
        fontWeight: 600,
      }}
    >
      {words.map((word, i) => {
        const active = timeMs >= word.fromMs && timeMs < word.toMs;
        return (
          <span
            key={i}
            style={{
              color: active ? '#ffffff' : 'rgba(255,255,255,0.5)',
              textShadow: active
                ? `0 0 34px ${ACCENT}, 0 4px 20px rgba(0,0,0,0.6)`
                : '0 4px 18px rgba(0,0,0,0.5)',
            }}
          >
            {word.text}{' '}
          </span>
        );
      })}
    </div>
  );
};

const QuoteCard: React.FC<{
  quote: string;
  win: {fromMs: number; toMs: number};
  timeMs: number;
}> = ({quote, win, timeMs}) => {
  const p = interpolate(timeMs, [win.fromMs, win.fromMs + 450], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const out = interpolate(timeMs, [win.toMs - 300, win.toMs], [1, 0.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        textAlign: 'center',
        transform: `scale(${interpolate(p, [0, 1], [0.94, 1])})`,
        opacity: p * out,
      }}
    >
      <div
        style={{
          fontSize: 150,
          lineHeight: 0.4,
          color: ACCENT,
          fontWeight: 700,
          marginBottom: 20,
        }}
      >
        &ldquo;
      </div>
      <div
        style={{
          fontSize: 70,
          fontWeight: 700,
          lineHeight: 1.3,
          fontStyle: 'italic',
          textShadow: `0 0 40px ${ACCENT}55, 0 6px 22px rgba(0,0,0,0.7)`,
        }}
      >
        {quote}
      </div>
    </div>
  );
};

// ============================================================================
// TIPS template — listicle with infographic cards
// ============================================================================
const TipsReel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const ranges = scenes.map((s, i) => {
    const from = Math.round(s.fromSec * fps);
    const to = scenes[i + 1]
      ? Math.round(scenes[i + 1].fromSec * fps)
      : durationInFrames;
    return {from, duration: to - from};
  });

  const activeTip = scenes
    .filter((s) => s.type === 'tip')
    .filter((s) => frame >= s.fromSec * fps).length;

  const hue = interpolate(frame, [0, durationInFrames], [255, 290]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 45% 12%), hsl(${
          hue + 30
        } 50% 6%))`,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: 'white',
        overflow: 'hidden',
      }}
    >
      <SharedAudio />

      {scenes.map((scene, i) => (
        <Sequence key={i} from={ranges[i].from} durationInFrames={ranges[i].duration}>
          <SceneWrapper durationInFrames={ranges[i].duration} color={scene.color}>
            {scene.type === 'intro' ? (
              <IntroScene scene={scene} />
            ) : scene.type === 'tip' ? (
              <TipScene scene={scene} />
            ) : (
              <OutroScene scene={scene} />
            )}
          </SceneWrapper>
        </Sequence>
      ))}

      <StepDots total={3} active={activeTip} />
      <Captions />

      <div
        style={{
          position: 'absolute',
          bottom: 90,
          left: 90,
          right: 90,
          height: 8,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.14)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(frame / durationInFrames) * 100}%`,
            background: `linear-gradient(90deg, ${ACCENT}, #ffffff)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const SceneWrapper: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  color?: string;
}> = ({children, durationInFrames, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 200}, durationInFrames: 16});
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(enter, exit);
  const translateY = interpolate(enter, [0, 1], [50, 0]);
  const scale = interpolate(enter, [0, 1], [0.9, 1]);
  return (
    <AbsoluteFill style={{opacity}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 40% at 50% 38%, ${color ?? ACCENT}33, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `translateY(${translateY}px) scale(${scale})`,
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 90px',
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Counter: React.FC<{to: number; delay?: number}> = ({to, delay = 8}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - delay, fps, config: {damping: 200}, durationInFrames: 26});
  return <>{Math.round(interpolate(p, [0, 1], [0, to]))}</>;
};

const Pill: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => (
  <div
    style={{
      padding: '14px 34px',
      borderRadius: 100,
      background: `${color ?? ACCENT}22`,
      border: `2px solid ${color ?? ACCENT}`,
      color: color ?? ACCENT,
      fontSize: 34,
      fontWeight: 800,
      letterSpacing: 3,
    }}
  >
    {children}
  </div>
);

const IntroScene: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const big = spring({frame: frame - 6, fps, config: {damping: 12, mass: 0.8}});
  return (
    <div style={{textAlign: 'center', display: 'grid', gap: 40, justifyItems: 'center'}}>
      <Pill>{scene.kicker}</Pill>
      <div
        style={{
          fontSize: 300,
          fontWeight: 900,
          lineHeight: 0.9,
          transform: `scale(${interpolate(big, [0, 1], [0.3, 1])})`,
          textShadow: `0 0 60px ${ACCENT}`,
        }}
      >
        3
      </div>
      <div style={{fontSize: 92, fontWeight: 900, letterSpacing: -3}}>{scene.heading}</div>
      <div style={{fontSize: 44, opacity: 0.7, fontWeight: 600}}>{scene.sub}</div>
    </div>
  );
};

const TipScene: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame: frame - 4, fps, config: {damping: 11, mass: 0.7}});
  const float = Math.sin(frame / 14) * 10;
  const color = scene.color ?? ACCENT;
  return (
    <div style={{textAlign: 'center', display: 'grid', gap: 34, justifyItems: 'center'}}>
      <Pill color={color}>TIPS 0{scene.n}</Pill>
      <div
        style={{
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `${color}1f`,
          border: `3px solid ${color}66`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${interpolate(pop, [0, 1], [0.2, 1])}) translateY(${float}px)`,
        }}
      >
        <span style={{fontSize: 150}}>{scene.icon}</span>
      </div>
      <div style={{fontSize: 80, fontWeight: 900, letterSpacing: -2}}>{scene.title}</div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
        <span style={{fontSize: 130, fontWeight: 900, color}}>
          <Counter to={scene.stat ?? 0} />
        </span>
        <span style={{fontSize: 52, fontWeight: 700, opacity: 0.85}}>{scene.statUnit}</span>
      </div>
      <div style={{fontSize: 40, opacity: 0.6, fontWeight: 600}}>{scene.note}</div>
    </div>
  );
};

const OutroScene: React.FC<{scene: Scene}> = ({scene}) => {
  const color = scene.color ?? ACCENT;
  return (
    <div style={{textAlign: 'center', display: 'grid', gap: 36, justifyItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
        <span style={{fontSize: 260, fontWeight: 900, color, textShadow: `0 0 60px ${color}`}}>
          <Counter to={scene.stat ?? 7} />
        </span>
        <span style={{fontSize: 70, fontWeight: 800, opacity: 0.9}}>{scene.statUnit}</span>
      </div>
      <div style={{fontSize: 86, fontWeight: 900, letterSpacing: -3}}>{scene.heading}</div>
      <div style={{fontSize: 48, opacity: 0.75, fontWeight: 600}}>{scene.sub}</div>
      <div
        style={{
          marginTop: 20,
          padding: '20px 44px',
          borderRadius: 100,
          background: ACCENT,
          color: '#1a1140',
          fontSize: 40,
          fontWeight: 800,
        }}
      >
        Simpan & coba besok 👆
      </div>
    </div>
  );
};

const StepDots: React.FC<{total: number; active: number}> = ({total, active}) => (
  <div
    style={{
      position: 'absolute',
      top: 80,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      gap: 16,
    }}
  >
    {Array.from({length: total}).map((_, i) => (
      <div
        key={i}
        style={{
          width: i < active ? 54 : 28,
          height: 12,
          borderRadius: 6,
          background: i < active ? ACCENT : 'rgba(255,255,255,0.25)',
        }}
      />
    ))}
  </div>
);

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [pages, setPages] = useState<Page[] | null>(null);
  const [handle] = useState(() => delayRender('captions-tips'));
  useEffect(() => {
    fetch(staticFile('captions.json'))
      .then((res) => (res.ok ? res.json() : []))
      .then((captions: Caption[]) => {
        const {pages} = createTikTokStyleCaptions({
          captions: captions ?? [],
          combineTokensWithinMilliseconds: 1000,
        });
        setPages(pages);
        continueRender(handle);
      })
      .catch(() => {
        setPages([]);
        continueRender(handle);
      });
  }, [handle]);
  if (!pages) return null;
  const timeMs = (frame / fps) * 1000;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 180,
        left: 70,
        right: 70,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {pages.map((page, i) => {
        const nextStart = pages[i + 1]?.startMs ?? Infinity;
        if (timeMs < page.startMs || timeMs >= nextStart) return null;
        const words = tokensToWords(page.tokens);
        return (
          <div
            key={i}
            style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 14px'}}
          >
            {words.map((word, j) => {
              const active = timeMs >= word.fromMs && timeMs < word.toMs;
              return (
                <span
                  key={j}
                  style={{
                    fontSize: 54,
                    fontWeight: 800,
                    letterSpacing: -1,
                    padding: active ? '2px 12px' : '2px 0',
                    borderRadius: 10,
                    color: active ? '#1a1140' : 'rgba(255,255,255,0.9)',
                    background: active ? ACCENT : 'transparent',
                    textShadow: active ? 'none' : '0 3px 12px rgba(0,0,0,0.6)',
                  }}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// PLANET template — Three.js 3D planet + animated camera, SVG diagram overlay
// (2D labels/leader-lines/text stay as crisp SVG+HTML — sharper & simpler than
//  Skia here, and they composite perfectly over the WebGL canvas.)
// ============================================================================
const seededRandom = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const makePlanetTexture = (ocean: string, land: string) => {
  const h = 512;
  const c = document.createElement('canvas');
  c.width = h * 2;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, c.width, c.height);
  const rnd = seededRandom(20240531);
  // continents as blobby clusters
  for (let i = 0; i < 46; i++) {
    const cx = rnd() * c.width;
    const cy = rnd() * c.height * 0.78 + c.height * 0.11;
    const base = 18 + rnd() * 72;
    const shade = 0.75 + rnd() * 0.5;
    ctx.fillStyle = land;
    ctx.globalAlpha = Math.min(1, shade);
    ctx.beginPath();
    let first = true;
    for (let a = 0; a < Math.PI * 2; a += 0.35) {
      const rr = base * (0.55 + rnd() * 0.85);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr * 0.8;
      if (first) {
        ctx.moveTo(x, y);
        first = false;
      } else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // polar ice caps
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillRect(0, 0, c.width, h * 0.07);
  ctx.fillRect(0, h * 0.93, c.width, h * 0.07);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

// first spoken moment (ms) of a cue word in the transcript, else null
const findWordStartMs = (words: Word[], cue: string) => {
  const c = normalize(cue);
  for (const w of words) {
    if (normalize(w.text).includes(c)) return w.fromMs;
  }
  return null;
};

const PlanetScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;

  const tex = useMemo(
    () => makePlanetTexture(content.planetColor ?? '#1f5fa0', content.landColor ?? '#3d8f5a'),
    [],
  );
  const stars = useMemo(() => {
    const n = 1400;
    const pos = new Float32Array(n * 3);
    const rnd = seededRandom(7);
    for (let i = 0; i < n; i++) {
      const r = 14 + rnd() * 20;
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  // intro dolly + slow orbit for a real parallax "camera" feel
  const intro = spring({frame, fps, config: {damping: 200}, durationInFrames: 45});
  const groupZ = interpolate(intro, [0, 1], [-5.5, 0]);
  const groupScale = interpolate(intro, [0, 1], [0.6, 1]);
  const orbitY = interpolate(frame, [0, durationInFrames], [-0.45, 0.45]);
  const spin = t * 0.22;
  const atmo = content.atmosphere ?? content.accent ?? '#6ec8ff';
  const accent = content.accent ?? '#6ec8ff';

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[9, 6, 8]} intensity={160} color="#fff4e2" decay={2} />
      <pointLight position={[-8, -3, -6]} intensity={30} color={atmo} decay={2} />
      <points geometry={stars}>
        <pointsMaterial size={0.07} color="#ffffff" sizeAttenuation transparent opacity={0.85} />
      </points>
      <group position={[0, 0.3, groupZ]} rotation={[0.18, orbitY, 0]} scale={groupScale}>
        {/* planet */}
        <mesh rotation={[0, spin, 0]}>
          <sphereGeometry args={[1.5, 72, 72]} />
          <meshStandardMaterial map={tex} roughness={0.88} metalness={0.04} />
        </mesh>
        {/* atmosphere halo */}
        <mesh>
          <sphereGeometry args={[1.62, 64, 64]} />
          <meshBasicMaterial
            color={atmo}
            transparent
            opacity={0.14}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* orbital plane: ring + moon share one tilt */}
        <group rotation={[1.0, 0, 0]}>
          <mesh>
            <torusGeometry args={[2.55, 0.01, 10, 160]} />
            <meshBasicMaterial color={accent} transparent opacity={0.45} />
          </mesh>
          <group rotation={[0, 0, t * 0.7]}>
            <mesh position={[2.55, 0, 0]}>
              <sphereGeometry args={[0.17, 32, 32]} />
              <meshStandardMaterial color="#cdd2d8" roughness={1} metalness={0} />
            </mesh>
          </group>
        </group>
      </group>
    </>
  );
};

const PlanetOverlay: React.FC<{cueFrames: number[]; statsCueFrame: number}> = ({
  cueFrames,
  statsCueFrame,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const accent = content.accent ?? '#6ec8ff';
  const labels = content.labels ?? [];
  const stats = content.stats ?? [];
  const titleIn = spring({frame: frame - 14, fps, config: {damping: 200}, durationInFrames: 22});

  return (
    <AbsoluteFill style={{fontFamily: 'Inter, -apple-system, sans-serif', color: 'white'}}>
      {/* leader lines + anchor dots (vector-crisp SVG) */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{position: 'absolute', inset: 0}}
      >
        {labels.map((l, i) => {
          const p = spring({frame: frame - cueFrames[i], fps, config: {damping: 200}, durationInFrames: 18});
          const ex = interpolate(p, [0, 1], [l.tx, l.x]);
          const ey = interpolate(p, [0, 1], [l.ty, l.y]);
          return (
            <g key={i} opacity={p}>
              <line x1={l.tx} y1={l.ty} x2={ex} y2={ey} stroke={accent} strokeWidth={2.5} strokeOpacity={0.55} />
              <circle cx={l.tx} cy={l.ty} r={7} fill={accent} />
              <circle cx={l.tx} cy={l.ty} r={14} fill="none" stroke={accent} strokeWidth={2} opacity={0.4} />
            </g>
          );
        })}
      </svg>

      {/* label text boxes */}
      {labels.map((l, i) => {
        const p = spring({frame: frame - cueFrames[i] - 6, fps, config: {damping: 200}, durationInFrames: 18});
        const right = l.x < width / 2;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: l.x,
              top: l.y,
              transform: `translate(${right ? '-100%' : '0'}, -50%) translateY(${interpolate(p, [0, 1], [12, 0])}px)`,
              textAlign: right ? 'right' : 'left',
              opacity: p,
              padding: '10px 18px',
              borderRadius: 14,
              background: 'rgba(8,12,20,0.88)',
              border: `1.5px solid ${accent}66`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: -0.5,
                textShadow: '0 2px 6px rgba(0,0,0,0.6)',
              }}
            >
              {l.text}
            </div>
            {l.detail ? (
              <div style={{fontSize: 24, fontWeight: 600, opacity: 0.85, color: accent}}>{l.detail}</div>
            ) : null}
          </div>
        );
      })}

      {/* kicker */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: 10,
          color: accent,
          opacity: 0.85,
        }}
      >
        {content.kicker}
      </div>

      {/* title + subtitle */}
      <div
        style={{
          position: 'absolute',
          top: 180,
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: `translateY(${interpolate(titleIn, [0, 1], [24, 0])}px)`,
          opacity: titleIn,
        }}
      >
        <div style={{fontSize: 120, fontWeight: 900, letterSpacing: -4, textShadow: `0 0 50px ${accent}66`}}>
          {content.title}
        </div>
        {content.subtitle ? (
          <div style={{fontSize: 38, fontWeight: 600, opacity: 0.75, marginTop: 4}}>{content.subtitle}</div>
        ) : null}
      </div>

      {/* stat chips */}
      {stats.length ? (
        <div
          style={{
            position: 'absolute',
            bottom: 150,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          {stats.map((s, i) => {
            const p = spring({frame: frame - statsCueFrame - i * 10, fps, config: {damping: 200}, durationInFrames: 18});
            return (
              <div
                key={i}
                style={{
                  opacity: p,
                  transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`,
                  padding: '18px 30px',
                  borderRadius: 20,
                  background: 'rgba(8,12,20,0.85)',
                  border: `1.5px solid ${accent}44`,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  textAlign: 'center',
                }}
              >
                <div style={{fontSize: 52, fontWeight: 900, color: accent}}>{s.value}</div>
                <div style={{fontSize: 24, fontWeight: 600, opacity: 0.7}}>{s.unit}</div>
              </div>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const PlanetReel: React.FC = () => {
  const {width, height, durationInFrames, fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const data = useCaptions();
  const labels = content.labels ?? [];

  // Reveal each label the moment its cue word is spoken; if narration/captions
  // aren't there, fall back to a gentle staggered entrance.
  const cueFrames = useMemo(() => {
    return labels.map((l, i) => {
      if (data && l.cue) {
        const ms = findWordStartMs(data.words, l.cue);
        if (ms != null) return Math.max(10, Math.round((ms / 1000) * fps));
      }
      return 34 + i * 12;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, fps]);

  const statsCueFrame = useMemo(() => {
    if (data && content.statsCue) {
      const ms = findWordStartMs(data.words, content.statsCue);
      if (ms != null) return Math.round((ms / 1000) * fps);
    }
    return 60;
  }, [data, fps]);

  // whether a real narration track is present (so we add the voiceover)
  const hasNarration = Boolean(content.script);

  const fade = Math.min(
    interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'}),
    interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'}),
  );
  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(60% 50% at 50% 42%, #10192e 0%, #070912 70%, #03040a 100%)',
        opacity: fade,
      }}
    >
      {hasNarration ? <SharedAudio /> : <MusicTrack />}
      <AbsoluteFill>
        <ThreeCanvas
          width={width}
          height={height}
          camera={{fov: 42, position: [0, 0.6, 7], near: 0.1, far: 80}}
          style={{position: 'absolute', inset: 0}}
        >
          <PlanetScene />
        </ThreeCanvas>
      </AbsoluteFill>
      <PlanetOverlay cueFrames={cueFrames} statsCueFrame={statsCueFrame} />
    </AbsoluteFill>
  );
};
