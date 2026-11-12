// "Gridstory" template: general storytelling (history, inventions, science,
// "kenapa begini?") in the SAME look as the `lead` template: light dotted-grid
// stage, JetBrains Mono headlines, Inter body, one warm accent, brand header +
// chapter progress bar. A stickman host lives on a ground line in the lower
// half and acts out each beat (waves, points, walks the timeline, gets a
// lightbulb, gasps at a number), talking whenever the narration is speaking.
//
// Scene kinds (each = one text card on top + a stickman pose below):
//   title · year · fact · timeline · idea · compare · stat · quote · outro
// Cue-driven when narrated (same first-substring cue rule as the other
// templates); per-scene `durSec` or an even spread when silent.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Actor, Bulb, GProp} from './Stickman';
import {
  AccentCtx,
  Badge,
  C,
  Header,
  Heading,
  MONO,
  PAD,
  Progress,
  SANS,
  Subtitle,
  buildTimeline,
  clamp,
  reveal,
  useAccent,
  useLeadFonts,
  type LeadBrand,
  type LeadWord,
} from './Lead';

export type GridLook = 'neutral' | 'happy' | 'sad' | 'shock' | 'angry';

export type GridHero = {
  char?: string; // stickman (default) or frog/sheep/ant/wolf/fox/mouse/lion
  hair?: string;
  coat?: string;
  moustache?: boolean;
  old?: boolean;
  bowTie?: boolean;
};

export type GridScene = {
  kind: 'title' | 'year' | 'fact' | 'timeline' | 'idea' | 'compare' | 'stat' | 'quote' | 'outro';
  cue?: string | null;
  durSec?: number;
  kicker?: string; // small mono line above the heading, e.g. "Batavia · VOC"
  heading?: string;
  accentWord?: string;
  sub?: string;
  // title
  tags?: string[];
  // year
  year?: number;
  place?: string;
  // fact
  text?: string;
  bubble?: string; // short speech bubble from the stickman (any kind)
  // timeline
  events?: {year: string; text: string}[];
  // idea: rows default to Masalah / Ide / Hasil
  rows?: {label: string; text: string}[];
  // compare
  left?: {title: string; points: string[]};
  right?: {title: string; points: string[]};
  // stat
  value?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  // quote
  quote?: string;
  author?: string;
  // outro
  button?: string;
  // stage
  prop?: 'bulb' | 'book' | 'gear' | 'flask' | 'scope' | 'dish';
  look?: GridLook;
  actor?: GridHero; // per-scene override of the hero's outfit
};

export type GridProps = {
  words: LeadWord[];
  scenes: GridScene[];
  brand: LeadBrand;
  topic?: string; // line under the chapter progress bar
  hero?: GridHero;
  keywords?: string[];
  accent?: string;
};

const GROUND = 1290;
const S = 0.55; // stickman scale
const HEAD_TOP = GROUND - 600 * S;
const TOP = 470; // where the scene's text column starts
const CONTENT_KINDS = new Set(['year', 'fact', 'timeline', 'idea', 'compare', 'stat', 'quote']);

// ============================================================================
// Text cards (top half)
// ============================================================================
const cardStyle: React.CSSProperties = {
  background: C.card,
  border: `3px solid ${C.ink}`,
  borderRadius: 20,
};

const Kicker: React.FC<{text?: string; t: number}> = ({text, t}) =>
  text ? (
    <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, color: C.muted, marginBottom: 22, ...reveal(t, 0)}}>{text}</div>
  ) : null;

const SceneHeading: React.FC<{s: GridScene; localF: number; size?: number}> = ({s, localF, size = 64}) => {
  const {fps} = useVideoConfig();
  const v = spring({frame: localF, fps, config: {damping: 18}});
  if (!s.heading) return null;
  return (
    <div style={{opacity: v, transform: `translateY(${(1 - v) * 26}px)`, marginBottom: 32}}>
      <Heading text={s.heading} accentWord={s.accentWord} size={size} />
    </div>
  );
};

