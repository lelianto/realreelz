// "Explainer" template: Premium Modern Vector Explainer (Kurzgesagt / Vox style).
// Features full proportional vector characters with natural breathing, blinking,
// expressive gestures, multi-layer depth environments (parallax), atmospheric particles,
// visual metaphors (iceberg, rocket, brain, desk, lab, cosmos), and kinetic typography.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type ExplainerWord = {text: string; fromMs: number; toMs: number};

export type ExplainerPose =
  | 'idle'
  | 'talking'
  | 'thinking'
  | 'eureka'
  | 'presenting'
  | 'holding'
  | 'shrug'
  | 'celebrate'
  | 'crossed';

export type ExplainerMood = 'happy' | 'thinking' | 'shock' | 'determined' | 'sad' | 'neutral';

export type ExplainerScene = {
  kind: string; // hook | brain | desk | maze | eureka | rocket | iceberg | lab | trophy | cosmos | custom
  cue: string | null;
  label?: string; // headline pill for this scene
  sub?: string; // small supporting tagline
  pose?: ExplainerPose;
  mood?: ExplainerMood;
  quote?: string;
  author?: string;
  prop?: 'coffee' | 'phone' | 'flask' | 'book' | 'coin' | 'bulb' | 'none';
  // optional custom params
  stat?: string;
  statLabel?: string;
};

const W = 1080;
const H = 1920;

// ============================================================================
// Modern Explainer Color Palette
// ============================================================================
export const PALETTE = {
  // Atmospheric Backgrounds
  deepNavy: '#0c1222',
  spaceMid: '#162038',
  slateDark: '#1a1d2e',
  warmCharcoal: '#181920',
  indigoGlow: '#2e3a59',
  
  // Vibrant Accents (Kurzgesagt style)
  electricYellow: '#ffd23f',
  vibrantCyan: '#26d0ce',
  coralPink: '#ff5e62',
  emeraldMint: '#00e676',
  royalPurple: '#8a2be2',
  goldWarm: '#ffb300',
  
  // Character skin & clothing defaults
  skinWarm: '#ffdbb4',
  skinTan: '#e0ac69',
  skinDark: '#8d5524',
  hairDark: '#201a1e',
  hairBrown: '#4a2c11',
  hairBlonde: '#e6be60',
  hairAuburn: '#8b3a1d',
  
  // Outfits
  hoodieTeal: '#1b8a8f',
  jacketIndigo: '#2b3a67',
  shirtWhite: '#f4f6fa',
  pantsNavy: '#1b233a',
  sneakerWhite: '#ffffff',
  
  // Outlines & details
  ink: '#11131a',
  inkLight: '#2a2f42',
  white: '#ffffff',
  glassBg: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',
};

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const wrap = (s: string, max: number): string[] => {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines;
};

// ============================================================================
// SVG Gradients & Filters Defs
// ============================================================================
const ExplainerDefs: React.FC = () => (
  <defs>
    {/* Deep Atmospheric Backgrounds */}
    <linearGradient id="expBgDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#080c16" />
      <stop offset="45%" stopColor="#121b2d" />
      <stop offset="85%" stopColor="#1a253c" />
      <stop offset="100%" stopColor="#111728" />
    </linearGradient>

    <linearGradient id="expBgWarm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#151324" />
      <stop offset="50%" stopColor="#251d38" />
      <stop offset="100%" stopColor="#171226" />
    </linearGradient>

    <radialGradient id="expCenterGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stopColor="#3b4f7a" stopOpacity="0.45" />
      <stop offset="65%" stopColor="#222e47" stopOpacity="0.15" />
      <stop offset="100%" stopColor="#121b2d" stopOpacity="0" />
    </radialGradient>

    <radialGradient id="expGoldGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#ffd23f" stopOpacity="0.9" />
      <stop offset="50%" stopColor="#ffb300" stopOpacity="0.3" />
      <stop offset="100%" stopColor="#ffb300" stopOpacity="0" />
    </radialGradient>

    <radialGradient id="expCyanGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#26d0ce" stopOpacity="0.9" />
      <stop offset="55%" stopColor="#1a9391" stopOpacity="0.25" />
      <stop offset="100%" stopColor="#1a9391" stopOpacity="0" />
    </radialGradient>

    <radialGradient id="expVignette" cx="50%" cy="50%" r="70%">
      <stop offset="60%" stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#04060b" stopOpacity="0.85" />
    </radialGradient>

    {/* Shading gradients for character & props */}
    <linearGradient id="charTorsoGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#2b999e" />
      <stop offset="100%" stopColor="#166569" />
    </linearGradient>

    <linearGradient id="charPantsGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#222a42" />
      <stop offset="100%" stopColor="#151b2d" />
    </linearGradient>

    <linearGradient id="rocketGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#f5f7fa" />
      <stop offset="50%" stopColor="#e4e8f0" />
      <stop offset="100%" stopColor="#c5ccdb" />
    </linearGradient>

    <linearGradient id="icebergGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#a5e5e8" />
      <stop offset="35%" stopColor="#43b2bc" />
      <stop offset="100%" stopColor="#0b384d" />
    </linearGradient>

    {/* Shadows & Glow Filters */}
    <filter id="expDropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000" floodOpacity="0.45" />
    </filter>

    <filter id="expGlow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ============================================================================
// Particle Atmosphere (Floating bokeh dots)
// ============================================================================
const FloatingParticles: React.FC<{count?: number; seed?: number}> = ({count = 18, seed = 1}) => {
  const frame = useCurrentFrame();
  const particles = React.useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const px = ((Math.sin(i * 99 + seed) * 0.5 + 0.5) * W);
      const py = ((Math.cos(i * 77 + seed) * 0.5 + 0.5) * H);
      const r = 2.5 + (i % 5) * 1.8;
      const speed = 0.4 + (i % 4) * 0.3;
      const alpha = 0.15 + (i % 6) * 0.1;
      list.push({px, py, r, speed, alpha, i});
    }
    return list;
  }, [count, seed]);

  return (
    <g>
      {particles.map((p) => {
        const floatY = (p.py - frame * p.speed) % H;
        const y = floatY < 0 ? floatY + H : floatY;
        const floatX = p.px + Math.sin((frame + p.i * 20) * 0.04) * 18;
        return (
          <circle
            key={p.i}
            cx={floatX}
            cy={y}
            r={p.r}
            fill="#ffffff"
            opacity={p.alpha}
          />
        );
      })}
    </g>
  );
};

