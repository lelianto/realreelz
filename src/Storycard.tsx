// "Storycard" template: a clean, editorial explainer in the CapiMail story look.
// Deep forest-teal stage (dark) OR warm paper (light), gold accent, Bricolage
// Grotesque display + JetBrains Mono for data/steps, floating decorative cards,
// a brand pill header, a small gesturing "stick explainer" in the bottom-right,
// and four reusable "explaining" beats that cut on narration cue words:
//   problem -> how -> grid -> cta
// Built for EXPLAINING a concept (not advertising): hook the question, show the
// mechanism, list concrete examples, land the takeaway.
import React from 'react';
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type StorycardWord = {text: string; fromMs: number; toMs: number};

export type StorycardBadge = {text: string; tone?: 'muted' | 'good' | 'accent'};

export type StorycardTheme = 'dark' | 'light';

export type StorycardScene = {
  kind: 'problem' | 'how' | 'grid' | 'cta';
  cue: string | null;
  kicker?: string; // small uppercase accent label above the headline
  heading?: string; // large display headline
  accentWord?: string; // a substring of `heading` to paint with the accent/coral
  accentTone?: 'accent' | 'coral' | 'mint'; // color used for accentWord
  sub?: string; // supporting line(s); "\n" allowed

  // kind: problem — a shaking "message/card" mockup (what goes wrong)
  card?: {from?: string; tag?: string; title?: string; body?: string};

  // kind: how — a monospace step/data block that types in line by line, + badges
  mono?: boolean; // render lines in JetBrains Mono (steps vs code feel)
  lines?: string[];
  badges?: StorycardBadge[];

  // kind: grid — example cards + an optional highlighted callout box
  cards?: string[];
  callout?: {label?: string; big?: string; unit?: string; note?: string};
  highlight?: string; // mint one-liner under the grid

  // kind: cta — a giant takeaway word + optional pill + footnote
  big?: string;
  pill?: string;
  footnote?: string;
};

const W = 1080;
const H = 1920;

// ============================================================================
// Palette — two themes. Roles kept identical so the whole template switches by
// swapping this one object. FILL tones are bright (dark `ink` text sits on
// them); TEXT tones are contrast-safe against the current background.
// ============================================================================
export type Palette = {
  bg: string;
  panel: string;
  border: string;
  cream: string; // primary text
  muted: string;
  mutedSoft: string;
  faint: string;
  accent: string; // bright brand gold (glow, active dot, deco, subtitle active bg)
  accentSoft: string; // text on the "muted" badge
  mint: string;
  coral: string;
  danger: string;
  ink: string; // dark text that sits on bright fills
  accentText: string;
  mintText: string;
  coralText: string;
  accentFill: string;
  mintFill: string;
  coralFill: string;
  cardBg: string; // the problem message mockup surface
  cardInk: string;
  cardMuted: string;
  badgeMutedBg: string;
  dot: string; // inactive progress dot
  subShadow: string; // subtitle text shadow
};

// Dark (original CapiMail forest-teal look)
export const SC: Palette = {
  bg: '#0E1714',
  panel: '#16231F',
  border: '#2C3B35',
  cream: '#F4EFE6',
  muted: '#A9B5AE',
  mutedSoft: '#C9D2CD',
  faint: '#8E9C95',
  accent: '#F2A541',
  accentSoft: '#FFD08A',
  mint: '#7FD8B4',
  coral: '#FF7A6B',
  danger: '#C23B2C',
  ink: '#0E1714',
  accentText: '#F2A541',
  mintText: '#7FD8B4',
  coralText: '#FF7A6B',
  accentFill: '#F2A541',
  mintFill: '#7FD8B4',
  coralFill: '#FF7A6B',
  cardBg: '#F4EFE6',
  cardInk: '#0E1714',
  cardMuted: '#4A5650',
  badgeMutedBg: '#2A2416',
  dot: 'rgba(244,239,230,0.22)',
  subShadow: '0 3px 14px rgba(0,0,0,0.6)',
};