const YearCard: React.FC<{s: GridScene; t: number}> = ({s, t}) => {
  const accent = useAccent();
  const year = s.year ?? 0;
  const shown = Math.round(interpolate(t, [0.04, 0.35], [year - 60, year], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)}));
  return (
    <div style={{background: C.codeBg, borderRadius: 24, padding: '30px 36px', ...reveal(t, 0.02)}}>
      <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 168, lineHeight: 1, letterSpacing: -6, color: accent}}>{shown}</div>
      {s.place ? (
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, ...reveal(t, 0.35)}}>
          <svg width="30" height="30" viewBox="0 0 24 24">
            <path d="M12 22 C12 22 4 14 4 9 a8 8 0 0 1 16 0 c0 5 -8 13 -8 13 Z" fill={accent} />
            <circle cx="12" cy="9" r="3" fill={C.codeBg} />
          </svg>
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 34, color: C.codeText}}>{s.place}</span>
        </div>
      ) : null}
    </div>
  );
};

const FactCard: React.FC<{s: GridScene; t: number}> = ({s, t}) => {
  const accent = useAccent();
  if (!s.text) return null;
  return (
    <div style={{...cardStyle, display: 'flex', overflow: 'hidden', ...reveal(t, 0.06)}}>
      <div style={{width: 14, background: accent, flex: '0 0 auto'}} />
      <p style={{margin: 0, padding: '28px 30px', fontFamily: SANS, fontWeight: 500, fontSize: 36, lineHeight: 1.4, color: C.ink}}>
        {s.text}
      </p>
    </div>
  );
};

const TimelineCard: React.FC<{s: GridScene; t: number}> = ({s, t}) => {
  const accent = useAccent();
  const ev = s.events ?? [];
  return (
    <div style={{...cardStyle, padding: '20px 30px'}}>
      {ev.map((e, i) => {
        const at = 0.06 + (i / Math.max(1, ev.length)) * 0.6;
        const v = interpolate(t, [at, at + 0.06], [0, 1], clamp);
        const last = i === ev.length - 1;
        return (
          <div key={i} style={{display: 'flex', gap: 22, alignItems: 'flex-start', padding: '12px 0', opacity: v, transform: `translateX(${(1 - v) * -20}px)`}}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10}}>
              <span style={{width: 18, height: 18, borderRadius: 9, background: last ? accent : C.ink}} />
            </div>
            <span style={{fontFamily: MONO, fontWeight: 800, fontSize: 32, color: C.ink, minWidth: 96}}>{e.year}</span>
            <span style={{fontFamily: SANS, fontWeight: 500, fontSize: 31, lineHeight: 1.3, color: C.body}}>{e.text}</span>
          </div>
        );
      })}
    </div>
  );
};

const IdeaCard: React.FC<{s: GridScene; t: number}> = ({s, t}) => {
  const rows = s.rows ?? [];
  const tones = [
    {bg: C.pendBg, fg: C.pendText},
    {bg: C.infoBg, fg: C.infoText},
    {bg: C.good, fg: '#fff'},
  ];
  return (
    <div style={{...cardStyle, overflow: 'hidden'}}>
      {rows.map((r, i) => {
        const at = 0.1 + (i / Math.max(1, rows.length)) * 0.55;
        const v = interpolate(t, [at, at + 0.06], [0, 1], clamp);
        const tone = tones[Math.min(i, tones.length - 1)];
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, padding: '24px 28px', borderTop: i ? `2px solid ${C.line}` : 'none', opacity: v}}>
            <span style={{flex: '0 0 150px'}}>
              <Badge text={r.label} bg={tone.bg} color={tone.fg} />
            </span>
            <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 31, lineHeight: 1.3, color: C.ink}}>{r.text}</span>
          </div>
        );
      })}
    </div>
  );
};