// ============================================================================
// Character Props
// ============================================================================
export interface VectorCharacterProps {
  x: number;
  y: number; // Ground point beneath shoes
  scale?: number;
  mood?: ExplainerMood;
  pose?: ExplainerPose;
  talking?: boolean;
  hairStyle?: 'short' | 'wavy' | 'bun' | 'curly';
  hairColor?: string;
  skinColor?: string;
  outfitColor?: string;
  flip?: boolean;
  prop?: 'coffee' | 'phone' | 'flask' | 'book' | 'coin' | 'bulb' | 'none';
}

// ============================================================================
// Fully Proportional Modern Vector Character
// ============================================================================
export const VectorCharacter: React.FC<VectorCharacterProps> = ({
  x,
  y,
  scale = 1,
  mood = 'neutral',
  pose = 'idle',
  talking = false,
  hairStyle = 'short',
  hairColor = PALETTE.hairDark,
  skinColor = PALETTE.skinWarm,
  outfitColor = PALETTE.hoodieTeal,
  flip = false,
  prop = 'none',
}) => {
  const frame = useCurrentFrame();

  // Natural organic idle breathing
  const breath = Math.sin(frame * 0.12) * 5;
  const breathScaleY = 1 + Math.sin(frame * 0.12) * 0.015;

  // Realistic periodic blinking: every ~3.5s, eyes close for 5 frames
  const isBlinking = frame % 105 < 5;

  // Mouth animation during speech
  const isMouthOpen = talking && Math.sin(frame * 0.7) > -0.2;

  // Arm angles based on pose
  let armLAngle = 15;
  let armRAngle = 15;
  let forearmLAngle = 10;
  let forearmRAngle = 10;

  switch (pose) {
    case 'thinking':
      armRAngle = 110;
      forearmRAngle = 120; // Hand touches chin
      armLAngle = 45;
      forearmLAngle = 80; // Other hand supports elbow
      break;
    case 'eureka':
      armRAngle = 155;
      forearmRAngle = 15; // Arm raised high pointing up
      armLAngle = 25;
      forearmLAngle = 20;
      break;
    case 'presenting':
      armRAngle = 75;
      forearmRAngle = 40; // Arm gesturing outward
      armLAngle = 30;
      forearmLAngle = 20;
      break;
    case 'celebrate':
      armLAngle = 145;
      forearmLAngle = 25; // Both arms up high
      armRAngle = 145;
      forearmRAngle = 25;
      break;
    case 'shrug':
      armLAngle = 55;
      forearmLAngle = 65; // Palms facing up
      armRAngle = 55;
      forearmRAngle = 65;
      break;
    case 'crossed':
      armLAngle = 85;
      forearmLAngle = 85;
      armRAngle = 85;
      forearmRAngle = 85;
      break;
    case 'holding':
      armRAngle = 70;
      forearmRAngle = 75; // Holding prop in front
      armLAngle = 20;
      forearmLAngle = 15;
      break;
    case 'talking':
    case 'idle':
    default:
      // Subtle organic arm swaying
      armLAngle = 18 + Math.sin(frame * 0.08) * 4;
      armRAngle = 18 - Math.sin(frame * 0.08) * 4;
      forearmLAngle = 15;
      forearmRAngle = 15;
      break;
  }

  // Eyebrow geometry based on mood
  let eyebrowLRot = 0;
  let eyebrowRRot = 0;
  let eyebrowY = -28;
  if (mood === 'thinking') {
    eyebrowLRot = -15;
    eyebrowRRot = 20; // One raised, one down
    eyebrowY = -32;
  } else if (mood === 'shock') {
    eyebrowLRot = -20;
    eyebrowRRot = 20;
    eyebrowY = -36;
  } else if (mood === 'determined') {
    eyebrowLRot = 18;
    eyebrowRRot = -18;
    eyebrowY = -26;
  } else if (mood === 'sad') {
    eyebrowLRot = -18;
    eyebrowRRot = 18;
    eyebrowY = -24;
  }

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${(flip ? -1 : 1) * scale}, ${scale})`}
      filter="url(#expDropShadow)"
    >
      {/* Ground Contact Shadow */}
      <ellipse cx={0} cy={-6} rx={95} ry={16} fill="rgba(6, 9, 16, 0.55)" />

      {/* --- LEGS & SHOES --- */}
      {/* Left Leg */}
      <g transform="translate(-32, -260)">
        <path
          d="M-18,0 L-14,240 Q-14,260 0,260 L18,260 L16,0 Z"
          fill={PALETTE.pantsNavy}
          stroke={PALETTE.ink}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        {/* Left Shoe */}
        <g transform="translate(-2, 255)">
          <path
            d="M-22,-2 L-22,-20 Q-15,-28 10,-28 L28,-18 Q40,-2 38,10 L-22,10 Z"
            fill={PALETTE.sneakerWhite}
            stroke={PALETTE.ink}
            strokeWidth={5}
          />
          {/* Sole strip */}
          <rect x={-22} y={4} width={60} height={6} rx={2} fill={PALETTE.electricYellow} />
        </g>
      </g>

      {/* Right Leg */}
      <g transform="translate(32, -260)">
        <path
          d="M-16,0 L-18,260 L0,260 Q14,260 14,240 L18,0 Z"
          fill={PALETTE.pantsNavy}
          stroke={PALETTE.ink}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        {/* Right Shoe */}
        <g transform="translate(2, 255)">
          <path
            d="M-28,-18 Q-10,-28 15,-28 L22,-20 L22,10 L-38,10 Q-40,-2 -28,-18 Z"
            fill={PALETTE.sneakerWhite}
            stroke={PALETTE.ink}
            strokeWidth={5}
          />
          {/* Sole strip */}
          <rect x={-38} y={4} width={60} height={6} rx={2} fill={PALETTE.electricYellow} />
        </g>
      </g>

      {/* --- TORSO & UPPER BODY --- (Breathes with scaleY) */}
      <g transform={`translate(0, ${-260 + breath * 0.4}) scale(1, ${breathScaleY})`}>
        {/* Waist & Hips */}
        <path
          d="M-60,0 Q0,10 60,0 L56,-45 L-56,-45 Z"
          fill={PALETTE.pantsNavy}
          stroke={PALETTE.ink}
          strokeWidth={6}
        />

        {/* Hoodie / Jacket Torso */}
        <path
          d="M-68,-40 L-76,-210 Q-74,-240 0,-240 Q74,-240 76,-210 L68,-40 Q0,-30 -68,-40 Z"
          fill={outfitColor}
          stroke={PALETTE.ink}
          strokeWidth={8}
          strokeLinejoin="round"
        />

        {/* Kangaroo Pocket / Seam */}
        <path
          d="M-42,-70 L-42,-120 Q0,-105 42,-120 L42,-70 Q0,-60 -42,-70 Z"
          fill="rgba(0,0,0,0.12)"
          stroke={PALETTE.ink}
          strokeWidth={4}
        />

        {/* Collar / V-neck inner shirt */}
        <path d="M-26,-238 L0,-185 L26,-238 Z" fill={PALETTE.shirtWhite} stroke={PALETTE.ink} strokeWidth={5} />
        {/* Hoodie drawstrings */}
        <line x1={-12} y1={-200} x2={-12} y2={-140} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" />
        <line x1={12} y1={-200} x2={12} y2={-140} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" />
      </g>

      {/* --- LEFT ARM (2 Segments) --- */}
      <g transform={`translate(-72, ${-475 + breath * 0.6}) rotate(${armLAngle})`}>
        {/* Upper Arm */}
        <path
          d="M-18,-8 L18,-8 L14,110 L-14,110 Z"
          fill={outfitColor}
          stroke={PALETTE.ink}
          strokeWidth={7}
          strokeLinejoin="round"
        />
        {/* Forearm & Hand */}
        <g transform={`translate(0, 105) rotate(${forearmLAngle})`}>
          <path
            d="M-14,0 L14,0 L11,95 L-11,95 Z"
            fill={outfitColor}
            stroke={PALETTE.ink}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          {/* Hand */}
          <circle cx={0} cy={110} r={18} fill={skinColor} stroke={PALETTE.ink} strokeWidth={5} />
        </g>
      </g>

      {/* --- RIGHT ARM (2 Segments) --- */}
      <g transform={`translate(72, ${-475 + breath * 0.6}) rotate(${-armRAngle})`}>
        {/* Upper Arm */}
        <path
          d="M-18,-8 L18,-8 L14,110 L-14,110 Z"
          fill={outfitColor}
          stroke={PALETTE.ink}
          strokeWidth={7}
          strokeLinejoin="round"
        />
        {/* Forearm & Hand */}
        <g transform={`translate(0, 105) rotate(${-forearmRAngle})`}>
          <path
            d="M-14,0 L14,0 L11,95 L-11,95 Z"
            fill={outfitColor}
            stroke={PALETTE.ink}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          {/* Hand */}
          <circle cx={0} cy={110} r={18} fill={skinColor} stroke={PALETTE.ink} strokeWidth={5} />

          {/* Attached Props in Hand */}
          {prop === 'coffee' && (
            <g transform="translate(18, 100)">
              <rect x={-14} y={-24} width={28} height={36} rx={6} fill="#ffffff" stroke={PALETTE.ink} strokeWidth={4} />
              <rect x={-16} y={-26} width={32} height={8} rx={2} fill={PALETTE.electricYellow} />
              <path d="M14,-16 Q24,-16 24,-6 Q24,4 14,4" fill="none" stroke={PALETTE.ink} strokeWidth={4} />
              {/* Steam */}
              <path
                d="M-4,-34 Q-8,-44 -4,-54 M4,-34 Q8,-44 4,-54"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={3}
                strokeLinecap="round"
              />
            </g>
          )}

          {prop === 'phone' && (
            <g transform="translate(14, 90) rotate(15)">
              <rect x={-16} y={-30} width={32} height={56} rx={8} fill="#232733" stroke={PALETTE.ink} strokeWidth={4} />
              <rect x={-13} y={-26} width={26} height={48} rx={4} fill={PALETTE.vibrantCyan} />
            </g>
          )}

          {prop === 'flask' && (
            <g transform="translate(18, 105)">
              <path
                d="M-8,-26 L8,-26 L8,-12 L24,18 Q26,24 20,28 L-20,28 Q-26,24 -24,18 L-8,-12 Z"
                fill="rgba(0, 230, 118, 0.45)"
                stroke={PALETTE.ink}
                strokeWidth={4}
              />
              <path d="M-18,22 L18,22 L15,10 L-15,10 Z" fill={PALETTE.emeraldMint} />
            </g>
          )}

          {prop === 'bulb' && (
            <g transform="translate(25, 95)" filter="url(#expGlow)">
              <circle cx={0} cy={-20} r={22} fill={PALETTE.electricYellow} stroke={PALETTE.ink} strokeWidth={4} />
              <rect x={-10} y={0} width={20} height={12} fill="#bbb" stroke={PALETTE.ink} strokeWidth={3} />
            </g>
          )}

          {prop === 'coin' && (
            <g transform="translate(20, 105)">
              <circle cx={0} cy={0} r={20} fill={PALETTE.goldWarm} stroke={PALETTE.ink} strokeWidth={4} />
              <text x={0} y={7} textAnchor="middle" fontSize={22} fontWeight="900" fill="#ffffff">
                $
              </text>
            </g>
          )}
        </g>
      </g>

      {/* --- NECK & HEAD --- */}
      <g transform={`translate(0, ${-505 + breath * 0.7})`}>
        {/* Neck */}
        <rect x={-18} y={-24} width={36} height={36} rx={6} fill={skinColor} stroke={PALETTE.ink} strokeWidth={6} />
        {/* Neck Shadow under chin */}
        <path d="M-18,-8 Q0,6 18,-8 L18,-2 L-18,-2 Z" fill="rgba(0,0,0,0.14)" />

        {/* Head Base */}
        <circle cx={0} cy={-85} r={72} fill={skinColor} stroke={PALETTE.ink} strokeWidth={7} />

        {/* Ears */}
        <ellipse cx={-72} cy={-82} rx={12} ry={18} fill={skinColor} stroke={PALETTE.ink} strokeWidth={5} />
        <ellipse cx={72} cy={-82} rx={12} ry={18} fill={skinColor} stroke={PALETTE.ink} strokeWidth={5} />

        {/* Hair Styles */}
        {hairStyle === 'short' && (
          <path
            d="M-74,-90 C-82,-175 68,-185 76,-90 C50,-140 -2,-145 -35,-125 C-52,-115 -65,-100 -74,-90 Z"
            fill={hairColor}
            stroke={PALETTE.ink}
            strokeWidth={7}
            strokeLinejoin="round"
          />
        )}

        {hairStyle === 'wavy' && (
          <path
            d="M-75,-85 C-90,-180 85,-185 76,-85 C78,-50 72,-30 65,-20 C55,-50 50,-120 10,-125 C-30,-130 -60,-80 -65,-20 C-72,-30 -78,-50 -75,-85 Z"
            fill={hairColor}
            stroke={PALETTE.ink}
            strokeWidth={7}
            strokeLinejoin="round"
          />
        )}

        {hairStyle === 'bun' && (
          <g>
            <circle cx={0} cy={-175} r={34} fill={hairColor} stroke={PALETTE.ink} strokeWidth={7} />
            <path
              d="M-74,-85 C-80,-165 80,-165 74,-85 C55,-130 -10,-140 -45,-120 C-60,-110 -70,-95 -74,-85 Z"
              fill={hairColor}
              stroke={PALETTE.ink}
              strokeWidth={7}
            />
          </g>
        )}

        {hairStyle === 'curly' && (
          <path
            d="M-75,-85 C-95,-130 -85,-185 -40,-190 C-20,-200 20,-200 40,-190 C85,-185 95,-130 75,-85 C65,-130 30,-150 0,-150 C-30,-150 -65,-130 -75,-85 Z"
            fill={hairColor}
            stroke={PALETTE.ink}
            strokeWidth={7}
          />
        )}

        {/* Eyebrows */}
        <g transform={`translate(-28, ${eyebrowY - 8}) rotate(${eyebrowLRot})`}>
          <rect x={-18} y={-4} width={36} height={9} rx={4} fill={hairColor} />
        </g>
        <g transform={`translate(28, ${eyebrowY - 8}) rotate(${eyebrowRRot})`}>
          <rect x={-18} y={-4} width={36} height={9} rx={4} fill={hairColor} />
        </g>

        {/* Expressive Eyes */}
        <g transform="translate(0, -74)">
          {/* Left Eye */}
          <g transform="translate(-28, 0)">
            {isBlinking ? (
              <line x1={-16} y1={0} x2={16} y2={0} stroke={PALETTE.ink} strokeWidth={6} strokeLinecap="round" />
            ) : (
              <>
                <ellipse cx={0} cy={0} rx={18} ry={mood === 'shock' ? 24 : 20} fill="#ffffff" stroke={PALETTE.ink} strokeWidth={5} />
                <circle cx={mood === 'thinking' ? -3 : 2} cy={mood === 'thinking' ? -5 : 1} r={9} fill={PALETTE.ink} />
                <circle cx={mood === 'thinking' ? -1 : 5} cy={mood === 'thinking' ? -7 : -2} r={3.5} fill="#ffffff" />
              </>
            )}
          </g>

          {/* Right Eye */}
          <g transform="translate(28, 0)">
            {isBlinking ? (
              <line x1={-16} y1={0} x2={16} y2={0} stroke={PALETTE.ink} strokeWidth={6} strokeLinecap="round" />
            ) : (
              <>
                <ellipse cx={0} cy={0} rx={18} ry={mood === 'shock' ? 24 : 20} fill="#ffffff" stroke={PALETTE.ink} strokeWidth={5} />
                <circle cx={mood === 'thinking' ? -3 : 2} cy={mood === 'thinking' ? -5 : 1} r={9} fill={PALETTE.ink} />
                <circle cx={mood === 'thinking' ? -1 : 5} cy={mood === 'thinking' ? -7 : -2} r={3.5} fill="#ffffff" />
              </>
            )}
          </g>
        </g>

        {/* Cute Nose */}
        <path d="M-3,-54 Q5,-50 0,-46" fill="none" stroke={PALETTE.ink} strokeWidth={5} strokeLinecap="round" />

        {/* Expressive Mouth */}
        <g transform="translate(0, -32)">
          {isMouthOpen ? (
            <path d="M-18,-6 Q0,18 18,-6 Z" fill="#b72d2d" stroke={PALETTE.ink} strokeWidth={5} strokeLinejoin="round">
              {/* Teeth */}
              <rect x={-9} y={-6} width={18} height={6} rx={2} fill="#ffffff" />
            </path>
          ) : mood === 'happy' ? (
            <path d="M-18,-6 Q0,16 18,-6" fill="none" stroke={PALETTE.ink} strokeWidth={6} strokeLinecap="round" />
          ) : mood === 'shock' ? (
            <ellipse cx={0} cy={2} rx={12} ry={16} fill="#b72d2d" stroke={PALETTE.ink} strokeWidth={5} />
          ) : mood === 'sad' ? (
            <path d="M-16,8 Q0,-6 16,8" fill="none" stroke={PALETTE.ink} strokeWidth={6} strokeLinecap="round" />
          ) : (
            // Neutral friendly smirk
            <path d="M-15,-2 Q0,6 15,-2" fill="none" stroke={PALETTE.ink} strokeWidth={5} strokeLinecap="round" />
          )}
        </g>
      </g>
    </g>
  );
};

// ============================================================================
// STORYTELLING VISUAL METAPHORS & SCENE SETS
// ============================================================================

// 1. Brain & Synapses (Psychology, Mental Models, Mindset)
export const HoloBrain: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * 0.15) * 0.04;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale * pulse})`} filter="url(#expGlow)">
      {/* Outer energy aura */}
      <circle cx={0} cy={0} r={170} fill="none" stroke={PALETTE.vibrantCyan} strokeWidth={2} strokeDasharray="12 8" opacity={0.4} />
      <circle cx={0} cy={0} r={210} fill="none" stroke={PALETTE.electricYellow} strokeWidth={2} strokeDasharray="6 14" opacity={0.3} />

      {/* Stylized Brain Hemisphere Paths */}
      <path
        d="M-40,-90 C-90,-80 -130,-40 -120,20 C-115,55 -90,95 -45,100 C-15,105 0,85 0,60 L0,-75 C0,-85 -20,-95 -40,-90 Z"
        fill="rgba(38, 208, 206, 0.2)"
        stroke={PALETTE.vibrantCyan}
        strokeWidth={7}
      />
      <path
        d="M40,-90 C90,-80 130,-40 120,20 C115,55 90,95 45,100 C15,105 0,85 0,60 L0,-75 C0,-85 20,-95 40,-90 Z"
        fill="rgba(38, 208, 206, 0.25)"
        stroke={PALETTE.vibrantCyan}
        strokeWidth={7}
      />

      {/* Internal Synaptic Curves */}
      <path d="M-70,-20 C-40,-50 -20,10 -60,40" fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" />
      <path d="M70,-20 C40,-50 20,10 60,40" fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" />
      <path d="M-25,-55 Q-60,-70 -30,-20" fill="none" stroke={PALETTE.electricYellow} strokeWidth={5} strokeLinecap="round" />
      <path d="M25,-55 Q60,-70 30,-20" fill="none" stroke={PALETTE.electricYellow} strokeWidth={5} strokeLinecap="round" />

      {/* Sparkling Idea Synapses */}
      {[-60, 0, 70, -45, 50].map((cx, i) => {
        const cy = [-40, -90, -30, 60, 50][i];
        const spark = Math.sin((frame + i * 25) * 0.2) > 0.3;
        return spark ? (
          <circle key={i} cx={cx} cy={cy} r={9} fill={PALETTE.electricYellow} />
        ) : null;
      })}
    </g>
  );
};