// Light (warm paper, deep forest ink) — same brand hues, flipped neutrals
export const SC_LIGHT: Palette = {
  bg: '#F3ECE0',
  panel: '#FCF8F0',
  border: '#E2D8C7',
  cream: '#1E2A24',
  muted: '#657269',
  mutedSoft: '#3A473F',
  faint: '#8A978F',
  accent: '#F2A541',
  accentSoft: '#7A5410',
  mint: '#5BC79C',
  coral: '#F0695A',
  danger: '#C23B2C',
  ink: '#17221D',
  accentText: '#A96E0C',
  mintText: '#167E57',
  coralText: '#D5503E',
  accentFill: '#F2A541',
  mintFill: '#7FD8B4',
  coralFill: '#FF8373',
  cardBg: '#FFFFFF',
  cardInk: '#1A2621',
  cardMuted: '#6A776F',
  badgeMutedBg: '#F1E7D2',
  dot: 'rgba(30,42,36,0.18)',
  subShadow: '0 2px 10px rgba(255,255,255,0.75)',
};

const paletteFor = (theme?: StorycardTheme): Palette =>
  theme === 'light' ? SC_LIGHT : SC;

const ThemeCtx = React.createContext<Palette>(SC);
const useT = () => React.useContext(ThemeCtx);

const DISPLAY = "'Bricolage Grotesque', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace";

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const toneText = (C: Palette, tone?: string) =>
  tone === 'mint' ? C.mintText : tone === 'coral' ? C.coralText : C.accentText;
const toneFill = (C: Palette, tone?: string) =>
  tone === 'mint' ? C.mintFill : tone === 'coral' ? C.coralFill : C.accentFill;

// ============================================================================
// Font loading (Google Fonts) — gate render until both families are ready so
// the first frames don't flash a fallback face.
// ============================================================================
let fontsInjected = false;
const useStorycardFonts = () => {
  const [handle] = React.useState(() => delayRender('storycard-fonts'));
  React.useEffect(() => {
    try {
      if (!fontsInjected && typeof document !== 'undefined') {
        fontsInjected = true;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800&family=JetBrains+Mono:wght@500;700&display=swap';
        document.head.appendChild(link);
      }
      const ready =
        typeof document !== 'undefined' && (document as any).fonts
          ? Promise.all([
              (document as any).fonts.load("800 112px 'Bricolage Grotesque'"),
              (document as any).fonts.load("700 32px 'Bricolage Grotesque'"),
              (document as any).fonts.load("700 30px 'JetBrains Mono'"),
            ]).then(() => (document as any).fonts.ready)
          : Promise.resolve();
      ready.then(() => continueRender(handle)).catch(() => continueRender(handle));
    } catch {
      continueRender(handle);
    }
  }, [handle]);
};

// Paint one substring of a heading with an accent color.
const Heading: React.FC<{
  text: string;
  accentWord?: string;
  color: string;
  size: number;
  style?: React.CSSProperties;
}> = ({text, accentWord, color, size, style}) => {
  const C = useT();
  const base: React.CSSProperties = {
    margin: 0,
    fontFamily: DISPLAY,
    fontWeight: 800,
    fontSize: size,
    lineHeight: 0.98,
    letterSpacing: -3,
    color: C.cream,
    ...style,
  };
  if (!accentWord || !text.includes(accentWord)) {
    return <h1 style={base}>{text}</h1>;
  }
  const idx = text.indexOf(accentWord);
  return (
    <h1 style={base}>
      {text.slice(0, idx)}
      <span style={{color}}>{accentWord}</span>
      {text.slice(idx + accentWord.length)}
    </h1>
  );
};