const CompareCard: React.FC<{s: GridScene; t: number}> = ({s, t}) => {
  const accent = useAccent();
  const side = (d: {title: string; points: string[]} | undefined, dark: boolean, at: number) =>
    d ? (
      <div
        style={{
          flex: 1,
          borderRadius: 20,
          padding: '24px 24px',
          background: dark ? C.codeBg : C.card,
          border: `3px solid ${C.ink}`,
          ...reveal(t, at),
        }}
      >
        <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 36, color: dark ? accent : C.ink, marginBottom: 14}}>{d.title}</div>
        {d.points.map((p, i) => (
          <div key={i} style={{fontFamily: SANS, fontWeight: 500, fontSize: 28, lineHeight: 1.3, color: dark ? C.codeText : C.body, padding: '6px 0'}}>
            {p}
          </div>
        ))}
      </div>
    ) : null;
  return (
    <div style={{display: 'flex', gap: 20, alignItems: 'stretch'}}>
      {side(s.left, false, 0.06)}
      {side(s.right, true, 0.32)}
    </div>
  );
};

const StatCard: React.FC<{s: GridScene; t: number}> = ({s, t}) => {
  const accent = useAccent();
  const value = s.value ?? 0;
  const fmt = (v: number) => (Number.isInteger(value) ? Math.round(v).toLocaleString('id-ID') : v.toFixed(1));
  const v = interpolate(t, [0.06, 0.45], [0, value], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const finalText = `${s.prefix ?? ''}${fmt(value)}${s.suffix ?? ''}`;
  const size = Math.min(150, Math.floor(820 / (finalText.length * 0.6)));
  return (
    <div style={{background: C.codeBg, borderRadius: 24, padding: '34px 36px', ...reveal(t, 0.02)}}>
      <div style={{fontFamily: MONO, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: -2, color: accent, whiteSpace: 'nowrap'}}>
        {s.prefix ?? ''}
        {fmt(v)}
        {s.suffix ?? ''}
      </div>
      {s.label ? (
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 32, lineHeight: 1.3, color: C.codeText, marginTop: 16, ...reveal(t, 0.42)}}>{s.label}</div>
      ) : null}
    </div>
  );
};

const QuoteCard: React.FC<{s: GridScene; t: number}> = ({s, t}) => {
  const accent = useAccent();
  return (
    <div style={{background: C.codeBg, borderRadius: 24, padding: '20px 36px 32px', ...reveal(t, 0.04)}}>
      <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 120, lineHeight: 0.9, color: accent, height: 70}}>“</div>
      <p style={{margin: 0, fontFamily: SANS, fontWeight: 600, fontSize: 38, lineHeight: 1.35, color: '#fff'}}>{s.quote}</p>
      {s.author ? (
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 28, color: accent, marginTop: 20, ...reveal(t, 0.3)}}>{s.author}</div>
      ) : null}
    </div>
  );
};

const TitleText: React.FC<{s: GridScene; t: number; localF: number}> = ({s, t, localF}) => (
  <>
    {s.tags?.length ? (
      <div style={{display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 36}}>
        {s.tags.map((tg, i) => (
          <span
            key={tg}
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 27,
              color: '#fff',
              background: C.ink,
              padding: '10px 18px',
              borderRadius: 10,
              opacity: interpolate(localF, [i * 6, i * 6 + 10], [0, 1], clamp),
            }}
          >
            {tg}
          </span>
        ))}
      </div>
    ) : null}
    <SceneHeading s={s} localF={localF} size={92} />
    {s.sub ? <p style={{margin: 0, fontFamily: SANS, fontSize: 40, lineHeight: 1.35, color: C.body, ...reveal(t, 0.12)}}>{s.sub}</p> : null}
  </>
);

const OutroText: React.FC<{s: GridScene; t: number; localF: number}> = ({s, t, localF}) => {
  const accent = useAccent();
  const pulse = localF > 40 ? 1 + Math.max(0, Math.sin((localF - 40) / 8)) * 0.025 : 1;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
      <SceneHeading s={s} localF={localF} size={80} />
      {s.sub ? <p style={{margin: 0, fontFamily: SANS, fontSize: 40, lineHeight: 1.35, color: C.body, ...reveal(t, 0.12)}}>{s.sub}</p> : null}
      {s.button ? (
        <div style={{marginTop: 40, ...reveal(t, 0.2)}}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 20,
              background: C.ink,
              color: '#fff',
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 40,
              padding: '26px 48px',
              borderRadius: 22,
              transform: `scale(${pulse})`,
            }}
          >
            {s.button}
            <span style={{color: accent}}>→</span>
          </span>
        </div>
      ) : null}
    </div>
  );
};

