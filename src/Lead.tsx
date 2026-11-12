// "Lead" template: content-lead marketing reel in a clean IG-story look.
// A product walkthrough that sells by SHOWING the
// product working, then closes on an offer + URL:
//   hook -> step 01/N -> step 02/N -> ... -> cta
// Light dotted-grid stage, JetBrains Mono headlines, Inter body, one warm
// accent, a brand header on every frame and a fine-print disclaimer.
//
// Each `step` carries one animated UI mockup ("widget"): input, keys,
// checklist, code, timeline, list or stat. Widget animation is driven by the
// fraction of the scene that has elapsed, so the same content works SILENT
// (per-scene `durSec`, music only) or NARRATED (scenes cut on
// cue words from the whisper captions, same first-substring rule as the other
// templates).
import React from 'react';
import {
  AbsoluteFill,
  Img,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type LeadWord = {text: string; fromMs: number; toMs: number};

export type LeadKey = {value: string; note?: string; badge?: string; dark?: boolean};
export type LeadCheck = {label: string; pending?: string; done?: string};
export type LeadCodeTab = {label: string; code: string};
export type LeadEvent = {text: string; tone?: 'muted' | 'info' | 'good'};

export type LeadWidget =
  | {type: 'input'; label?: string; value: string; button?: string}
  | {type: 'keys'; items: LeadKey[]; chipsLabel?: string; chips?: string[]}
  | {type: 'checklist'; items: LeadCheck[]}
  | {type: 'code'; tabs: LeadCodeTab[]; toast?: string}
  | {type: 'timeline'; status?: string; body?: string; events: (string | LeadEvent)[]}
  | {type: 'list'; items: string[]}
  | {type: 'stat'; value: number; prefix?: string; suffix?: string; label?: string};

export type LeadScene = {
  kind: 'hook' | 'step' | 'cta';
  cue?: string | null; // narrated mode: cut to this scene when the word is spoken
  durSec?: number; // silent mode: scene length in seconds
  heading?: string;
  accentWord?: string; // substring of heading painted on an accent block
  sub?: string; // supporting copy (under the heading for hook/cta, under the widget for steps)
  // hook
  tags?: string[];
  kicker?: string; // typed terminal-style line, e.g. "> 5 langkah. Gas."
  // step
  widget?: LeadWidget;
  // cta
  offer?: string; // highlighted offer line
  button?: string; // e.g. "produkmu.com"
};

export type LeadBrand = {
  name: string;
  tag?: string; // top-right pill, e.g. "/docs"
  logo?: string; // file in public/ | omitted = accent tile with the name's initial
  mascot?: string; // CTA hero: 'rocket' (built-in) | file in public/ | 'none'
};

export type LeadProps = {
  words: LeadWord[];
  scenes: LeadScene[];
  brand: LeadBrand;
  target?: string; // line under the progress bar, e.g. "Target: tagihan pertama < 2 menit"
  disclaimer?: string;
  keywords?: string[];
  accent?: string;
};

const W = 1080;
const PAD = 88;

const C = {
  bg: '#E9EEF2',
  dot: '#C3CBD3',
  ink: '#0E1116',
  body: '#2E3640',
  muted: '#5B6570',
  faint: '#8A939D',
  card: '#FBFCFD',
  line: '#D6DCE2',
  track: '#C9D0D7',
  blue: '#1F4FD6',
  infoBg: '#DCE6FA',
  infoText: '#2A4AA8',
  pendBg: '#F3E3C3',
  pendText: '#7A4E12',
  good: '#138A5B',
  codeBg: '#0D1117',
  codeText: '#E6E8EB',
};

const MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace";
const SANS = "'Inter', 'Helvetica Neue', Arial, sans-serif";

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const clean = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

const AccentCtx = React.createContext('#E8922A');
const useAccent = () => React.useContext(AccentCtx);

// ============================================================================
// Fonts (Google Fonts, gated so the first frames never flash a fallback face)
// ============================================================================
let fontsInjected = false;
const useLeadFonts = () => {
  const [handle] = React.useState(() => delayRender('lead-fonts'));
  React.useEffect(() => {
    try {
      if (!fontsInjected && typeof document !== 'undefined') {
        fontsInjected = true;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap';
        document.head.appendChild(link);
      }
      const fonts = typeof document !== 'undefined' ? (document as any).fonts : null;
      const ready = fonts
        ? Promise.all([
            fonts.load("800 96px 'JetBrains Mono'"),
            fonts.load("500 30px 'JetBrains Mono'"),
            fonts.load("400 40px 'Inter'"),
            fonts.load("800 40px 'Inter'"),
          ]).then(() => fonts.ready)
        : Promise.resolve();
      ready.then(() => continueRender(handle)).catch(() => continueRender(handle));
    } catch {
      continueRender(handle);
    }
  }, [handle]);
};

// ============================================================================
// Brand art: built-in generic rocket mascot, or any image from public/
// ============================================================================
const RocketMascot: React.FC<{width: number; bob: number; check: number}> = ({width, bob, check}) => {
  const accent = useAccent();
  const frame = useCurrentFrame();
  const flick = 1 + Math.sin(frame / 2.3) * 0.12;
  return (
    <svg width={width} height={(width * 236) / 340} viewBox="0 -26 340 236">
      <ellipse cx="170" cy="200" rx="110" ry="9" fill="#C9CFD5" />
      <g transform={`translate(0 ${bob}) rotate(32 170 100)`}>
        {/* flame */}
        <g transform={`translate(170 168) scale(1 ${flick})`}>
          <path d="M-18 0 Q0 64 18 0 Z" fill={accent} />
          <path d="M-9 0 Q0 34 9 0 Z" fill="#FFE2A8" />
        </g>
        {/* fins */}
        <path d="M134 120 L104 168 L140 158 Z" fill={C.ink} />
        <path d="M206 120 L236 168 L200 158 Z" fill={C.ink} />
        {/* body */}
        <path d="M170 -8 C214 30 216 120 204 166 L136 166 C124 120 126 30 170 -8 Z" fill="#fff" stroke={C.ink} strokeWidth="6" strokeLinejoin="round" />
        <path d="M170 -8 C190 8 200 26 205 44 L135 44 C140 26 150 8 170 -8 Z" fill={accent} stroke={C.ink} strokeWidth="6" strokeLinejoin="round" />
        {/* window */}
        <circle cx="170" cy="86" r="24" fill={C.infoBg} stroke={C.ink} strokeWidth="6" />
        <circle cx="162" cy="78" r="6" fill="#fff" />
      </g>
      {/* launched check */}
      <g transform={`translate(262 ${34 + bob * 0.6}) scale(${check})`}>
        <circle cx="0" cy="0" r="26" fill={C.good} />
        <path d="M-12 0 l8 9 l16 -18" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

const BrandMark: React.FC<{logo?: string; name: string; size: number}> = ({logo, name, size}) => {
  const accent = useAccent();
  if (logo) return <Img src={staticFile(logo)} style={{height: size, width: 'auto'}} />;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        background: accent,
        color: C.ink,
        fontFamily: SANS,
        fontWeight: 800,
        fontSize: size * 0.6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
};

const Header: React.FC<{brand: LeadBrand}> = ({brand}) => (
  <div
    style={{
      position: 'absolute',
      top: 248,
      left: PAD,
      right: PAD,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
      <BrandMark logo={brand.logo} name={brand.name} size={58} />
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, letterSpacing: -1.2, color: C.ink}}>
        {brand.name}
      </span>
    </div>
    {brand.tag ? (
      <span
        style={{
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 27,
          color: '#fff',
          background: C.ink,
          padding: '10px 18px',
          borderRadius: 10,
        }}
      >
        {brand.tag}
      </span>
    ) : null}
  </div>
);

// ============================================================================
// Shared bits
// ============================================================================
const Heading: React.FC<{text: string; accentWord?: string; size: number; center?: boolean}> = ({
  text,
  accentWord,
  size,
  center,
}) => {
  const accent = useAccent();
  const base: React.CSSProperties = {
    margin: 0,
    fontFamily: MONO,
    fontWeight: 800,
    fontSize: size,
    lineHeight: 1.08,
    letterSpacing: -1.5,
    color: C.ink,
    textAlign: center ? 'center' : 'left',
    whiteSpace: 'pre-line',
  };
  if (!accentWord || !text.includes(accentWord)) return <h1 style={base}>{text}</h1>;
  const i = text.indexOf(accentWord);
  return (
    <h1 style={base}>
      {text.slice(0, i)}
      <span style={{background: accent, borderRadius: 12, padding: '0 14px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>
        {accentWord}
      </span>
      {text.slice(i + accentWord.length)}
    </h1>
  );
};

const Badge: React.FC<{text: string; bg: string; color: string}> = ({text, bg, color}) => (
  <span
    style={{
      fontFamily: SANS,
      fontWeight: 800,
      fontSize: 22,
      letterSpacing: 0.5,
      background: bg,
      color,
      padding: '7px 16px',
      borderRadius: 999,
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </span>
);

const Caret: React.FC<{color?: string; h?: number}> = ({color = C.ink, h = 34}) => {
  const frame = useCurrentFrame();
  const on = Math.floor(frame / 15) % 2 === 0;
  return <span style={{display: 'inline-block', width: 6, height: h, marginLeft: 4, background: color, opacity: on ? 1 : 0, verticalAlign: 'middle'}} />;
};

// Fade + lift for an element appearing at scene fraction `at`.
const reveal = (t: number, at: number, span = 0.08) => {
  const v = interpolate(t, [at, at + span], [0, 1], clamp);
  return {opacity: v, transform: `translateY(${(1 - v) * 24}px)`};
};

// ============================================================================
// Widgets — every one animates from `t` = elapsed fraction of the scene (0..1)
// ============================================================================
const InputWidget: React.FC<{w: Extract<LeadWidget, {type: 'input'}>; t: number}> = ({w, t}) => {
  const typed = Math.round(interpolate(t, [0.12, 0.5], [0, w.value.length], clamp));
  const showBtn = interpolate(t, [0.58, 0.66], [0, 1], clamp);
  const press = t > 0.74 && t < 0.8 ? 0.96 : 1;
  const done = t >= 0.8;
  return (
    <div
      style={{
        background: C.card,
        border: `4px solid ${C.ink}`,
        borderRadius: 22,
        boxShadow: `12px 12px 0 ${C.ink}`,
        padding: '30px 32px 36px',
      }}
    >
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 26, color: C.ink, marginBottom: 16}}>
        {w.label ?? 'Email'}
      </div>
      <div
        style={{
          height: 76,
          border: `3px solid ${C.track}`,
          borderRadius: 12,
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          fontFamily: MONO,
          fontWeight: 500,
          fontSize: 30,
          color: C.ink,
        }}
      >
        {w.value.slice(0, typed)}
        {t < 0.6 ? <Caret h={32} /> : null}
      </div>
      {w.button ? (
        <div
          style={{
            marginTop: 22,
            height: 76,
            borderRadius: 12,
            background: done ? C.good : C.ink,
            color: '#fff',
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: showBtn,
            transform: `scale(${press})`,
          }}
        >
          {w.button}
        </div>
      ) : null}
    </div>
  );
};

const KeysWidget: React.FC<{w: Extract<LeadWidget, {type: 'keys'}>; t: number}> = ({w, t}) => {
  const accent = useAccent();
  const n = w.items.length;
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
      {w.items.map((k, i) => {
        const at = n > 1 ? 0.04 + (i / n) * 0.5 : 0.04;
        const r = interpolate(t, [at, at + 0.08], [0, 1], clamp);
        const shown = Math.round(interpolate(t, [at, at + 0.2], [0, k.value.length], clamp));
        return (
          <div
            key={i}
            style={{
              opacity: r,
              transform: `translateY(${(1 - r) * 24}px)`,
              background: k.dark ? C.ink : C.card,
              border: `3px solid ${C.ink}`,
              borderRadius: 18,
              padding: '24px 28px',
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16}}>
              <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 32, color: k.dark ? '#fff' : C.ink}}>
                {k.value.slice(0, shown)}
              </span>
              {k.badge ? (
                <Badge text={k.badge} bg={k.dark ? accent : C.infoBg} color={k.dark ? C.ink : C.infoText} />
              ) : null}
            </div>
            {k.note ? (
              <div style={{fontFamily: SANS, fontSize: 25, marginTop: 8, color: k.dark ? '#B8C0C8' : C.muted}}>{k.note}</div>
            ) : null}
          </div>
        );
      })}
      {w.chips?.length ? (
        <div style={{display: 'flex', alignItems: 'center', gap: 14, ...reveal(t, 0.62)}}>
          {w.chipsLabel ? (
            <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 26, color: C.ink}}>{w.chipsLabel}</span>
          ) : null}
          {w.chips.map((c) => (
            <span
              key={c}
              style={{
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: 24,
                color: C.ink,
                border: `3px solid ${C.ink}`,
                borderRadius: 10,
                padding: '6px 14px',
              }}
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const ChecklistWidget: React.FC<{w: Extract<LeadWidget, {type: 'checklist'}>; t: number}> = ({w, t}) => {
  const n = w.items.length;
  return (
    <div style={{background: C.card, border: `3px solid ${C.ink}`, borderRadius: 20, overflow: 'hidden'}}>
      {w.items.map((it, i) => {
        const flipAt = 0.3 + (i / Math.max(1, n)) * 0.45;
        const ok = t >= flipAt;
        const pop = ok ? interpolate(t, [flipAt, flipAt + 0.04], [0.8, 1], clamp) : 1;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '30px 32px',
              borderTop: i ? `2px solid ${C.line}` : 'none',
            }}
          >
            <span style={{fontFamily: MONO, fontWeight: 800, fontSize: 34, color: C.ink}}>{it.label}</span>
            <span style={{transform: `scale(${pop})`}}>
              {ok ? (
                <Badge text={it.done ?? 'Selesai'} bg={C.good} color="#fff" />
              ) : (
                <Badge text={it.pending ?? 'Menunggu...'} bg={C.pendBg} color={C.pendText} />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const CodeWidget: React.FC<{w: Extract<LeadWidget, {type: 'code'}>; t: number}> = ({w, t}) => {
  const accent = useAccent();
  const n = Math.max(1, w.tabs.length);
  const idx = Math.min(n - 1, Math.floor(interpolate(t, [0, 0.92], [0, n], clamp)));
  const tab = w.tabs[idx];
  const tabStart = (idx / n) * 0.92;
  const lines = tab ? tab.code.split('\n') : [];
  const shownLines = Math.ceil(interpolate(t, [tabStart, tabStart + 0.12], [0, lines.length], clamp));
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
      <div style={{display: 'flex', gap: 12}}>
        {w.tabs.map((tb, i) => (
          <span
            key={tb.label}
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 25,
              padding: '9px 18px',
              borderRadius: 10,
              background: i === idx ? accent : '#2A313A',
              color: i === idx ? C.ink : '#AEB6BF',
            }}
          >
            {tb.label}
          </span>
        ))}
      </div>
      <div style={{background: C.codeBg, borderRadius: 22, padding: '30px 32px', minHeight: 340}}>
        {lines.map((ln, i) => (
          <div
            key={i}
            style={{
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: 26,
              lineHeight: 1.55,
              color: C.codeText,
              whiteSpace: 'pre',
              opacity: i < shownLines ? 1 : 0,
            }}
          >
            {ln || ' '}
          </div>
        ))}
      </div>
      {w.toast ? (
        <div style={{alignSelf: 'flex-start', ...reveal(t, 0.36)}}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14,
              background: C.ink,
              color: '#fff',
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 30,
              padding: '16px 28px',
              borderRadius: 999,
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24">
              <rect x="8" y="8" width="12" height="12" rx="2.5" stroke="#5BD6A0" strokeWidth="2.4" fill="none" />
              <path d="M5 15 V6 a2 2 0 0 1 2 -2 h8" stroke="#5BD6A0" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            </svg>
            {w.toast}
          </span>
        </div>
      ) : null}
    </div>
  );
};

const TimelineWidget: React.FC<{w: Extract<LeadWidget, {type: 'timeline'}>; t: number}> = ({w, t}) => {
  const accent = useAccent();
  const events: LeadEvent[] = w.events.map((e, i, arr) =>
    typeof e === 'string'
      ? {text: e, tone: i === arr.length - 1 ? 'good' : i === arr.length - 2 && arr.length > 2 ? 'info' : 'muted'}
      : e,
  );
  const n = events.length;
  const head = reveal(t, 0.12);
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      {w.status || w.body ? (
        <div style={{background: C.codeBg, borderRadius: 20, padding: '24px 30px', ...head}}>
          {w.status ? (
            <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 28, color: accent}}>{w.status}</div>
          ) : null}
          {w.body ? (
            <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 28, color: C.codeText, marginTop: 4}}>{w.body}</div>
          ) : null}
        </div>
      ) : null}
      <div style={{background: C.card, border: `3px solid ${C.ink}`, borderRadius: 20, padding: '22px 30px', minHeight: 150}}>
        {events.map((e, i) => {
          const at = 0.24 + (i / Math.max(1, n)) * 0.55;
          const v = interpolate(t, [at, at + 0.06], [0, 1], clamp);
          const color = e.tone === 'good' ? C.good : e.tone === 'info' ? C.blue : C.faint;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '10px 0',
                opacity: v,
                transform: `translateX(${(1 - v) * -20}px)`,
              }}
            >
              <span style={{width: 16, height: 16, borderRadius: 8, background: color}} />
              <span
                style={{
                  fontFamily: MONO,
                  fontWeight: e.tone === 'good' ? 800 : 700,
                  fontSize: 30,
                  color: e.tone === 'good' ? C.good : C.ink,
                }}
              >
                {e.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ListWidget: React.FC<{w: Extract<LeadWidget, {type: 'list'}>; t: number}> = ({w, t}) => {
  const accent = useAccent();
  const n = w.items.length;
  return (
    <div style={{background: C.card, border: `3px solid ${C.ink}`, borderRadius: 20, padding: '14px 30px'}}>
      {w.items.map((it, i) => {
        const at = 0.08 + (i / Math.max(1, n)) * 0.6;
        const v = interpolate(t, [at, at + 0.07], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '20px 0',
              borderTop: i ? `2px solid ${C.line}` : 'none',
              opacity: v,
            }}
          >
            <span
              style={{
                flex: '0 0 auto',
                width: 44,
                height: 44,
                borderRadius: 22,
                background: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M5 12 l5 5 l9 -10" stroke={C.ink} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.ink, lineHeight: 1.25}}>{it}</span>
          </div>
        );
      })}
    </div>
  );
};

const StatWidget: React.FC<{w: Extract<LeadWidget, {type: 'stat'}>; t: number}> = ({w, t}) => {
  const accent = useAccent();
  const v = interpolate(t, [0.08, 0.55], [0, w.value], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)});
  const shown = Number.isInteger(w.value) ? Math.round(v).toLocaleString('id-ID') : v.toFixed(1);
  // shrink long figures so the final value always fits on one line
  const finalText = `${w.prefix ?? ''}${Number.isInteger(w.value) ? w.value.toLocaleString('id-ID') : w.value.toFixed(1)}${w.suffix ?? ''}`;
  const size = Math.min(132, Math.floor(820 / (finalText.length * 0.6)));
  return (
    <div style={{background: C.codeBg, borderRadius: 24, padding: '40px 36px'}}>
      <div style={{fontFamily: MONO, fontWeight: 800, fontSize: size, lineHeight: 1, color: accent, letterSpacing: -2, whiteSpace: 'nowrap'}}>
        {w.prefix ?? ''}
        {shown}
        {w.suffix ?? ''}
      </div>
      {w.label ? (
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.codeText, marginTop: 18, ...reveal(t, 0.5)}}>
          {w.label}
        </div>
      ) : null}
    </div>
  );
};

const Widget: React.FC<{w: LeadWidget; t: number}> = ({w, t}) => {
  switch (w.type) {
    case 'input':
      return <InputWidget w={w} t={t} />;
    case 'keys':
      return <KeysWidget w={w} t={t} />;
    case 'checklist':
      return <ChecklistWidget w={w} t={t} />;
    case 'code':
      return <CodeWidget w={w} t={t} />;
    case 'timeline':
      return <TimelineWidget w={w} t={t} />;
    case 'list':
      return <ListWidget w={w} t={t} />;
    case 'stat':
      return <StatWidget w={w} t={t} />;
    default:
      return null;
  }
};

// ============================================================================
// Scenes
// ============================================================================
const HookScene: React.FC<{s: LeadScene; t: number; localF: number}> = ({s, t, localF}) => {
  const {fps} = useVideoConfig();
  const tags = s.tags ?? [];
  const kicker = s.kicker ?? '';
  const typed = Math.round(interpolate(t, [0.4, 0.62], [0, kicker.length], clamp));
  const head = spring({frame: Math.max(0, localF - 6), fps, config: {damping: 18}});
  return (
    <div style={{position: 'absolute', top: 400, left: PAD, right: PAD}}>
      <div style={{display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 40}}>
        {tags.map((tg, i) => {
          const v = interpolate(localF, [i * 6, i * 6 + 10], [0, 1], clamp);
          return (
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
                opacity: v,
              }}
            >
              {tg}
            </span>
          );
        })}
      </div>
      <div style={{opacity: head, transform: `translateY(${(1 - head) * 30}px)`}}>
        <Heading text={s.heading ?? ''} accentWord={s.accentWord} size={98} />
      </div>
      {s.sub ? (
        <p style={{margin: '34px 0 0', fontFamily: SANS, fontSize: 42, lineHeight: 1.35, color: C.body, ...reveal(t, 0.12)}}>
          {s.sub}
        </p>
      ) : null}
      {kicker ? (
        <div style={{marginTop: 40, fontFamily: MONO, fontWeight: 700, fontSize: 40, color: C.blue, minHeight: 50}}>
          {t >= 0.4 ? (
            <>
              {kicker.slice(0, typed)}
              <Caret color={C.blue} h={42} />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const StepScene: React.FC<{s: LeadScene; t: number; localF: number; idx: number; total: number}> = ({
  s,
  t,
  localF,
  idx,
  total,
}) => {
  const {fps} = useVideoConfig();
  const head = spring({frame: localF, fps, config: {damping: 18}});
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div style={{position: 'absolute', top: 470, left: PAD, right: PAD}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 36, color: C.muted}}>
        {pad(idx + 1)} / {pad(total)}
      </div>
      <div style={{marginTop: 34, opacity: head, transform: `translateY(${(1 - head) * 26}px)`}}>
        <Heading text={s.heading ?? ''} accentWord={s.accentWord} size={70} />
      </div>
      {s.widget ? (
        <div style={{marginTop: 40, ...reveal(t, 0.03, 0.06)}}>
          <Widget w={s.widget} t={t} />
        </div>
      ) : null}
      {s.sub ? (
        <p style={{margin: '30px 0 0', fontFamily: s.widget?.type === 'checklist' ? MONO : SANS, fontSize: 30, lineHeight: 1.4, color: C.body, ...reveal(t, 0.2)}}>
          {s.sub}
        </p>
      ) : null}
    </div>
  );
};

const CtaScene: React.FC<{s: LeadScene; t: number; localF: number; brand: LeadBrand}> = ({s, t, localF, brand}) => {
  const accent = useAccent();
  const {fps} = useVideoConfig();
  const pop = spring({frame: localF, fps, config: {damping: 12, stiffness: 140}});
  const check = spring({frame: Math.max(0, localF - 16), fps, config: {damping: 9}});
  const bob = Math.sin(localF / 9) * 4;
  const mascot = brand.mascot;
  const btnPulse = 1 + Math.max(0, Math.sin((localF - 40) / 8)) * 0.025 * (localF > 40 ? 1 : 0);
  return (
    <div
      style={{
        position: 'absolute',
        top: 440,
        left: PAD,
        right: PAD,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {mascot && mascot !== 'none' ? (
        <div style={{transform: `scale(${pop})`, marginBottom: 30}}>
          {mascot === 'rocket' ? (
            <RocketMascot width={360} bob={bob} check={check} />
          ) : (
            <Img src={staticFile(mascot)} style={{height: 230, width: 'auto'}} />
          )}
        </div>
      ) : null}
      <div style={reveal(t, 0.04)}>
        <Heading text={s.heading ?? ''} accentWord={s.accentWord} size={80} center />
      </div>
      {s.offer ? (
        <div style={{marginTop: 30, ...reveal(t, 0.12)}}>
          <span
            style={{
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 44,
              background: accent,
              color: C.ink,
              padding: '4px 16px',
              borderRadius: 10,
            }}
          >
            {s.offer}
          </span>
        </div>
      ) : null}
      {s.sub ? (
        <p style={{margin: '18px 0 0', fontFamily: SANS, fontSize: 40, lineHeight: 1.35, color: C.body, ...reveal(t, 0.16)}}>
          {s.sub}
        </p>
      ) : null}
      {s.button ? (
        <div style={{marginTop: 44, ...reveal(t, 0.22)}}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 22,
              background: C.ink,
              color: '#fff',
              fontFamily: MONO,
              fontWeight: 800,
              fontSize: 40,
              padding: '30px 52px',
              borderRadius: 22,
              transform: `scale(${btnPulse})`,
              boxShadow: '0 10px 0 rgba(14,17,22,0.18)',
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

// ============================================================================
// Progress bar (steps only) + subtitles (narrated mode only)
// ============================================================================
const Progress: React.FC<{idx: number; total: number; t: number; target?: string}> = ({idx, total, t, target}) => {
  const accent = useAccent();
  return (
    <div style={{position: 'absolute', top: 358, left: PAD, right: PAD}}>
      <div style={{display: 'flex', gap: 12}}>
        {Array.from({length: total}).map((_, i) => {
          const fill = i < idx ? 1 : i === idx ? interpolate(t, [0, 0.35], [0, 1], clamp) : 0;
          const color = i === total - 1 && i === idx ? accent : C.ink;
          return (
            <div key={i} style={{flex: 1, height: 10, borderRadius: 5, background: C.track, overflow: 'hidden'}}>
              <div style={{width: `${fill * 100}%`, height: '100%', background: color, borderRadius: 5}} />
            </div>
          );
        })}
      </div>
      {target ? (
        <div style={{marginTop: 16, fontFamily: MONO, fontWeight: 500, fontSize: 27, color: C.muted}}>{target}</div>
      ) : null}
    </div>
  );
};

type Phrase = {words: LeadWord[]; startMs: number; endMs: number};
const groupWords = (words: LeadWord[]): Phrase[] => {
  const out: Phrase[] = [];
  let cur: LeadWord[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const len = cur.reduce((a, x) => a + x.text.trim().length + 1, 0);
    const gap = i < words.length - 1 ? words[i + 1].fromMs - w.toMs : 0;
    if (/[.,?!;:]$/.test(w.text.trim()) || cur.length >= 4 || len >= 26 || gap > 400 || i === words.length - 1) {
      out.push({words: cur, startMs: cur[0].fromMs, endMs: cur[cur.length - 1].toMs});
      cur = [];
    }
  });
  out.forEach((p, i) => {
    const next = out[i + 1] ? out[i + 1].startMs : p.endMs + 600;
    const gap = next - p.endMs;
    p.endMs = gap > 0 && gap < 1100 ? next : p.endMs + 420;
  });
  return out;
};

const Subtitle: React.FC<{words: LeadWord[]; keywords: string[]}> = ({words, keywords}) => {
  const accent = useAccent();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const phrases = React.useMemo(() => groupWords(words), [words]);
  const kw = React.useMemo(() => new Set(keywords.map(clean)), [keywords]);
  const active = phrases.find((p) => nowMs >= p.startMs && nowMs < p.endMs);
  if (!active) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 1300,
        left: PAD,
        right: PAD,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '6px 12px',
      }}
    >
      {active.words.map((w, i) => {
        const on = nowMs >= w.fromMs && nowMs <= w.toMs + 60;
        const isKw = kw.has(clean(w.text));
        return (
          <span
            key={i}
            style={{
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 48,
              letterSpacing: -0.5,
              padding: '2px 12px',
              borderRadius: 10,
              background: on ? accent : 'rgba(233,238,242,0.92)',
              color: on ? C.ink : isKw ? '#9A5A0C' : C.ink,
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
// Timeline: cue-driven when narrated, durSec-driven (or even) when silent
// ============================================================================
type Seg = {scene: LeadScene; startF: number; endF: number};
const buildTimeline = (scenes: LeadScene[], words: LeadWord[], fps: number, total: number): Seg[] => {
  const list = scenes.length ? scenes : [{kind: 'hook', heading: ''} as LeadScene];
  if (words.length && list.slice(1).some((s) => s.cue)) {
    const segs: Seg[] = [];
    let cur = 0;
    let startF = 0;
    for (let i = 1; i < list.length; i++) {
      const cue = list[i].cue;
      if (!cue) continue;
      const m = words.find((w) => clean(w.text).includes(clean(cue)));
      if (!m) continue;
      const f = Math.max(startF + 24, Math.round((m.fromMs / 1000) * fps));
      segs.push({scene: list[cur], startF, endF: f});
      startF = f;
      cur = i;
    }
    segs.push({scene: list[cur], startF, endF: total});
    return segs;
  }
  const weights = list.map((s) => (s.durSec && s.durSec > 0 ? s.durSec : 0));
  const known = weights.reduce((a, b) => a + b, 0);
  const missing = weights.filter((x) => !x).length;
  const fill = missing ? Math.max(1, (total / fps - known) / missing) : 0;
  const secs = weights.map((x) => x || fill);
  const scale = total / (secs.reduce((a, b) => a + b, 0) * fps);
  let acc = 0;
  return list.map((scene, i) => {
    const startF = Math.round(acc);
    acc += secs[i] * fps * scale;
    return {scene, startF, endF: i === list.length - 1 ? total : Math.round(acc)};
  });
};

export const leadDurationSec = (scenes: LeadScene[]): number | undefined => {
  if (!scenes.length || scenes.some((s) => !s.durSec)) return undefined;
  return scenes.reduce((a, s) => a + (s.durSec ?? 0), 0);
};

// ============================================================================
// Main
// ============================================================================
export const LeadStory: React.FC<LeadProps> = ({
  words,
  scenes,
  brand,
  target,
  disclaimer,
  keywords = [],
  accent = '#E8922A',
}) => {
  useLeadFonts();
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const timeline = React.useMemo(
    () => buildTimeline(scenes, words, fps, durationInFrames),
    [scenes, words, fps, durationInFrames],
  );
  const active = timeline.find((s) => frame >= s.startF && frame < s.endF) ?? timeline[timeline.length - 1];
  const localF = frame - active.startF;
  const segLen = Math.max(1, active.endF - active.startF);
  const t = localF / segLen;

  const steps = scenes.filter((s) => s.kind === 'step');
  const stepIdx = steps.indexOf(active.scene);

  // scene transition: quick fade/lift in, fade out over the last 8 frames
  const enter = interpolate(localF, [0, 10], [0, 1], clamp);
  const exit = active === timeline[timeline.length - 1] ? 1 : interpolate(localF, [segLen - 8, segLen], [1, 0], clamp);
  const opacity = Math.min(enter, exit);

  let body: React.ReactNode = null;
  if (active.scene.kind === 'hook') body = <HookScene s={active.scene} t={t} localF={localF} />;
  else if (active.scene.kind === 'step')
    body = <StepScene s={active.scene} t={t} localF={localF} idx={stepIdx} total={steps.length} />;
  else body = <CtaScene s={active.scene} t={t} localF={localF} brand={brand} />;

  return (
    <AccentCtx.Provider value={accent}>
      <AbsoluteFill
        style={{
          background: C.bg,
          backgroundImage: `radial-gradient(circle, ${C.dot} 2px, transparent 2.6px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: '20px 20px',
          width: W,
        }}
      >
        <Header brand={brand} />
        {active.scene.kind === 'step' && steps.length ? (
          <Progress idx={stepIdx} total={steps.length} t={t} target={target} />
        ) : null}
        <AbsoluteFill style={{opacity}}>{body}</AbsoluteFill>
        <Subtitle words={words} keywords={keywords} />
        {disclaimer ? (
          <div
            style={{
              position: 'absolute',
              top: 1440,
              left: PAD,
              right: PAD,
              fontFamily: SANS,
              fontSize: 22,
              lineHeight: 1.4,
              color: C.muted,
            }}
          >
            {disclaimer}
          </div>
        ) : null}
      </AbsoluteFill>
    </AccentCtx.Provider>
  );
};