// ============================================================================
// Floating decorative "cards" drifting upward (quiet ambient motion)
// ============================================================================
const FloatingDeco: React.FC = () => {
  const C = useT();
  const frame = useCurrentFrame();
  const items = React.useMemo(
    () => [
      {x: 60, w: 120, delay: 0, stroke: C.cream, speed: 1.0},
      {x: 300, w: 90, delay: 320, stroke: C.accent, speed: 1.25},
      {x: 520, w: 150, delay: 180, stroke: C.mint, speed: 0.85},
      {x: 860, w: 80, delay: 90, stroke: C.cream, speed: 1.1},
    ],
    [C],
  );
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{position: 'absolute', inset: 0}}
      aria-hidden
    >
      {items.map((it, i) => {
        const span = 2200;
        const y = H + 80 - (((frame + it.delay) * it.speed * 3.1) % span);
        const rot = -8 + ((frame * 0.25 + i * 40) % 22);
        const h = it.w * 0.7;
        return (
          <g
            key={i}
            opacity={0.1}
            transform={`translate(${it.x}, ${y}) rotate(${rot} ${it.w / 2} ${h / 2})`}
          >
            <rect
              x={3}
              y={3}
              width={it.w}
              height={h}
              rx={10}
              fill="none"
              stroke={it.stroke}
              strokeWidth={5}
            />
            <path
              d={`M8 ${h * 0.14} L${it.w / 2} ${h * 0.6} L${it.w - 8} ${h * 0.14}`}
              fill="none"
              stroke={it.stroke}
              strokeWidth={5}
            />
          </g>
        );
      })}
    </svg>
  );
};

// Brand pill header (name + a small tag on the right)
const Header: React.FC<{name: string; tag?: string}> = ({name, tag}) => {
  const C = useT();
  return (
    <div
      style={{
        position: 'absolute',
        left: 88,
        right: 88,
        top: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 18,
            background: C.accentFill,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="34" height="26" viewBox="0 0 34 26" aria-hidden>
            <rect x="2" y="2" width="30" height="22" rx="5" fill="none" stroke={C.ink} strokeWidth="3" />
            <path d="M4 5 L17 15 L30 5" fill="none" stroke={C.ink} strokeWidth="3" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: -1,
            color: C.cream,
          }}
        >
          {name}
        </span>
      </div>
      {tag ? (
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: 24,
            fontWeight: 500,
            color: C.muted,
            border: `2px solid ${C.border}`,
            borderRadius: 999,
            padding: '9px 20px',
          }}
        >
          {tag}
        </span>
      ) : null}
    </div>
  );
};