const SceneText: React.FC<{s: GridScene; t: number; localF: number}> = ({s, t, localF}) => {
  if (s.kind === 'title') return <TitleText s={s} t={t} localF={localF} />;
  if (s.kind === 'outro') return <OutroText s={s} t={t} localF={localF} />;
  const card =
    s.kind === 'year' ? <YearCard s={s} t={t} />
    : s.kind === 'fact' ? <FactCard s={s} t={t} />
    : s.kind === 'timeline' ? <TimelineCard s={s} t={t} />
    : s.kind === 'idea' ? <IdeaCard s={s} t={t} />
    : s.kind === 'compare' ? <CompareCard s={s} t={t} />
    : s.kind === 'stat' ? <StatCard s={s} t={t} />
    : s.kind === 'quote' ? <QuoteCard s={s} t={t} />
    : null;
  return (
    <>
      <Kicker text={s.kicker} t={t} />
      <SceneHeading s={s} localF={localF} />
      {card}
    </>
  );
};

// ============================================================================
// Stickman stage (lower half): one SVG in frame coordinates
// ============================================================================
type Pose = {x: number; look: GridLook; armL: number; armR: number; walking?: boolean; flip?: boolean};

const poseFor = (s: GridScene, t: number, localF: number): Pose => {
  const wave = 128 + Math.sin(localF / 4) * 22;
  switch (s.kind) {
    case 'title':
      return {x: 790, look: 'happy', armL: 14, armR: wave};
    case 'year':
      return {x: 800, look: 'neutral', armL: 128, armR: 16}; // points up-left at the year
    case 'fact':
      return {x: 790, look: s.look ?? 'neutral', armL: 40, armR: 20};
    case 'timeline': {
      // walk along the timeline, then stop and face the viewer
      const x = interpolate(t, [0.05, 0.75], [210, 820], clamp);
      const walking = t > 0.05 && t < 0.75;
      return {x, look: 'happy', armL: 12, armR: 12, walking};
    }
    case 'idea':
      return {x: 780, look: t > 0.4 ? 'happy' : 'sad', armL: t > 0.4 ? 150 : 12, armR: 12};
    case 'compare':
      return {x: 540, look: 'neutral', armL: 70, armR: 70};
    case 'stat':
      return {x: 790, look: 'shock', armL: 150 + Math.sin(localF / 5) * 8, armR: 150 - Math.sin(localF / 5) * 8};
    case 'quote':
      return {x: 800, look: 'neutral', armL: 30, armR: 12};
    case 'outro':
      return {x: 540, look: 'happy', armL: wave, armR: 256 - wave};
    default:
      return {x: 790, look: 'neutral', armL: 12, armR: 12};
  }
};

const Stage: React.FC<{s: GridScene; t: number; localF: number; hero: GridHero; talking: boolean}> = ({s, t, localF, hero, talking}) => {
  const accent = useAccent();
  const p = poseFor(s, t, localF);
  const outfit = {...hero, ...s.actor};
  const enter = interpolate(localF, [0, 10], [0, 1], clamp);
  const bulbOn = s.kind === 'idea' && t > 0.4;
  const propX = p.x > 540 ? 300 : 820;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <line x1={PAD} y1={GROUND} x2={1080 - PAD} y2={GROUND} stroke={C.ink} strokeWidth={5} strokeDasharray="2 16" strokeLinecap="round" />
      {s.prop && s.kind !== 'idea' ? (
        <g opacity={enter}>
          <GProp prop={s.prop} x={propX} y={GROUND} f={localF} />
        </g>
      ) : null}
      <ellipse cx={p.x} cy={GROUND + 4} rx={70} ry={10} fill={C.track} opacity={0.8} />
      <g opacity={enter}>
        <Actor
          x={p.x}
          y={GROUND}
          scale={S}
          look={s.look && s.kind !== 'idea' && s.kind !== 'stat' ? s.look : p.look}
          armL={p.armL}
          armR={p.armR}
          walking={p.walking}
          talking={talking}
          flip={p.flip}
          char={outfit.char}
          hair={outfit.hair}
          coat={outfit.coat ?? accent}
          moustache={outfit.moustache ?? false}
          old={outfit.old}
          bowTie={outfit.bowTie}
        />
      </g>
      {s.kind === 'idea' ? (
        <g opacity={bulbOn ? interpolate(t, [0.4, 0.46], [0, 1], clamp) : 0.0}>
          <Bulb x={p.x + 130} y={HEAD_TOP + 40} size={0.85} />
        </g>
      ) : null}
    </svg>
  );
};

