// Story FORMATS for the stickman template: reusable transitions, overlays and
// HUDs that change the order/shape of a video without redrawing the scenes.
//   bio    — the original linear biography (hard cuts, name badge)
//   tebak  — "Tebak Siapa": hero is a silhouette with hint counter until the
//            scene flagged `reveal`, then flash + confetti + name badge
//   mundur — open on the ending, VHS-rewind back in time; year stamps + a
//            year rail at the top that jumps back and forth
//   duel   — two inventors: split-screen scenes, rounds, a live scoreboard
import React from 'react';
import {interpolate, spring, useVideoConfig} from 'remotion';

export const W = 1080;
export const H = 1920;
const INK = '#1b1a22';
const FONT = '"Arial Black", Arial, sans-serif';

export type StoryFormat = 'bio' | 'tebak' | 'mundur' | 'duel';
export type Transition = 'cut' | 'whip' | 'iris' | 'flash' | 'rewind';
export type Rival = {
  name: string;
  hair?: string;
  moustache?: boolean;
  coat?: string;
  old?: boolean;
  accent?: string;
  hue?: number;
};

// frames each transition occupies at the head of the incoming scene
export const TRANS_LEN: Record<Transition, number> = {cut: 0, whip: 12, iris: 16, flash: 10, rewind: 26};
// the rewind spends this many frames playing the previous scene backwards
export const REWIND_BACK = 15;

export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Shared SVG defs: silhouette, grades, rewind desaturate, whip blur
// ---------------------------------------------------------------------------
export const FormatDefs: React.FC<{accent: string; blur: number}> = ({accent, blur}) => (
  <defs>
    <filter id="stkSil" x="-30%" y="-30%" width="160%" height="160%">
      <feMorphology in="SourceAlpha" operator="dilate" radius={7} result="d" />
      <feFlood floodColor={accent} result="c" />
      <feComposite in="c" in2="d" operator="in" result="rim" />
      <feFlood floodColor="#08070d" result="k" />
      <feComposite in="k" in2="SourceAlpha" operator="in" result="body" />
      <feMerge>
        <feMergeNode in="rim" />
        <feMergeNode in="body" />
      </feMerge>
    </filter>
    <filter id="gradeMono">
      <feColorMatrix type="matrix" values="0.33 0.5 0.17 0 -0.02  0.33 0.5 0.17 0 -0.02  0.33 0.5 0.17 0 -0.02  0 0 0 1 0" />
    </filter>
    <filter id="gradeSepia">
      <feColorMatrix type="matrix" values="0.393 0.769 0.189 0 0  0.349 0.686 0.168 0 0  0.272 0.534 0.131 0 0  0 0 0 1 0" />
    </filter>
    <filter id="vhs">
      <feColorMatrix type="saturate" values="0.25" />
    </filter>
    <filter id="whipBlur" x="-20%" y="-5%" width="140%" height="110%">
      <feGaussianBlur stdDeviation={`${blur} 0`} />
    </filter>
    <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
      <stop offset="55%" stopColor="#000" stopOpacity={0} />
      <stop offset="100%" stopColor="#000" stopOpacity={0.7} />
    </radialGradient>
    <pattern id="scan" width={8} height={8} patternUnits="userSpaceOnUse">
      <rect width={8} height={3} fill="#000" opacity={0.35} />
    </pattern>
  </defs>
);