// ============================================================================
// Stick explainer — a small gesturing presenter in the bottom-right corner.
// Gentle bob, a pointing arm that sways toward the content, and three speech
// dots that cycle to read as "talking / explaining". Palette-aware.
// ============================================================================
const StickExplainer: React.FC = () => {
  const C = useT();
  const frame = useCurrentFrame();
  const bob = Math.sin(frame * 0.12) * 5;
  const lean = Math.sin(frame * 0.12) * 1.5;

  // pointing (figure's raised) arm — swings up-left toward the scene
  const a = -2.15 + Math.sin(frame * 0.14) * 0.22;
  const sh = {x: 80, y: 98};
  const hand = {x: sh.x + Math.cos(a) * 52, y: sh.y + Math.sin(a) * 52};
  const elbow = {x: sh.x + Math.cos(a) * 26 + 6, y: sh.y + Math.sin(a) * 26};

  // other arm — small idle gesture
  const b = 0.65 + Math.sin(frame * 0.1 + 1) * 0.12;
  const hand2 = {x: sh.x + Math.cos(b) * 44, y: sh.y + Math.sin(b) * 44};

  // speech dots cycle 0->1->2
  const cycle = Math.floor((frame % 48) / 16);
  const stroke = C.cream;
  const sw = 7;

  return (
    <div
      style={{
        position: 'absolute',
        right: 36,
        bottom: 408,
        width: 170,
        height: 250,
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      <svg width="170" height="250" viewBox="0 0 170 250">
        {/* ground shadow */}
        <ellipse cx={82} cy={236} rx={46} ry={9} fill={C.cream} opacity={0.12} />
        <g transform={`translate(0, ${bob}) rotate(${lean} 80 150)`}>
          {/* legs */}
          <path
            d={`M80 150 L58 222`}
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M80 150 L104 222`}
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
          {/* torso */}
          <path d={`M80 92 L80 152`} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          {/* idle arm */}
          <path
            d={`M80 100 L${hand2.x.toFixed(1)} ${hand2.y.toFixed(1)}`}
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
          {/* pointing arm (two segments for a little elbow) */}
          <path
            d={`M80 98 L${elbow.x.toFixed(1)} ${elbow.y.toFixed(1)} L${hand.x.toFixed(1)} ${hand.y.toFixed(1)}`}
            stroke={C.accentFill}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx={hand.x} cy={hand.y} r={6} fill={C.accentFill} />
          {/* head */}
          <circle cx={80} cy={62} r={24} fill="none" stroke={stroke} strokeWidth={sw} />
        </g>
        {/* speech dots — cycle to signal talking */}
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={116 + i * 16}
            cy={40 - i * 3}
            r={5.5}
            fill={C.accentText}
            opacity={cycle >= i ? 0.95 : 0.18}
          />
        ))}
      </svg>
    </div>
  );
};

// ============================================================================
// Scene body — switches on `kind`. All child entrances are frame-driven
// (localF = frames since this scene became active) so they stagger in.
// ============================================================================
const stagger = (localF: number, fps: number, delayF: number, dur = 10) =>
  spring({frame: Math.max(0, localF - delayF), fps, config: {damping: 16, mass: 0.7}, durationInFrames: dur});

const SceneBody: React.FC<{scene: StorycardScene; localF: number}> = ({scene, localF}) => {
  const C = useT();
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const accentC = toneText(C, scene.accentTone);
  const fillC = toneFill(C, scene.accentTone);

  // Shared headline block (kicker + heading + sub)
  const Head = (
    <>
      {scene.kicker ? (
        <p
          style={{
            margin: 0,
            fontFamily: DISPLAY,
            fontSize: 32,
            fontWeight: 700,
            color: accentC,
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          {scene.kicker}
        </p>
      ) : null}
      {scene.heading ? (
        <Heading
          text={scene.heading}
          accentWord={scene.accentWord}
          color={accentC}
          size={scene.kind === 'cta' ? 84 : scene.heading.length > 42 ? 84 : 104}
        />
      ) : null}
    </>
  );

  const Sub = scene.sub ? (
    <p
      style={{
        margin: 0,
        fontFamily: DISPLAY,
        fontSize: 42,
        fontWeight: 500,
        lineHeight: 1.28,
        color: C.mutedSoft,
        whiteSpace: 'pre-line',
      }}
    >
      {scene.sub}
    </p>
  ) : null;

  // ---- PROBLEM: hook + a shaking message/card mockup --------------------
  if (scene.kind === 'problem') {
    const shake = Math.sin(frame * 0.5) * 1.4;
    const card = scene.card;
    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: 42}}>
        {Head}
        {card ? (
          <div
            style={{
              transform: `rotate(${shake}deg)`,
              transformOrigin: '50% 0%',
              background: C.cardBg,
              color: C.cardInk,
              borderRadius: 36,
              padding: 44,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={{fontFamily: MONO, fontSize: 26, color: C.cardMuted}}>
                {card.from ?? ''}
              </span>
              {card.tag ? (
                <span
                  style={{
                    background: C.danger,
                    color: '#fff',
                    fontFamily: DISPLAY,
                    fontSize: 26,
                    fontWeight: 700,
                    borderRadius: 12,
                    padding: '8px 18px',
                    letterSpacing: 2,
                  }}
                >
                  {card.tag}
                </span>
              ) : null}
            </div>
            {card.title ? (
              <span style={{fontFamily: DISPLAY, fontSize: 48, fontWeight: 700}}>{card.title}</span>
            ) : null}
            {card.body ? (
              <span style={{fontFamily: DISPLAY, fontSize: 30, color: C.cardMuted}}>{card.body}</span>
            ) : null}
          </div>
        ) : null}
        {Sub}
      </div>
    );
  }

  // ---- HOW: staggered mono step/data block + status badges --------------
  if (scene.kind === 'how') {
    const lines = scene.lines ?? [];
    const badges = scene.badges ?? [];
    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: 40}}>
        {Head}
        {lines.length ? (
          <div
            style={{
              background: C.panel,
              border: `2px solid ${C.border}`,
              borderRadius: 32,
              padding: '40px 44px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {lines.map((ln, i) => {
              const p = stagger(localF, fps, 10 + i * 6, 8);
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: scene.mono === false ? DISPLAY : MONO,
                    fontSize: scene.mono === false ? 40 : 30,
                    fontWeight: scene.mono === false ? 600 : 500,
                    lineHeight: 1.55,
                    color: i === 0 && scene.mono !== false ? accentC : C.mutedSoft,
                    opacity: p,
                    transform: `translateX(${interpolate(p, [0, 1], [-22, 0])}px)`,
                  }}
                >
                  {scene.mono === false ? `${i + 1}.  ${ln}` : ln}
                </span>
              );
            })}
          </div>
        ) : null}
        {badges.length ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
            {badges.map((b, i) => {
              const p = stagger(localF, fps, 10 + lines.length * 6 + i * 8, 9);
              const good = b.tone === 'good';
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    background: good ? C.mintFill : b.tone === 'muted' ? C.badgeMutedBg : C.panel,
                    color: good ? C.ink : b.tone === 'muted' ? C.accentSoft : C.cream,
                    border: good ? 'none' : `2px solid ${C.border}`,
                    borderRadius: 999,
                    padding: '16px 30px',
                    fontFamily: DISPLAY,
                    fontSize: 36,
                    fontWeight: good ? 800 : 700,
                    opacity: p,
                    transform: `translateY(${interpolate(p, [0, 1], [18, 0])}px)`,
                  }}
                >
                  {good ? (
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M4 12.5l5 5L20 6.5"
                        stroke={C.ink}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                  {b.text}
                </div>
              );
            })}
          </div>
        ) : null}
        {Sub}
      </div>
    );
  }

  // ---- GRID: example cards + optional callout box -----------------------
  if (scene.kind === 'grid') {
    const cards = scene.cards ?? [];
    const callout = scene.callout;
    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: 36}}>
        {Head}
        {cards.length ? (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 20}}>
            {cards.map((c, i) => {
              const p = stagger(localF, fps, 8 + i * 5, 9);
              return (
                <div
                  key={i}
                  style={{
                    border: `2px solid ${C.border}`,
                    background: C.panel,
                    borderRadius: 24,
                    padding: '28px 30px',
                    fontFamily: DISPLAY,
                    fontSize: 36,
                    fontWeight: 700,
                    color: C.cream,
                    opacity: p,
                    transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px)`,
                  }}
                >
                  {c}
                </div>
              );
            })}
          </div>
        ) : null}
        {callout ? (
          (() => {
            const p = stagger(localF, fps, 8 + cards.length * 5 + 6, 12);
            return (
              <div
                style={{
                  background: fillC,
                  color: C.ink,
                  borderRadius: 36,
                  padding: '40px 44px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  opacity: p,
                  transform: `translateY(${interpolate(p, [0, 1], [34, 0])}px)`,
                }}
              >
                {callout.label ? (
                  <span style={{fontFamily: DISPLAY, fontSize: 32, fontWeight: 700}}>{callout.label}</span>
                ) : null}
                {callout.big ? (
                  <span style={{fontFamily: DISPLAY, fontSize: 92, fontWeight: 800, letterSpacing: -3, lineHeight: 1}}>
                    {callout.big}
                    {callout.unit ? (
                      <span style={{fontSize: 40, letterSpacing: 0}}> {callout.unit}</span>
                    ) : null}
                  </span>
                ) : null}
                {callout.note ? (
                  <span style={{fontFamily: DISPLAY, fontSize: 30, fontWeight: 500}}>{callout.note}</span>
                ) : null}
              </div>
            );
          })()
        ) : null}
        {scene.highlight ? (
          <p style={{margin: 0, fontFamily: DISPLAY, fontSize: 36, fontWeight: 700, color: C.mintText}}>
            {scene.highlight}
          </p>
        ) : null}
        {Sub}
      </div>
    );
  }

  // ---- CTA: giant takeaway word + pill + footnote -----------------------
  const big = scene.big ?? '';
  const bigP = spring({frame: Math.max(0, localF - 6), fps, config: {damping: 12, mass: 0.9}, durationInFrames: 16});
  const pulse = 1 + Math.sin(frame * 0.18) * 0.03;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 34}}>
      {Head}
      {big ? (
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: 190,
            lineHeight: 0.85,
            fontWeight: 800,
            letterSpacing: -6,
            color: accentC,
            transform: `scale(${interpolate(bigP, [0, 1], [0.45, 1])}) rotate(${interpolate(bigP, [0, 1], [-5, 0])}deg)`,
          }}
        >
          {big}
        </span>
      ) : null}
      {Sub}
      {scene.pill ? (
        <div
          style={{
            marginTop: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 18,
            background: fillC,
            color: C.ink,
            borderRadius: 999,
            padding: '30px 52px',
            fontFamily: DISPLAY,
            fontSize: 44,
            fontWeight: 800,
            transform: `scale(${pulse})`,
            boxShadow: `0 0 0 0 ${fillC}`,
          }}
        >
          {scene.pill}
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke={C.ink}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
    </div>
  );
};