// 2. Growth Rocket & Upward Chart (Breakthrough, Success, Scaling)
export const GrowthRocket: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => {
  const frame = useCurrentFrame();
  const launchY = interpolate(frame, [0, 40], [60, -80], {extrapolateRight: 'clamp'});
  const flameWobble = Math.sin(frame * 0.8) * 6;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Upward Chart Line */}
      <path
        d="M-280,180 Q-120,160 0,60 T240,-120"
        fill="none"
        stroke={PALETTE.emeraldMint}
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* Chart grid background */}
      <line x1={-300} y1={190} x2={300} y2={190} stroke="rgba(255,255,255,0.18)" strokeWidth={4} />

      {/* Flying Rocket */}
      <g transform={`translate(140, ${-60 + launchY}) rotate(38)`} filter="url(#expDropShadow)">
        {/* Rocket Body */}
        <path
          d="M0,-85 C24,-45 28,30 28,50 L-28,50 C-28,30 -24,-45 0,-85 Z"
          fill="url(#rocketGrad)"
          stroke={PALETTE.ink}
          strokeWidth={6}
        />
        {/* Fins */}
        <path d="M-28,25 L-56,65 L-26,50 Z" fill={PALETTE.coralPink} stroke={PALETTE.ink} strokeWidth={5} />
        <path d="M28,25 L56,65 L26,50 Z" fill={PALETTE.coralPink} stroke={PALETTE.ink} strokeWidth={5} />
        {/* Porthole */}
        <circle cx={0} cy={-15} r={16} fill={PALETTE.vibrantCyan} stroke={PALETTE.ink} strokeWidth={5} />
        <circle cx={4} cy={-18} r={5} fill="#ffffff" />
        {/* Fire Exhaust */}
        <path
          d={`M-18,52 Q0,${105 + flameWobble} 18,52 Q0,${75} -18,52 Z`}
          fill={PALETTE.electricYellow}
          stroke={PALETTE.coralPink}
          strokeWidth={4}
        />
      </g>

      {/* Cloud Puffs */}
      <ellipse cx={80} cy={140} rx={75} ry={45} fill="rgba(255,255,255,0.85)" />
      <ellipse cx={150} cy={155} rx={60} ry={38} fill="rgba(255,255,255,0.95)" />
      <ellipse cx={20} cy={165} rx={50} ry={30} fill="rgba(255,255,255,0.75)" />
    </g>
  );
};