// ---------------------------------------------------------------------------
// Split screen frame (duel): each side draws a full scene, scaled and
// centre-cropped into its half, with a lightning divider + VS badge.
// ---------------------------------------------------------------------------
export const SplitFrame: React.FC<{
  id: string;
  left: React.ReactNode;
  right: React.ReactNode;
  accentL: string;
  accentR: string;
  f: number;
}> = ({id, left, right, accentL, accentR, f}) => {
  const s = 0.85;
  const ty = 144;
  const zig = Array.from({length: 13}, (_, i) => `${540 + (i % 2 ? 22 : -22) + Math.sin(f / 3 + i) * 5},${i * 160}`).join(' ');
  return (
    <g>
      <rect width={W} height={H} fill="#0c0b12" />
      <clipPath id={`${id}L`}>
        <rect x={0} y={0} width={540} height={H} />
      </clipPath>
      <clipPath id={`${id}R`}>
        <rect x={540} y={0} width={540} height={H} />
      </clipPath>
      <g clipPath={`url(#${id}L)`}>
        <g transform={`translate(${270 - 540 * s} ${ty}) scale(${s})`}>{left}</g>
        <rect width={540} height={H} fill={accentL} opacity={0.06} />
      </g>
      <g clipPath={`url(#${id}R)`}>
        <g transform={`translate(${810 - 540 * s} ${ty}) scale(${s})`}>{right}</g>
        <rect x={540} width={540} height={H} fill={accentR} opacity={0.06} />
      </g>
      <polyline points={zig} fill="none" stroke={INK} strokeWidth={26} strokeLinejoin="round" />
      <polyline points={zig} fill="none" stroke="#fff" strokeWidth={12} strokeLinejoin="round" />
    </g>
  );
};