// ============================================================================
// Kinetic subtitle strip (word-by-word, palette-matched, single clean line set)
// ============================================================================
interface Phrase {
  words: StorycardWord[];
  startMs: number;
  endMs: number;
}
const groupWords = (words: StorycardWord[]): Phrase[] => {
  if (!words.length) return [];
  const phrases: Phrase[] = [];
  let cur: StorycardWord[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    cur.push(w);
    const text = w.text.trim();
    const hasPunct = /[.,?!;:—…]$/.test(text);
    const charLen = cur.reduce((a, it) => a + it.text.trim().length, 0) + (cur.length - 1);
    const nextGap = i < words.length - 1 ? words[i + 1].fromMs - w.toMs : 0;
    if (hasPunct || cur.length >= 4 || charLen >= 24 || nextGap > 400 || i === words.length - 1) {
      phrases.push({words: cur, startMs: cur[0].fromMs, endMs: cur[cur.length - 1].toMs});
      cur = [];
    }
  }
  for (let i = 0; i < phrases.length; i++) {
    const nextStart = phrases[i + 1] ? phrases[i + 1].startMs : phrases[i].endMs + 600;
    const gap = nextStart - phrases[i].endMs;
    if (gap > 0 && gap < 1100) phrases[i].endMs = nextStart;
    else if (gap >= 1100) phrases[i].endMs += 420;
  }
  return phrases;
};