// Speech bubble (HTML so it uses the template fonts), left of the stickman's head.
const SpeechBubble: React.FC<{text: string; x: number; t: number}> = ({text, x, t}) => {
  const v = interpolate(t, [0.12, 0.2], [0, 1], clamp);
  const right = 1080 - (x - 70);
  return (
    <div
      style={{
        position: 'absolute',
        top: HEAD_TOP - 30,
        right,
        maxWidth: 480,
        opacity: v,
        transform: `scale(${0.85 + v * 0.15})`,
        transformOrigin: 'right bottom',
      }}
    >
      <div
        style={{
          background: '#fff',
          border: `4px solid ${C.ink}`,
          borderRadius: 22,
          padding: '16px 24px',
          fontFamily: MONO,
          fontWeight: 800,
          fontSize: 34,
          color: C.ink,
          boxShadow: `8px 8px 0 ${C.ink}`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ============================================================================
// Main
// ============================================================================
export const GridStory: React.FC<GridProps> = ({words, scenes, brand, topic, hero = {}, keywords = [], accent = '#E8922A'}) => {
  useLeadFonts();
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const timeline = React.useMemo(() => buildTimeline(scenes, words, fps, durationInFrames), [scenes, words, fps, durationInFrames]);
  const active = timeline.find((s) => frame >= s.startF && frame < s.endF) ?? timeline[timeline.length - 1];
  if (!active) return <AbsoluteFill style={{background: C.bg}} />;
  const localF = frame - active.startF;
  const segLen = Math.max(1, active.endF - active.startF);
  const t = localF / segLen;
  const s = active.scene;

  const chapters = scenes.filter((x) => CONTENT_KINDS.has(x.kind));
  const chapterIdx = chapters.indexOf(s);

  const nowMs = (frame / fps) * 1000;
  const talking = words.some((w) => nowMs >= w.fromMs && nowMs <= w.toMs);

  const enter = interpolate(localF, [0, 10], [0, 1], clamp);
  const exit = active === timeline[timeline.length - 1] ? 1 : interpolate(localF, [segLen - 8, segLen], [1, 0], clamp);
  const opacity = Math.min(enter, exit);
  const pose = poseFor(s, t, localF);
  const textTop = s.kind === 'title' ? 400 : s.kind === 'outro' ? 470 : TOP;

  return (
    <AccentCtx.Provider value={accent}>
      <AbsoluteFill
        style={{
          background: C.bg,
          backgroundImage: `radial-gradient(circle, ${C.dot} 2px, transparent 2.6px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: '20px 20px',
        }}
      >
        <Header brand={brand} />
        {chapterIdx >= 0 ? <Progress idx={chapterIdx} total={chapters.length} t={t} target={topic} /> : null}
        <AbsoluteFill style={{opacity}}>
          <div style={{position: 'absolute', top: textTop, left: PAD, right: PAD}}>
            <SceneText s={s} t={t} localF={localF} />
          </div>
        </AbsoluteFill>
        <Stage s={s} t={t} localF={localF} hero={hero} talking={talking} />
        {s.bubble ? (
          <AbsoluteFill style={{opacity}}>
            <SpeechBubble text={s.bubble} x={pose.x} t={t} />
          </AbsoluteFill>
        ) : null}
        <Subtitle words={words} keywords={keywords} top={1336} />
      </AbsoluteFill>
    </AccentCtx.Provider>
  );
};