export const VsBadge: React.FC<{f: number; y?: number}> = ({f, y = 900}) => {
  const {fps} = useVideoConfig();
  const pop = spring({frame: f - 4, fps, config: {damping: 9}, durationInFrames: 14});
  return (
    <g transform={`translate(540 ${y}) scale(${pop}) rotate(${Math.sin(f / 7) * 4})`}>
      <circle r={92} fill="#c9412f" stroke={INK} strokeWidth={10} />
      <circle r={74} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="12 10" />
      <text y={30} textAnchor="middle" fontSize={84} fontWeight={900} fill="#fff" stroke={INK} strokeWidth={6} paintOrder="stroke" fontFamily={FONT} fontStyle="italic">
        VS
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Transition overlays
// ---------------------------------------------------------------------------
export const FlashFx: React.FC<{f: number}> = ({f}) => {
  const o = interpolate(f, [0, 3, 12], [1, 1, 0], clamp);
  return o > 0 ? <rect width={W} height={H} fill="#fff" opacity={o} /> : null;
};

export const RewindFx: React.FC<{f: number; seed: number}> = ({f, seed}) => {
  // strongest while the previous scene runs backwards, decays into the new one
  const k = f < REWIND_BACK ? 1 : interpolate(f, [REWIND_BACK, TRANS_LEN.rewind], [0.8, 0], clamp);
  if (k <= 0) return null;
  const band = ((f * 97) % H) - 120;
  return (
    <g opacity={k}>
      <rect width={W} height={H} fill="url(#scan)" />
      <rect y={band} width={W} height={120} fill="#fff" opacity={0.12} />
      <rect y={band + 40} width={W} height={14} fill="#fff" opacity={0.35} />
      {Array.from({length: 6}, (_, i) => (
        <rect key={i} x={rand(seed + i + f) * 300 - 150} y={rand(seed + i * 7 + f) * H} width={W} height={6 + rand(i + f) * 18} fill={i % 2 ? '#5ff' : '#f5a'} opacity={0.35} />
      ))}
      {f < REWIND_BACK && f % 8 < 6 ? (
        <g transform="translate(1000 300)">
          <text textAnchor="end" fontSize={74} fontWeight={900} fill="#fff" stroke={INK} strokeWidth={8} paintOrder="stroke" fontFamily={FONT}>
            &#9664;&#9664; REWIND
          </text>
        </g>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Year stamp (any scene with `year`) + persistent rail (mundur)
// ---------------------------------------------------------------------------
export const YearStamp: React.FC<{f: number; year: string; note?: string; accent: string}> = ({f, year, note, accent}) => {
  const {fps} = useVideoConfig();
  if (f < 0 || f > 58) return null;
  const pop = spring({frame: f, fps, config: {damping: 10, mass: 0.7}, durationInFrames: 14});
  const s = interpolate(pop, [0, 1], [2.6, 1]);
  const o = interpolate(f, [0, 2, 42, 56], [0, 1, 1, 0], clamp);
  return (
    <g opacity={o} transform={`translate(540 560) rotate(-6) scale(${s})`}>
      <rect x={-330} y={-150} width={660} height={note ? 250 : 190} rx={10} fill={accent} stroke={INK} strokeWidth={12} />
      <rect x={-306} y={-128} width={612} height={note ? 206 : 146} rx={6} fill="none" stroke={INK} strokeWidth={5} strokeDasharray="14 10" />
      <text y={8} textAnchor="middle" fontSize={170} fontWeight={900} fill={INK} fontFamily={FONT} letterSpacing={4}>
        {year}
      </text>
      {note ? (
        <text y={78} textAnchor="middle" fontSize={44} fontWeight={900} fill={INK} fontFamily={FONT}>
          {note}
        </text>
      ) : null}
    </g>
  );
};

export const YearRail: React.FC<{years: number[]; from: number; to: number; f: number; accent: string}> = ({years, from, to, f, accent}) => {
  const {fps} = useVideoConfig();
  if (!years.length) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  const xOf = (y: number) => (max === min ? 540 : 110 + ((y - min) / (max - min)) * 860);
  const t = spring({frame: f, fps, config: {damping: 15}, durationInFrames: 22});
  const cx = interpolate(t, [0, 1], [xOf(from), xOf(to)]);
  const y = 168;
  return (
    <g>
      <rect x={70} y={y - 50} width={940} height={100} rx={24} fill="#0e0f16" opacity={0.72} />
      <line x1={110} y1={y} x2={970} y2={y} stroke="#ffffff55" strokeWidth={6} strokeLinecap="round" />
      {years.map((yr) => (
        <g key={yr}>
          <circle cx={xOf(yr)} cy={y} r={9} fill={yr === to ? accent : '#ffffffaa'} />
          <text x={xOf(yr)} y={y + 40} textAnchor="middle" fontSize={24} fontWeight={800} fill="#ffffffcc" fontFamily="Arial, sans-serif">
            {yr}
          </text>
        </g>
      ))}
      <g transform={`translate(${cx} ${y})`}>
        <circle r={20} fill={accent} stroke={INK} strokeWidth={6} />
        <path d="M0 -26 L-12 -46 H12 Z" fill={accent} stroke={INK} strokeWidth={4} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Tebak Siapa HUD + reveal confetti
// ---------------------------------------------------------------------------
export const TebakHud: React.FC<{f: number; hint: number; accent: string}> = ({f, hint, accent}) => {
  const {fps} = useVideoConfig();
  const pop = spring({frame: f, fps, config: {damping: 11}, durationInFrames: 12});
  const wob = Math.sin(f / 6) * 3;
  return (
    <g>
      <g transform={`translate(540 150) rotate(${wob})`}>
        <rect x={-250} y={-62} width={500} height={124} rx={62} fill={accent} stroke={INK} strokeWidth={10} />
        <text y={24} textAnchor="middle" fontSize={68} fontWeight={900} fill={INK} fontFamily={FONT}>
          SIAPA DIA?
        </text>
      </g>
      <g transform={`translate(540 278) scale(${pop})`}>
        <rect x={-150} y={-36} width={300} height={72} rx={14} fill="#0e0f16" stroke="#fff" strokeWidth={4} />
        <text y={14} textAnchor="middle" fontSize={38} fontWeight={900} fill="#fff" fontFamily={FONT}>
          PETUNJUK #{hint}
        </text>
      </g>
    </g>
  );
};

export const Confetti: React.FC<{f: number; colors: string[]}> = ({f, colors}) => {
  if (f > 70) return null;
  return (
    <g>
      {Array.from({length: 70}, (_, i) => {
        const a = rand(i + 3) * Math.PI * 2;
        const v = 18 + rand(i + 11) * 26;
        const x = 540 + Math.cos(a) * v * f;
        const y = 760 + Math.sin(a) * v * f + 0.9 * f * f;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={18}
            height={30}
            fill={colors[i % colors.length]}
            stroke={INK}
            strokeWidth={3}
            transform={`rotate(${f * 12 + i * 40} ${x + 9} ${y + 15})`}
            opacity={interpolate(f, [50, 70], [1, 0], clamp)}
          />
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Duel HUD: scoreboard + round banner + "+1" float
// ---------------------------------------------------------------------------
export const Scoreboard: React.FC<{
  nameA: string;
  nameB: string;
  a: number;
  b: number;
  accentA: string;
  accentB: string;
  bumpA: number; // frames since A last scored (or large)
  bumpB: number;
}> = ({nameA, nameB, a, b, accentA, accentB, bumpA, bumpB}) => {
  const {fps} = useVideoConfig();
  const pa = 1 + 0.45 * (1 - spring({frame: bumpA, fps, config: {damping: 8}, durationInFrames: 16}));
  const pb = 1 + 0.45 * (1 - spring({frame: bumpB, fps, config: {damping: 8}, durationInFrames: 16}));
  const y = 140;
  return (
    <g>
      <path d={`M40 ${y - 62} H520 L500 ${y + 62} H40 Z`} fill={accentA} stroke={INK} strokeWidth={9} />
      <path d={`M1040 ${y - 62} H560 L580 ${y + 62} H1040 Z`} fill={accentB} stroke={INK} strokeWidth={9} />
      <text x={70} y={y + 16} fontSize={46} fontWeight={900} fill={INK} fontFamily={FONT}>
        {nameA}
      </text>
      <text x={1010} y={y + 16} textAnchor="end" fontSize={46} fontWeight={900} fill={INK} fontFamily={FONT}>
        {nameB}
      </text>
      <g transform={`translate(440 ${y}) scale(${pa})`}>
        <rect x={-46} y={-50} width={92} height={100} rx={12} fill="#0e0f16" stroke="#fff" strokeWidth={5} />
        <text y={26} textAnchor="middle" fontSize={70} fontWeight={900} fill="#fff" fontFamily={FONT}>
          {a}
        </text>
      </g>
      <g transform={`translate(640 ${y}) scale(${pb})`}>
        <rect x={-46} y={-50} width={92} height={100} rx={12} fill="#0e0f16" stroke="#fff" strokeWidth={5} />
        <text y={26} textAnchor="middle" fontSize={70} fontWeight={900} fill="#fff" fontFamily={FONT}>
          {b}
        </text>
      </g>
    </g>
  );
};

export const RoundBanner: React.FC<{f: number; round: string; n: number; accent: string}> = ({f, round, n, accent}) => {
  if (f < 0 || f > 80) return null;
  const inX = interpolate(f, [0, 10], [-1100, 0], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const outX = interpolate(f, [62, 76], [0, 1100], {...clamp, easing: (t) => t * t});
  return (
    <g transform={`translate(${inX + outX} 0)`}>
      <path d="M0 290 H1080 V470 H0 Z" fill="#0e0f16" opacity={0.86} />
      <path d="M0 290 H1080 V302 H0 Z M0 458 H1080 V470 H0 Z" fill={accent} />
      <text x={540} y={352} textAnchor="middle" fontSize={40} fontWeight={900} fill={accent} fontFamily={FONT} letterSpacing={8}>
        RONDE {n}
      </text>
      <text x={540} y={430} textAnchor="middle" fontSize={70} fontWeight={900} fill="#fff" fontFamily={FONT}>
        {round}
      </text>
    </g>
  );
};

export const PointFloat: React.FC<{f: number; side: 'a' | 'b'; accent: string}> = ({f, side, accent}) => {
  if (f < 0 || f > 45) return null;
  const x = side === 'a' ? 440 : 640;
  const y = interpolate(f, [0, 45], [330, 230]);
  const o = interpolate(f, [0, 6, 34, 45], [0, 1, 1, 0], clamp);
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={96} fontWeight={900} fill={accent} stroke={INK} strokeWidth={9} paintOrder="stroke" fontFamily={FONT} opacity={o}>
      +1
    </text>
  );
};

export const Vignette: React.FC = () => <rect width={W} height={H} fill="url(#vignette)" />;