const Subtitle: React.FC<{words: StorycardWord[]; keywords: string[]}> = ({words, keywords}) => {
  const C = useT();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const phrases = React.useMemo(() => groupWords(words), [words]);
  const active = phrases.find((p) => nowMs >= p.startMs && nowMs < p.endMs);
  const kwSet = React.useMemo(() => new Set(keywords.map(clean)), [keywords]);
  if (!active) return null;
  const startF = Math.round((active.startMs / 1000) * fps);
  const pop = spring({frame: Math.max(0, frame - startF), fps, config: {damping: 16, stiffness: 220}, durationInFrames: 7});
  return (
    <div
      style={{
        position: 'absolute',
        left: 88,
        right: 88,
        bottom: 360,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '6px 14px',
        transform: `scale(${interpolate(pop, [0, 1], [0.95, 1])})`,
        pointerEvents: 'none',
      }}
    >
      {active.words.map((w, i) => {
        const isActive = nowMs >= w.fromMs && nowMs <= w.toMs + 60;
        const isKw = kwSet.has(clean(w.text));
        const color = isActive ? C.ink : isKw ? C.accentText : C.cream;
        return (
          <span
            key={i}
            style={{
              fontFamily: DISPLAY,
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: -0.5,
              padding: isActive ? '2px 14px' : '2px 0',
              borderRadius: 12,
              background: isActive ? C.accent : 'transparent',
              color,
              textShadow: isActive ? 'none' : C.subShadow,
            }}
          >
            {w.text.trim()}
          </span>
        );
      })}
    </div>
  );
};