// 3. The Iceberg Metaphor (Survivorship bias, hidden effort, iceberg theory)
export const IcebergMetaphor: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => {
  const frame = useCurrentFrame();
  const waterWave = Math.sin(frame * 0.1) * 6;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Water line */}
      <line x1={-360} y1={0} x2={360} y2={0} stroke={PALETTE.vibrantCyan} strokeWidth={8} strokeDasharray="16 10" />

      {/* Deep Underwater Section (The Hidden Reality) */}
      <polygon
        points="-60,10 -220,90 -280,260 -160,390 120,410 260,280 180,90 60,10"
        fill="url(#icebergGrad)"
        stroke={PALETTE.ink}
        strokeWidth={7}
        opacity={0.88}
      />
      {/* Underwater Facets */}
      <line x1={-60} y1={10} x2={-160} y2={390} stroke="rgba(255,255,255,0.2)" strokeWidth={5} />
      <line x1={60} y1={10} x2={120} y2={410} stroke="rgba(255,255,255,0.18)" strokeWidth={5} />
      <line x1={-220} y1={90} x2={0} y2={250} stroke="rgba(0,0,0,0.3)" strokeWidth={5} />

      {/* Above Water Tip (What People See) */}
      <polygon
        points={`-60,${waterWave} -10,-150 20,-160 65,${waterWave}`}
        fill="#ffffff"
        stroke={PALETTE.ink}
        strokeWidth={7}
      />
      <polygon points={`-25,${waterWave} -10,-150 20,-160 15,${waterWave}`} fill="#e2f6fa" />

      {/* Labels - positioned on the left side to avoid collision with character */}
      <g transform="translate(-320, -90)">
        <rect x={0} y={-30} width={220} height={48} rx={12} fill="#ffffff" stroke={PALETTE.ink} strokeWidth={4} />
        <text x={110} y={2} textAnchor="middle" fontSize={22} fontWeight="900" fill={PALETTE.ink}>
          YANG TERLIHAT
        </text>
      </g>

      <g transform="translate(-340, 240)">
        <rect x={0} y={-30} width={250} height={48} rx={12} fill="rgba(12,18,34,0.85)" stroke={PALETTE.vibrantCyan} strokeWidth={3} />
        <text x={125} y={2} textAnchor="middle" fontSize={22} fontWeight="900" fill={PALETTE.vibrantCyan}>
          YANG TERSEMBUNYI
        </text>
      </g>
    </g>
  );
};

// 4. Late-Night Workspace (Hard work, study, coding, writing)
export const DeskEnvironment: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => {
  const frame = useCurrentFrame();
  const screenGlow = 0.85 + Math.sin(frame * 0.2) * 0.15;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Background Window with Rain */}
      <g transform="translate(-180, -320)">
        <rect x={0} y={0} width={220} height={260} rx={16} fill="#0d1424" stroke="rgba(255,255,255,0.2)" strokeWidth={6} />
        {/* Window Pane Divider */}
        <line x1={110} y1={0} x2={110} y2={260} stroke="rgba(255,255,255,0.18)" strokeWidth={5} />
        <line x1={0} y1={130} x2={220} y2={130} stroke="rgba(255,255,255,0.18)" strokeWidth={5} />
        {/* Rain streaks */}
        {[-30, 20, 70, 140].map((rx, idx) => (
          <line
            key={idx}
            x1={rx}
            y1={(frame * 8 + idx * 45) % 240}
            x2={rx - 15}
            y2={((frame * 8 + idx * 45) % 240) + 30}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Desk Lamp Casting Light Cone */}
      <g transform="translate(190, -280)">
        {/* Lamp Base & Neck */}
        <path d="M0,160 L-30,40 L-60,30" fill="none" stroke={PALETTE.goldWarm} strokeWidth={8} strokeLinecap="round" />
        <ellipse cx={0} cy={165} rx={34} ry={10} fill={PALETTE.goldWarm} stroke={PALETTE.ink} strokeWidth={5} />
        {/* Lamp Shade */}
        <polygon points="-85,15 -35,15 -20,55 -100,55" fill={PALETTE.goldWarm} stroke={PALETTE.ink} strokeWidth={5} />
        {/* Light Cone */}
        <polygon points="-60,55 -220,180 80,180" fill="url(#expGoldGlow)" opacity={0.35} />
      </g>

      {/* Desk Table */}
      <rect x={-320} y={-100} width={640} height={35} rx={6} fill="#3e2e20" stroke={PALETTE.ink} strokeWidth={7} />
      <rect x={-300} y={-65} width={40} height={180} fill="#291e15" stroke={PALETTE.ink} strokeWidth={6} />
      <rect x={260} y={-65} width={40} height={180} fill="#291e15" stroke={PALETTE.ink} strokeWidth={6} />

      {/* Glowing Laptop */}
      <g transform="translate(-40, -100)">
        {/* Laptop Screen */}
        <polygon points="-65,-80 65,-80 75,-5 -75,-5" fill="#1b2333" stroke={PALETTE.ink} strokeWidth={5} />
        <polygon
          points="-58,-74 58,-74 67,-10 -67,-10"
          fill={PALETTE.vibrantCyan}
          opacity={screenGlow}
          filter="url(#expGlow)"
        />
        {/* Code / Text Lines on screen */}
        <line x1={-45} y1={-60} x2={10} y2={-60} stroke="#ffffff" strokeWidth={4} />
        <line x1={-45} y1={-46} x2={35} y2={-46} stroke="#ffffff" strokeWidth={4} />
        <line x1={-45} y1={-32} x2={-10} y2={-32} stroke={PALETTE.electricYellow} strokeWidth={4} />
        {/* Base / Keyboard */}
        <polygon points="-90,0 90,0 80,-5 -80,-5" fill="#c4cad6" stroke={PALETTE.ink} strokeWidth={5} />
      </g>

      {/* Stack of Books */}
      <g transform="translate(-230, -100)">
        <rect x={-45} y={-24} width={90} height={24} rx={4} fill={PALETTE.coralPink} stroke={PALETTE.ink} strokeWidth={4} />
        <rect x={-40} y={-44} width={80} height={20} rx={4} fill={PALETTE.electricYellow} stroke={PALETTE.ink} strokeWidth={4} />
        <rect x={-48} y={-66} width={96} height={22} rx={4} fill={PALETTE.vibrantCyan} stroke={PALETTE.ink} strokeWidth={4} />
      </g>
    </g>
  );
};