// ============================================================================
// Scene transition wrapper (fade + lift in/out)
// ============================================================================
const SceneStage: React.FC<{scene: StorycardScene; localF: number; segLen: number}> = ({scene, localF, segLen}) => {
  const enter = interpolate(localF, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const exit = interpolate(localF, [segLen - 10, segLen], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacity = Math.min(enter, exit);
  const y = interpolate(enter, [0, 1], [50, 0]);
  const centered = scene.kind === 'cta';
  return (
    <div
      style={{
        position: 'absolute',
        left: 88,
        right: 88,
        top: centered ? 440 : 400,
        bottom: 460,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <SceneBody scene={scene} localF={localF} />
    </div>
  );
};

// ============================================================================
// Main story
// ============================================================================
export const StorycardStory: React.FC<{
  words: StorycardWord[];
  scenes: StorycardScene[];
  name?: string;
  tag?: string;
  keywords?: string[];
  theme?: StorycardTheme;
}> = ({words, scenes, name = 'CATATAN', tag, keywords = [], theme}) => {
  useStorycardFonts();
  const C = paletteFor(theme);
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // Scene timeline: cut when each scene's cue word is first spoken; if there is
  // no narration (silent preview), spread scenes evenly across the duration.
  const timeline = React.useMemo(() => {
    const list = scenes.length ? scenes : [{kind: 'problem', cue: null} as StorycardScene];
    if (!words.length) {
      const seg = durationInFrames / list.length;
      return list.map((scene, i) => ({scene, startF: Math.round(i * seg), endF: Math.round((i + 1) * seg)}));
    }
    const segments: {scene: StorycardScene; startF: number; endF: number}[] = [];
    let curIdx = 0;
    let startF = 0;
    for (let i = 1; i < list.length; i++) {
      const s = list[i];
      if (!s.cue) continue;
      const target = clean(s.cue);
      const match = words.find((w) => clean(w.text).includes(target));
      if (match) {
        const cueFrame = Math.max(startF + 24, Math.round((match.fromMs / 1000) * fps));
        segments.push({scene: list[curIdx], startF, endF: cueFrame});
        startF = cueFrame;
        curIdx = i;
      }
    }
    segments.push({scene: list[curIdx], startF, endF: durationInFrames});
    return segments;
  }, [scenes, words, fps, durationInFrames]);

  const active = timeline.find((s) => frame >= s.startF && frame < s.endF) || timeline[0];
  const localF = frame - active.startF;
  const segLen = active.endF - active.startF;

  // slow ambient zoom across the whole piece
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.04]);

  // scene progress dots
  const totalScenes = scenes.length || 1;
  const activeIdx = timeline.indexOf(active);

  return (
    <ThemeCtx.Provider value={C}>
      <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
        <div style={{width: '100%', height: '100%', transform: `scale(${zoom})`, transformOrigin: '540px 960px'}}>
          <AbsoluteFill style={{background: C.bg}}>
            {/* soft top glow */}
            <AbsoluteFill
              style={{background: `radial-gradient(60% 34% at 50% 20%, ${C.accent}1c, transparent 70%)`}}
            />
            <FloatingDeco />
            <Header name={name} tag={tag} />
            <SceneStage scene={active.scene} localF={localF} segLen={segLen} />
          </AbsoluteFill>
        </div>

        {/* progress dots */}
        <div
          style={{
            position: 'absolute',
            top: 92,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 14,
          }}
        >
          {Array.from({length: totalScenes}).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeIdx ? 52 : 26,
                height: 10,
                borderRadius: 5,
                background: i === activeIdx ? C.accent : C.dot,
              }}
            />
          ))}
        </div>

        {/* bottom legibility floor + captions */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 460,
            background: `linear-gradient(to top, ${C.bg} 0%, ${C.bg}cc 48%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />
        <StickExplainer />
        <Subtitle words={words} keywords={keywords} />
      </AbsoluteFill>
    </ThemeCtx.Provider>
  );
};