// 5. Giant Eureka Lightbulb (Epiphany, Discovery, Invention)
export const EurekaBulb: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame * 0.2) * 0.05;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale * pulse})`}>
      {/* Radiating Energy Rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <line
          key={deg}
          x1={Math.sin((deg * Math.PI) / 180) * 160}
          y1={Math.cos((deg * Math.PI) / 180) * 160}
          x2={Math.sin((deg * Math.PI) / 180) * 220}
          y2={Math.cos((deg * Math.PI) / 180) * 220}
          stroke={PALETTE.electricYellow}
          strokeWidth={8}
          strokeLinecap="round"
          opacity={0.75}
        />
      ))}

      {/* Outer Glow Orb */}
      <circle cx={0} cy={-20} r={170} fill="url(#expGoldGlow)" opacity={0.6} />

      {/* Glass Bulb Body */}
      <path
        d="M-75,-50 C-115,-120 115,-120 75,-50 C55,-15 45,25 40,65 L-40,65 C-45,25 -55,-15 -75,-50 Z"
        fill={PALETTE.electricYellow}
        stroke={PALETTE.ink}
        strokeWidth={9}
      />

      {/* Inner Glowing Filament */}
      <path
        d="M-26,65 L-20,-10 L-10,-40 L0,-10 L10,-40 L20,-10 L26,65"
        fill="none"
        stroke="#ffffff"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#expGlow)"
      />

      {/* Screw Base */}
      <rect x={-36} y={65} width={72} height={20} rx={4} fill="#888f9e" stroke={PALETTE.ink} strokeWidth={6} />
      <rect x={-32} y={85} width={64} height={18} rx={4} fill="#888f9e" stroke={PALETTE.ink} strokeWidth={6} />
      <polygon points="-24,103 24,103 14,120 -14,120" fill="#444a56" stroke={PALETTE.ink} strokeWidth={5} />
    </g>
  );
};

// 6. Grand Trophy / Golden Medal (Legacy, Nobel, Ultimate Achievement)
export const GoldenTrophy: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => {
  const frame = useCurrentFrame();
  const shimmer = (frame * 12) % 360;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} filter="url(#expDropShadow)">
      {/* Laurel Wreath Behind */}
      <path
        d="M-150,40 C-180,-80 -90,-160 -10,-190"
        fill="none"
        stroke={PALETTE.emeraldMint}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <path
        d="M150,40 C180,-80 90,-160 10,-190"
        fill="none"
        stroke={PALETTE.emeraldMint}
        strokeWidth={14}
        strokeLinecap="round"
      />

      {/* Trophy Handles */}
      <path
        d="M-75,-60 C-145,-60 -145,30 -75,30"
        fill="none"
        stroke={PALETTE.goldWarm}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <path
        d="M75,-60 C145,-60 145,30 75,30"
        fill="none"
        stroke={PALETTE.goldWarm}
        strokeWidth={14}
        strokeLinecap="round"
      />

      {/* Trophy Cup */}
      <path
        d="M-80,-100 L80,-100 L70,30 C65,95 -65,95 -70,30 Z"
        fill={PALETTE.electricYellow}
        stroke={PALETTE.ink}
        strokeWidth={8}
      />
      {/* Cup Shimmer */}
      <path d="M-50,-90 L-30,-90 L-40,25 L-55,20 Z" fill="#ffffff" opacity={0.65} />

      {/* Stem & Pedestal */}
      <rect x={-18} y={75} width={36} height={60} fill={PALETTE.goldWarm} stroke={PALETTE.ink} strokeWidth={6} />
      <polygon points="-70,135 70,135 60,180 -60,180" fill="#2d3342" stroke={PALETTE.ink} strokeWidth={7} />
      <rect x={-85} y={180} width={170} height={40} rx={8} fill="#1a1e28" stroke={PALETTE.ink} strokeWidth={7} />

      {/* Star Medal inside cup */}
      <text x={0} y={0} textAnchor="middle" fontSize={48} fill={PALETTE.ink}>
        ★
      </text>
    </g>
  );
};

// ============================================================================
// MAIN SCENE ART DISPATCHER
// ============================================================================
export const ExplainerSceneArt: React.FC<{
  scene: ExplainerScene;
  frame: number;
  length: number;
  name?: string;
  accent?: string;
}> = ({scene, frame, length, name, accent = PALETTE.electricYellow}) => {
  const {fps} = useVideoConfig();
  const pop = spring({fps, frame, config: {damping: 14, mass: 0.8}});

  const kind = scene.kind;

  // Background gradient selector based on mood / topic
  let bgGradient = 'url(#expBgDark)';
  if (kind === 'eureka' || kind === 'trophy' || kind === 'cosmos') {
    bgGradient = 'url(#expBgWarm)';
  }

  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', top: 0, left: 0}}>
        <ExplainerDefs />

        {/* 1. ATMOSPHERIC BASE LAYER */}
        <rect x={0} y={0} width={W} height={H} fill={bgGradient} />
        <rect x={0} y={0} width={W} height={H} fill="url(#expCenterGlow)" />
        <FloatingParticles count={24} seed={kind.length * 13} />

        {/* 2. SPECIFIC STORYTELLING SCENE ENVIRONMENT */}
        {kind === 'hook' && (
          <g transform={`translate(0, 0) scale(${pop})`} style={{transformOrigin: '540px 1100px'}}>
            {/* Dramatic Back Spotlight Rays */}
            <polygon points="540,200 120,1800 960,1800" fill="url(#expGoldGlow)" opacity={0.2} />
            <EurekaBulb x={540} y={540} scale={0.7} />
            <VectorCharacter
              x={540}
              y={1360}
              scale={1.18}
              mood={scene.mood ?? 'shock'}
              pose={scene.pose ?? 'thinking'}
              talking={true}
              prop={scene.prop ?? 'none'}
            />
          </g>
        )}

        {kind === 'brain' && (
          <g>
            <HoloBrain x={540} y={520} scale={pop * 1.05} />
            <VectorCharacter
              x={540}
              y={1360}
              scale={1.15}
              mood={scene.mood ?? 'thinking'}
              pose={scene.pose ?? 'thinking'}
              talking={true}
            />
          </g>
        )}

        {kind === 'desk' && (
          <g>
            <DeskEnvironment x={540} y={1120} scale={1.05} />
            <VectorCharacter
              x={480}
              y={1340}
              scale={1.1}
              mood={scene.mood ?? 'neutral'}
              pose={scene.pose ?? 'holding'}
              prop={scene.prop ?? 'coffee'}
              talking={true}
            />
          </g>
        )}

        {kind === 'eureka' && (
          <g>
            <EurekaBulb x={540} y={560} scale={pop * 1.15} />
            <VectorCharacter
              x={540}
              y={1370}
              scale={1.18}
              mood="happy"
              pose="eureka"
              talking={true}
            />
          </g>
        )}

        {kind === 'rocket' && (
          <g>
            <GrowthRocket x={540} y={620} scale={pop * 1.05} />
            <VectorCharacter
              x={360}
              y={1370}
              scale={1.15}
              mood={scene.mood ?? 'happy'}
              pose={scene.pose ?? 'presenting'}
              talking={true}
            />
          </g>
        )}

        {kind === 'iceberg' && (
          <g>
            <IcebergMetaphor x={460} y={760} scale={pop * 0.95} />
            <VectorCharacter
              x={820}
              y={1370}
              scale={1.1}
              mood={scene.mood ?? 'thinking'}
              pose="thinking"
              flip={true}
              talking={true}
            />
          </g>
        )}

        {kind === 'trophy' && (
          <g>
            <GoldenTrophy x={540} y={580} scale={pop * 1.1} />
            <VectorCharacter
              x={540}
              y={1370}
              scale={1.18}
              mood="happy"
              pose="celebrate"
              talking={true}
            />
          </g>
        )}

        {kind === 'cosmos' && (
          <g>
            {/* Cosmic Orbit Rings */}
            <ellipse cx={540} cy={560} rx={320} ry={130} fill="none" stroke={PALETTE.vibrantCyan} strokeWidth={4} strokeDasharray="14 10" transform="rotate(-15 540 560)" opacity={0.6} />
            <ellipse cx={540} cy={560} rx={320} ry={130} fill="none" stroke={PALETTE.electricYellow} strokeWidth={4} strokeDasharray="10 14" transform="rotate(35 540 560)" opacity={0.5} />
            <circle cx={540} cy={560} r={48} fill={PALETTE.electricYellow} filter="url(#expGlow)" />

            <VectorCharacter
              x={540}
              y={1370}
              scale={1.18}
              mood="determined"
              pose="presenting"
              talking={true}
            />
          </g>
        )}

        {/* Fallback / Custom Scene: Clean Center Stage with Hero Character */}
        {!['hook', 'brain', 'desk', 'eureka', 'rocket', 'iceberg', 'trophy', 'cosmos'].includes(kind) && (
          <g>
            <circle cx={540} cy={580} r={280} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth={4} strokeDasharray="16 12" />
            <VectorCharacter
              x={540}
              y={1360}
              scale={1.18}
              mood={scene.mood ?? 'neutral'}
              pose={scene.pose ?? 'presenting'}
              prop={scene.prop ?? 'none'}
              talking={true}
            />
          </g>
        )}

        {/* 3. CINEMATIC SCENE PILL BANNER (If label is present) */}
        {scene.label && (
          <g transform={`translate(540, 240) scale(${pop})`}>
            <rect
              x={-Math.min(scene.label.length * 15 + 40, 440)}
              y={-38}
              width={Math.min(scene.label.length * 30 + 80, 880)}
              height={76}
              rx={38}
              fill="rgba(12, 18, 34, 0.85)"
              stroke={accent}
              strokeWidth={4}
            />
            <text
              x={0}
              y={10}
              textAnchor="middle"
              fill={accent}
              fontFamily="Arial Black, Impact, sans-serif"
              fontWeight={900}
              fontSize={34}
              letterSpacing={1.2}
            >
              {scene.label.toUpperCase()}
            </text>
          </g>
        )}

        {/* 4. FOREGROUND CINEMATIC VIGNETTE */}
        <rect x={0} y={0} width={W} height={H} fill="url(#expVignette)" pointerEvents="none" />
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================================
// SUBTITLE PHRASING: 1-LINE CHUNKS (14-18 CHARS MAX), NATURAL GRAMMATICAL PACING
// ============================================================================
interface ExplainerPhrase {
  words: ExplainerWord[];
  startMs: number;
  endMs: number;
}

const groupExplainerWords = (words: ExplainerWord[]): ExplainerPhrase[] => {
  if (!words.length) return [];
  const phrases: ExplainerPhrase[] = [];
  let cur: ExplainerWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    cur.push(w);

    const text = w.text.trim();
    const hasPunct = /[.,?!;:—…]$/.test(text);
    const nextGap = i < words.length - 1 ? words[i + 1].fromMs - w.toMs : 0;

    // Track total character count in buffer
    const charLen = cur.reduce((acc, item) => acc + item.text.trim().length, 0) + (cur.length - 1);

    const shouldBreak =
      hasPunct ||
      cur.length >= 3 || // max 3 words for short, punchy rhythm
      charLen >= 16 || // max 16-18 chars to guarantee single-line fit
      (cur.length >= 2 && charLen >= 11) || // 2 medium words is optimal for quick reading
      nextGap > 380 ||
      i === words.length - 1;

    if (shouldBreak) {
      phrases.push({
        words: cur,
        startMs: cur[0].fromMs,
        endMs: cur[cur.length - 1].toMs,
      });
      cur = [];
    }
  }

  // Seamless continuity: bridge small gaps so subtitles stay on screen smoothly
  for (let i = 0; i < phrases.length; i++) {
    const nextStart = phrases[i + 1] ? phrases[i + 1].startMs : phrases[i].endMs + 700;
    const gap = nextStart - phrases[i].endMs;
    if (gap > 0 && gap < 1200) {
      phrases[i].endMs = nextStart;
    } else if (gap >= 1200) {
      phrases[i].endMs += 450;
    }
  }

  return phrases;
};

// High-impact, comfortable kinetic subtitle component (Single-line, Rock-Solid)
const ExplainerSubtitle: React.FC<{
  words: ExplainerWord[];
  keywords: string[];
  accent: string;
}> = ({words, keywords, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  const phrases = React.useMemo(() => groupExplainerWords(words), [words]);
  const activePhrase = phrases.find((p) => nowMs >= p.startMs && nowMs < p.endMs);
  const kwSet = React.useMemo(() => new Set(keywords.map(clean)), [keywords]);

  if (!activePhrase) return null;

  const phraseStartF = Math.round((activePhrase.startMs / 1000) * fps);
  const pop = spring({
    frame: Math.max(0, frame - phraseStartF),
    fps,
    config: {damping: 14, stiffness: 220},
    durationInFrames: 7,
  });

  return (
    <>
      {/* Bottom cinematic gradient floor for maximum legibility */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 520,
          background:
            'linear-gradient(to top, rgba(8, 12, 22, 0.97) 0%, rgba(8, 12, 22, 0.78) 50%, rgba(8, 12, 22, 0.2) 85%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Modern High-Impact Subtitles (Safe TikTok / Shorts Zone) */}
      <div
        style={{
          position: 'absolute',
          top: 1530,
          left: 40,
          right: 40,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          pointerEvents: 'none',
          transform: `scale(${interpolate(pop, [0, 1], [0.92, 1.0])})`,
        }}
      >
        <div
          style={{
            fontFamily: '"Montserrat", "Arial Black", "Inter", -apple-system, sans-serif',
            fontWeight: 900,
            fontSize: 56,
            lineHeight: 1.25,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            maxWidth: 960,
            whiteSpace: 'nowrap',
            WebkitTextStroke: '11px #080c16',
            paintOrder: 'stroke fill',
            textShadow: '0 8px 30px rgba(0, 0, 0, 0.95), 0 2px 8px rgba(0, 0, 0, 0.9)',
          }}
        >
          {activePhrase.words.map((w, idx) => {
            const isHighlight = kwSet.has(clean(w.text));
            const isActive = nowMs >= w.fromMs && nowMs <= w.toMs + 70;
            const isPast = nowMs > w.toMs + 70;

            let wordColor = '#ffffff';
            let wordGlow = 'none';

            if (isActive) {
              wordColor = '#FFE600'; // Electric Vibrant Yellow
              wordGlow = '0 0 35px rgba(255, 230, 0, 0.95)';
            } else if (isHighlight) {
              wordColor = accent; // Accent color for keyword
            } else if (isPast) {
              wordColor = '#ffffff';
            } else {
              wordColor = 'rgba(255, 255, 255, 0.85)';
            }

            return (
              <span
                key={idx}
                style={{
                  color: wordColor,
                  margin: '0 10px',
                  display: 'inline-block',
                  textShadow:
                    wordGlow !== 'none'
                      ? `${wordGlow}, 0 8px 30px rgba(0,0,0,0.95)`
                      : undefined,
                }}
              >
                {w.text.trim()}
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ============================================================================
// FULL STORY DISPATCHER: SYNC WITH NARRATION CUES & SUBTITLES
// ============================================================================
export const ExplainerStory: React.FC<{
  words: ExplainerWord[];
  scenes: ExplainerScene[];
  name?: string;
  keywords?: string[];
  accent?: string;
}> = ({words, scenes, name = 'EXPLAINER', keywords = [], accent = PALETTE.electricYellow}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const kwSet = React.useMemo(() => new Set(keywords.map(clean)), [keywords]);

  // Compute cue boundaries
  const sceneTimeline = React.useMemo(() => {
    if (!scenes.length) {
      return [{scene: {kind: 'hook', cue: null} as ExplainerScene, startF: 0, endF: durationInFrames}];
    }

    const segments: {scene: ExplainerScene; startF: number; endF: number}[] = [];
    let curIdx = 0;
    let startF = 0;

    for (let i = 1; i < scenes.length; i++) {
      const s = scenes[i];
      if (!s.cue) continue;
      const target = clean(s.cue);
      const match = words.find((w) => clean(w.text).includes(target));
      if (match) {
        const cueFrame = Math.max(startF + 30, Math.round((match.fromMs / 1000) * fps));
        segments.push({scene: scenes[curIdx], startF, endF: cueFrame});
        startF = cueFrame;
        curIdx = i;
      }
    }
    segments.push({scene: scenes[curIdx], startF, endF: durationInFrames});
    return segments;
  }, [scenes, words, fps, durationInFrames]);

  // Find active scene
  const activeSegment = sceneTimeline.find((s) => frame >= s.startF && frame < s.endF) || sceneTimeline[0];
  const localF = frame - activeSegment.startF;
  const segLen = activeSegment.endF - activeSegment.startF;

  // Slow Ken Burns camera zoom across the whole video
  const cameraZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.05]);

  return (
    <AbsoluteFill style={{background: '#080c16', overflow: 'hidden'}}>
      {/* Zoom container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${cameraZoom})`,
          transformOrigin: '540px 960px',
        }}
      >
        <ExplainerSceneArt
          scene={activeSegment.scene}
          frame={localF}
          length={segLen}
          name={name}
          accent={accent}
        />
      </div>

      {/* TOP-LEFT BRAND BADGE */}
      {name && (
        <div
          style={{
            position: 'absolute',
            top: 74,
            left: 54,
            padding: '12px 26px',
            borderRadius: 999,
            background: 'rgba(12, 18, 34, 0.85)',
            border: `3px solid ${accent}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: accent,
              boxShadow: `0 0 12px ${accent}`,
            }}
          />
          <span
            style={{
              fontFamily: 'Arial Black, Impact, sans-serif',
              fontWeight: 900,
              fontSize: 26,
              color: '#ffffff',
              letterSpacing: 1.5,
            }}
          >
            {name.toUpperCase()}
          </span>
        </div>
      )}

      {/* COMFORTABLE HIGH-IMPACT SUBTITLES */}
      <ExplainerSubtitle words={words} keywords={keywords} accent={accent} />
    </AbsoluteFill>
  );
};
