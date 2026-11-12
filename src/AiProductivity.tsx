// "AiProductivity" template: Professional Motion-Graphics Explainer for IG Reels
// Niche: AI for Productivity & AI Side Jobs / Side Hustles
// Branded with sleek dark-mode SaaS UI, node pipelines, kinetic charts,
// bento cards, and synchronized karaoke subtitles.
import React, {useEffect, useMemo, useState} from 'react';
import {DEFAULT_HANDLE} from './brand';
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {Caption} from '@remotion/captions';
import aiRawContent from './content-chatgpt-linkedin.json';

export type AiWord = {text: string; fromMs: number; toMs: number};

export type AiSceneKind =
  | 'burnout'
  | 'leverage'
  | 'workflow'
  | 'time_unlocked'
  | 'sidejobs'
  | 'execution'
  | 'mindset'
  | 'outro';

export type AiScene = {
  kind: AiSceneKind | string;
  cue: string | null;
  kicker?: string;
  label?: string;
  sub?: string;
  promptText?: string;
  statValue?: string;
  statLabel?: string;
  items?: {title: string; desc: string; tag?: string}[];
};

const W = 1080;
const H = 1920;

export const AI_PALETTE = {
  bgDeep: '#050811',
  bgMid: '#0b1124',
  bgCard: 'rgba(16, 24, 48, 0.82)',
  bgGlass: 'rgba(255, 255, 255, 0.06)',
  borderGlass: 'rgba(255, 255, 255, 0.14)',
  cyan: '#00f2fe',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  purple: '#a855f7',
  emerald: '#10b981',
  amber: '#f59e0b',
  gold: '#ffd23f',
  coral: '#f43f5e',
  textPrimary: '#f8fafc',
  textMuted: '#94a3b8',
};

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const wrapWords = (text: string, maxChars: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if (cur.length + 1 + w.length <= maxChars) {
      cur += ' ' + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
};

// ============================================================================
// Shared SVG Gradients, Glows & Cyber Grid Background
// ============================================================================
const AiDefs: React.FC = () => (
  <defs>
    <linearGradient id="aiBgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#05070f" />
      <stop offset="45%" stopColor="#0a1124" />
      <stop offset="80%" stopColor="#0e1630" />
      <stop offset="100%" stopColor="#05070f" />
    </linearGradient>

    <linearGradient id="aiCyanBlue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#00f2fe" />
      <stop offset="100%" stopColor="#4facfe" />
    </linearGradient>

    <linearGradient id="aiVioletCyan" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#8b5cf6" />
      <stop offset="50%" stopColor="#3b82f6" />
      <stop offset="100%" stopColor="#00f2fe" />
    </linearGradient>

    <linearGradient id="aiEmeraldCyan" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#10b981" />
      <stop offset="100%" stopColor="#00f2fe" />
    </linearGradient>

    <linearGradient id="aiGoldAmber" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ffd23f" />
      <stop offset="100%" stopColor="#f59e0b" />
    </linearGradient>

    <linearGradient id="aiCoralRed" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#fb7185" />
      <stop offset="100%" stopColor="#e11d48" />
    </linearGradient>

    <linearGradient id="aiCardFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#162240" stopOpacity="0.92" />
      <stop offset="100%" stopColor="#0c1326" stopOpacity="0.96" />
    </linearGradient>

    <linearGradient id="igGrad" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stopColor="#f09433" />
      <stop offset="25%" stopColor="#e6683c" />
      <stop offset="50%" stopColor="#dc2743" />
      <stop offset="75%" stopColor="#cc2366" />
      <stop offset="100%" stopColor="#bc1888" />
    </linearGradient>

    <radialGradient id="orbCyan" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.32" />
      <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.08" />
      <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
    </radialGradient>

    <radialGradient id="orbViolet" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
      <stop offset="60%" stopColor="#6d28d9" stopOpacity="0.08" />
      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
    </radialGradient>

    <radialGradient id="orbEmerald" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
      <stop offset="60%" stopColor="#059669" stopOpacity="0.08" />
      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
    </radialGradient>

    <filter id="aiGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="aiSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#000000" floodOpacity="0.55" />
    </filter>
  </defs>
);

const CyberBackground: React.FC<{globalFrame: number; kind: string}> = ({globalFrame, kind}) => {
  const driftX = Math.sin(globalFrame * 0.02) * 45;
  const driftY = Math.cos(globalFrame * 0.015) * 35;
  const gridOffset = (globalFrame * 0.8) % 80;

  const isWarn = kind === 'burnout';
  const isMoney = kind === 'sidejobs' || kind === 'execution';

  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill="url(#aiBgGrad)" />

      {/* Ambient Aurora Orbs */}
      <circle
        cx={280 + driftX}
        cy={520 + driftY}
        r={480}
        fill={isWarn ? 'url(#orbViolet)' : isMoney ? 'url(#orbEmerald)' : 'url(#orbCyan)'}
      />
      <circle
        cx={820 - driftX}
        cy={1150 - driftY}
        r={520}
        fill={isMoney ? 'url(#orbCyan)' : 'url(#orbViolet)'}
      />

      {/* Subtle Tech Grid */}
      <g opacity={0.12}>
        {Array.from({length: 15}).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 80}
            y1={0}
            x2={i * 80}
            y2={H}
            stroke="#64748b"
            strokeWidth={1}
          />
        ))}
        {Array.from({length: 26}).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={(i * 80 + gridOffset) % H}
            x2={W}
            y2={(i * 80 + gridOffset) % H}
            stroke="#64748b"
            strokeWidth={1}
          />
        ))}
      </g>

      {/* Floating Data Nodes */}
      {Array.from({length: 14}).map((_, i) => {
        const px = ((i * 193 + 90) % 940) + 70;
        const basePy = (i * 271 + 140) % 1650;
        const py = (basePy - globalFrame * (0.4 + (i % 3) * 0.25) + 1800) % 1800;
        const op = 0.2 + 0.25 * Math.sin(globalFrame * 0.05 + i);
        return (
          <circle
            key={`p-${i}`}
            cx={px}
            cy={py}
            r={i % 3 === 0 ? 4 : 2.5}
            fill={i % 2 === 0 ? AI_PALETTE.cyan : AI_PALETTE.violet}
            opacity={op}
          />
        );
      })}
    </g>
  );
};

// ============================================================================
// Scene Header Banner (Top Title Card per Scene)
// ============================================================================
const SceneHeaderCard: React.FC<{
  kicker?: string;
  label?: string;
  sub?: string;
  frame: number;
  fps: number;
  accentColor?: string;
}> = ({kicker, label, sub, frame, fps, accentColor = AI_PALETTE.cyan}) => {
  if (!label) return null;
  const pop = spring({frame, fps, config: {damping: 14, stiffness: 130}});
  const translateY = interpolate(pop, [0, 1], [-30, 0]);

  return (
    <g transform={`translate(540, ${255 + translateY}) scale(${0.92 + 0.08 * pop})`} opacity={pop}>
      <rect
        x={-450}
        y={-78}
        width={900}
        height={sub ? 168 : 132}
        rx={28}
        fill="url(#aiCardFill)"
        stroke={accentColor}
        strokeWidth={2.5}
        filter="url(#aiSoftShadow)"
      />
      {/* Top accent glow bar */}
      <rect x={-140} y={-78} width={280} height={5} rx={2.5} fill={accentColor} />

      {kicker && (
        <text
          x={0}
          y={-34}
          textAnchor="middle"
          fill={accentColor}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={800}
          fontSize={21}
          letterSpacing={3}
        >
          {kicker.toUpperCase()}
        </text>
      )}

      <text
        x={0}
        y={kicker ? 14 : -4}
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="Inter, Arial Black, sans-serif"
        fontWeight={900}
        fontSize={38}
        letterSpacing={0.5}
      >
        {label}
      </text>

      {sub && (
        <text
          x={0}
          y={58}
          textAnchor="middle"
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={600}
          fontSize={24}
        >
          {sub}
        </text>
      )}
    </g>
  );
};

// ============================================================================
// SCENE 1: BURNOUT / HOOK (Old 9-to-5 Trap vs AI Era)
// ============================================================================
const SceneBurnout: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 13}});
  const clockAngle = frame * 8;
  const shake = Math.sin(frame * 0.45) * 3;

  const tasks = [
    {title: 'Kerjaan Kantor Menumpuk', tag: '8+ JAM / HARI', color: '#f43f5e', y: 770},
    {title: 'Revisi & Rekap Data Manual', tag: 'ENERGI TERKURAS', color: '#fb7185', y: 920},
    {title: 'Mau Mulai Side Job Tapi Capek', tag: 'WAKTU HABIS', color: '#f97316', y: 1070},
  ];

  const batteryLevel = Math.max(12, Math.round(interpolate(frame, [0, 75], [48, 12], {extrapolateRight: 'clamp'})));

  return (
    <g>
      {/* Animated Overworked Clock & Energy Drain Meter */}
      <g transform={`translate(540, 560) scale(${enter})`}>
        <circle
          cx={-180}
          cy={0}
          r={110}
          fill="#131c36"
          stroke={AI_PALETTE.coral}
          strokeWidth={6}
          filter="url(#aiSoftShadow)"
        />
        <circle
          cx={-180}
          cy={0}
          r={94}
          fill="none"
          stroke="rgba(244,63,94,0.25)"
          strokeWidth={3}
          strokeDasharray="10 8"
        />
        {/* Clock Hands */}
        <line
          x1={-180}
          y1={0}
          x2={-180 + Math.cos((clockAngle * Math.PI) / 180) * 65}
          y2={Math.sin((clockAngle * Math.PI) / 180) * 65}
          stroke={AI_PALETTE.coral}
          strokeWidth={7}
          strokeLinecap="round"
        />
        <line
          x1={-180}
          y1={0}
          x2={-180 + Math.cos(((clockAngle * 0.2) * Math.PI) / 180) * 44}
          y2={Math.sin(((clockAngle * 0.2) * Math.PI) / 180) * 44}
          stroke="#ffffff"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <circle cx={-180} cy={0} r={10} fill="#ffffff" />

        {/* Energy Battery Card */}
        <rect
          x={-30}
          y={-95}
          width={420}
          height={190}
          rx={24}
          fill="url(#aiCardFill)"
          stroke="rgba(244,63,94,0.5)"
          strokeWidth={2.5}
          filter="url(#aiSoftShadow)"
        />
        <text
          x={180}
          y={-42}
          textAnchor="middle"
          fill={AI_PALETTE.coral}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={800}
          fontSize={21}
          letterSpacing={1.5}
        >
          SISA ENERGI HARIAN
        </text>
        {/* Battery Outline */}
        <rect x={45} y={-18} width={255} height={54} rx={12} fill="#090d1a" stroke="#475569" strokeWidth={3} />
        <rect x={304} y={-4} width={10} height={26} rx={4} fill="#475569" />
        <rect
          x={53}
          y={-10}
          width={Math.max(24, (batteryLevel / 100) * 238)}
          height={38}
          rx={8}
          fill="url(#aiCoralRed)"
        />
        <text
          x={180}
          y={68}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={23}
        >
          {batteryLevel}% · KEHABISAN WAKTU
        </text>
      </g>

      {/* Stacked Overload Task Cards */}
      {tasks.map((t, i) => {
        const cardPop = spring({frame: frame - i * 8, fps, config: {damping: 13}});
        return (
          <g
            key={i}
            transform={`translate(${540 + (i % 2 === 0 ? shake : -shake)}, ${t.y}) scale(${cardPop})`}
            opacity={cardPop}
          >
            <rect
              x={-430}
              y={-58}
              width={860}
              height={116}
              rx={22}
              fill="url(#aiCardFill)"
              stroke={t.color}
              strokeWidth={2.5}
              filter="url(#aiSoftShadow)"
            />
            <circle cx={-365} cy={0} r={26} fill="rgba(244,63,94,0.18)" />
            <text
              x={-365}
              y={10}
              textAnchor="middle"
              fill={t.color}
              fontFamily="Arial Black, sans-serif"
              fontSize={30}
              fontWeight={900}
            >
              !
            </text>
            <text
              x={-315}
              y={-6}
              fill="#ffffff"
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={800}
              fontSize={29}
            >
              {t.title}
            </text>
            <text
              x={-315}
              y={32}
              fill={AI_PALETTE.textMuted}
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={600}
              fontSize={21}
            >
              Cara manual menguras waktu produktifmu
            </text>
            <rect x={215} y={-22} width={185} height={44} rx={12} fill="rgba(244,63,94,0.2)" />
            <text
              x={307}
              y={7}
              textAnchor="middle"
              fill={t.color}
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={800}
              fontSize={18}
            >
              {t.tag}
            </text>
          </g>
        );
      })}

      {/* Bottom Insight Pill */}
      <g transform={`translate(540, 1245) scale(${enter})`}>
        <rect
          x={-455}
          y={-42}
          width={910}
          height={84}
          rx={42}
          fill="rgba(0, 242, 254, 0.12)"
          stroke={AI_PALETTE.cyan}
          strokeWidth={2.5}
        />
        <text
          x={0}
          y={8}
          textAnchor="middle"
          fill={AI_PALETTE.cyan}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={23}
          letterSpacing={1}
        >
          SOLUSINYA BUKAN KERJA LEBIH LAMA, TAPI LEVERAGE AI
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// SCENE 2: LEVERAGE (1 Person + AI = 5-Person Team)
// ============================================================================
const SceneLeverage: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const centerPop = spring({frame, fps, config: {damping: 12}});

  const agents = [
    {name: 'AI Riset & Data', role: 'Analisa 10x Cepat', angle: -90, color: '#00f2fe'},
    {name: 'AI Copywriter', role: 'Naskah & Konten', angle: -18, color: '#8b5cf6'},
    {name: 'AI Automation', role: 'Rekap & Email', angle: 54, color: '#10b981'},
    {name: 'AI Visual & Desain', role: 'Aset Presentasi', angle: 126, color: '#f59e0b'},
    {name: 'AI Coding / Web', role: 'Bikin Produk Digital', angle: 198, color: '#3b82f6'},
  ];

  const cx = 540;
  const cy = 790;
  const radius = 330;

  return (
    <g>
      {/* Orbit Rings */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(0, 242, 254, 0.22)"
        strokeWidth={3}
        strokeDasharray="14 10"
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius * 0.58}
        fill="none"
        stroke="rgba(139, 92, 246, 0.25)"
        strokeWidth={2}
      />

      {/* Connecting Data Lines & Animated Pulses */}
      {agents.map((ag, i) => {
        const rad = (ag.angle * Math.PI) / 180;
        const nx = cx + Math.cos(rad) * radius;
        const ny = cy + Math.sin(rad) * radius;
        const pulseT = ((frame * 0.035 + i * 0.2) % 1);
        const px = cx + (nx - cx) * pulseT;
        const py = cy + (ny - cy) * pulseT;

        return (
          <g key={`line-${i}`}>
            <line
              x1={cx}
              y1={cy}
              x2={nx}
              y2={ny}
              stroke={ag.color}
              strokeWidth={3}
              opacity={0.45}
            />
            <circle cx={px} cy={py} r={8} fill={ag.color} filter="url(#aiGlow)" />
          </g>
        );
      })}

      {/* Central Creator Core */}
      <g transform={`translate(${cx}, ${cy}) scale(${centerPop})`}>
        <circle cx={0} cy={0} r={122} fill="url(#aiVioletCyan)" filter="url(#aiGlow)" opacity={0.35} />
        <circle
          cx={0}
          cy={0}
          r={106}
          fill="#0d1630"
          stroke={AI_PALETTE.cyan}
          strokeWidth={5}
          filter="url(#aiSoftShadow)"
        />
        <text
          x={0}
          y={-18}
          textAnchor="middle"
          fill={AI_PALETTE.cyan}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={22}
          letterSpacing={1.5}
        >
          KAMU + AI
        </text>
        <text
          x={0}
          y={16}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={28}
        >
          1 ORANG
        </text>
        <text
          x={0}
          y={46}
          textAnchor="middle"
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={800}
          fontSize={17}
        >
          = TIM 5 AHLI
        </text>
      </g>

      {/* Satellite AI Agent Nodes */}
      {agents.map((ag, i) => {
        const rad = (ag.angle * Math.PI) / 180;
        const nx = cx + Math.cos(rad) * radius;
        const ny = cy + Math.sin(rad) * radius;
        const nodePop = spring({frame: frame - i * 6, fps, config: {damping: 12}});

        return (
          <g key={`node-${i}`} transform={`translate(${nx}, ${ny}) scale(${nodePop})`}>
            <rect
              x={-152}
              y={-52}
              width={304}
              height={104}
              rx={22}
              fill="url(#aiCardFill)"
              stroke={ag.color}
              strokeWidth={3}
              filter="url(#aiSoftShadow)"
            />
            <circle cx={-114} cy={0} r={18} fill={ag.color} opacity={0.22} />
            <circle cx={-114} cy={0} r={8} fill={ag.color} />
            <text
              x={-82}
              y={-6}
              fill="#ffffff"
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={800}
              fontSize={21}
            >
              {ag.name}
            </text>
            <text
              x={-82}
              y={24}
              fill={ag.color}
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={700}
              fontSize={18}
            >
              {ag.role}
            </text>
          </g>
        );
      })}

      {/* Bottom Stat Banner */}
      <g transform={`translate(540, 1265) scale(${centerPop})`}>
        <rect
          x={-450}
          y={-48}
          width={900}
          height={96}
          rx={24}
          fill="url(#aiCardFill)"
          stroke="rgba(16, 185, 129, 0.6)"
          strokeWidth={2.5}
        />
        <text
          x={0}
          y={-4}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={25}
        >
          AI BUKAN PENGGANTI, TAPI ASISTEN PRIBADIMU
        </text>
        <text
          x={0}
          y={30}
          textAnchor="middle"
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={21}
        >
          Delegasikan tugas repetitif · Fokus pada keputusan bernilai tinggi
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// SCENE 3: WORKFLOW & PRODUCTIVITY MULTIPLIER (Prompt -> 10x Faster Output)
// ============================================================================
const SceneWorkflow: React.FC<{frame: number; fps: number; promptText?: string}> = ({
  frame,
  fps,
  promptText = 'Analisa laporan mingguan, buat ringkasan eksekutif & draft jadwal proyek...',
}) => {
  const enter = spring({frame, fps, config: {damping: 14}});
  const chars = Math.min(promptText.length, Math.floor(frame * 1.6));
  const typed = promptText.slice(0, chars);

  const manualBarW = interpolate(frame, [10, 50], [0, 580], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const aiBarW = interpolate(frame, [18, 45], [0, 140], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const steps = [
    {label: '1. Input Prompt', sub: 'Instruksi Spesifik', x: 220, color: '#3b82f6'},
    {label: '2. AI Processing', sub: 'Riset & Struktur', x: 540, color: '#8b5cf6'},
    {label: '3. Hasil Instan', sub: '90% Siap Pakai', x: 860, color: '#10b981'},
  ];

  return (
    <g>
      {/* AI Prompt Terminal Window */}
      <g transform={`translate(540, 520) scale(${enter})`}>
        <rect
          x={-450}
          y={-125}
          width={900}
          height={250}
          rx={26}
          fill="#0b1326"
          stroke={AI_PALETTE.cyan}
          strokeWidth={3}
          filter="url(#aiSoftShadow)"
        />
        {/* Window Top Bar */}
        <rect x={-450} y={-125} width={900} height={54} rx={26} fill="#162244" />
        <circle cx={-405} cy={-98} r={9} fill="#f43f5e" />
        <circle cx={-378} cy={-98} r={9} fill="#f59e0b" />
        <circle cx={-351} cy={-98} r={9} fill="#10b981" />
        <text
          x={-315}
          y={-91}
          fill={AI_PALETTE.cyan}
          fontFamily="Inter, monospace"
          fontWeight={800}
          fontSize={20}
        >
          AI WORKFLOW COPILOT · ACTIVE
        </text>

        {/* Prompt Input Box */}
        <rect
          x={-415}
          y={-48}
          width={830}
          height={145}
          rx={18}
          fill="#060b18"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={2}
        />
        <text
          x={-385}
          y={-4}
          fill={AI_PALETTE.gold}
          fontFamily="Inter, monospace"
          fontWeight={800}
          fontSize={21}
        >
          PROMPT &gt;
        </text>
        {wrapWords(typed, 46)
          .slice(0, 2)
          .map((line, lIdx) => (
            <text
              key={lIdx}
              x={-385}
              y={34 + lIdx * 34}
              fill="#ffffff"
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={600}
              fontSize={24}
            >
              {line}
            </text>
          ))}
      </g>

      {/* 3-Node Pipeline */}
      <line x1={220} y1={775} x2={860} y2={775} stroke={AI_PALETTE.cyan} strokeWidth={4} strokeDasharray="12 8" />
      {steps.map((st, i) => {
        const stPop = spring({frame: frame - 10 - i * 8, fps, config: {damping: 12}});
        return (
          <g key={i} transform={`translate(${st.x}, 775) scale(${stPop})`}>
            <rect
              x={-140}
              y={-58}
              width={280}
              height={116}
              rx={20}
              fill="url(#aiCardFill)"
              stroke={st.color}
              strokeWidth={3}
              filter="url(#aiSoftShadow)"
            />
            <text
              x={0}
              y={-8}
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={800}
              fontSize={23}
            >
              {st.label}
            </text>
            <text
              x={0}
              y={26}
              textAnchor="middle"
              fill={st.color}
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={700}
              fontSize={19}
            >
              {st.sub}
            </text>
          </g>
        );
      })}

      {/* Time Saved Comparison Card */}
      <g transform={`translate(540, 1090) scale(${enter})`}>
        <rect
          x={-450}
          y={-155}
          width={900}
          height={310}
          rx={28}
          fill="url(#aiCardFill)"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={2.5}
          filter="url(#aiSoftShadow)"
        />
        <text
          x={-400}
          y={-95}
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={26}
          letterSpacing={1}
        >
          PERBANDINGAN WAKTU KERJA:
        </text>

        {/* Manual Row */}
        <text
          x={-400}
          y={-40}
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={23}
        >
          Cara Lama (Manual)
        </text>
        <rect x={-400} y={-22} width={manualBarW} height={42} rx={10} fill="url(#aiCoralRed)" />
        <text
          x={-380 + manualBarW}
          y={7}
          fill={AI_PALETTE.coral}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={26}
        >
          3 - 4 JAM
        </text>

        {/* AI Row */}
        <text
          x={-400}
          y={62}
          fill={AI_PALETTE.cyan}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={800}
          fontSize={23}
        >
          Dengan AI Workflow
        </text>
        <rect x={-400} y={80} width={aiBarW} height={42} rx={10} fill="url(#aiEmeraldCyan)" filter="url(#aiGlow)" />
        <text
          x={-380 + aiBarW}
          y={109}
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={28}
        >
          15 MENIT (10x LEBIH CEPAT!)
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// SCENE 4: TIME UNLOCKED (Save Energy for Your Side Hustle)
// ============================================================================
const SceneTimeUnlocked: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 12}});
  const pct = Math.min(92, Math.round(interpolate(frame, [0, 55], [20, 92], {extrapolateRight: 'clamp'})));
  const ringRadius = 175;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const dashOffset = ringCircumference * (1 - pct / 100);

  return (
    <g>
      {/* Circular Energy & Time Gauge */}
      <g transform={`translate(540, 655) scale(${enter})`}>
        <circle
          cx={0}
          cy={0}
          r={212}
          fill="url(#aiCardFill)"
          stroke="rgba(16, 185, 129, 0.35)"
          strokeWidth={3}
          filter="url(#aiSoftShadow)"
        />
        <circle cx={0} cy={0} r={ringRadius} fill="none" stroke="#1e293b" strokeWidth={22} />
        <circle
          cx={0}
          cy={0}
          r={ringRadius}
          fill="none"
          stroke="url(#aiEmeraldCyan)"
          strokeWidth={22}
          strokeLinecap="round"
          strokeDasharray={ringCircumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 0 0)"
          filter="url(#aiGlow)"
        />
        <text
          x={0}
          y={-42}
          textAnchor="middle"
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={800}
          fontSize={19}
          letterSpacing={1.5}
        >
          ENERGI TERSISA
        </text>
        <text
          x={0}
          y={26}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={68}
        >
          {pct}%
        </text>
        <text
          x={0}
          y={72}
          textAnchor="middle"
          fill={AI_PALETTE.cyan}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={800}
          fontSize={18}
          letterSpacing={0.5}
        >
          PULANG TEPAT WAKTU
        </text>
      </g>

      {/* Unlocked Golden Window Card */}
      <g transform={`translate(540, 1095) scale(${enter})`}>
        <rect
          x={-440}
          y={-150}
          width={880}
          height={300}
          rx={28}
          fill="url(#aiCardFill)"
          stroke={AI_PALETTE.gold}
          strokeWidth={3}
          filter="url(#aiSoftShadow)"
        />
        <rect
          x={-235}
          y={-118}
          width={470}
          height={46}
          rx={23}
          fill="rgba(255, 210, 63, 0.16)"
          stroke="rgba(255, 210, 63, 0.4)"
          strokeWidth={1.5}
        />
        <text
          x={0}
          y={-88}
          textAnchor="middle"
          fill={AI_PALETTE.gold}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={20}
          letterSpacing={1.5}
        >
          GOLDEN WINDOW TERBUKA
        </text>

        <text
          x={0}
          y={-12}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={46}
        >
          +2 JAM FOKUS TIAP MALAM
        </text>

        <text
          x={0}
          y={44}
          textAnchor="middle"
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={600}
          fontSize={25}
        >
          Waktu & pikiran segar untuk membangun
        </text>
        <text
          x={0}
          y={82}
          textAnchor="middle"
          fill={AI_PALETTE.cyan}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={28}
        >
          SIDE JOB & PENGHASILAN KEDUA
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// SCENE 5: AI SIDE JOBS BLUEPRINT (3 Proven AI Income Streams)
// ============================================================================
const SceneSideJobs: React.FC<{
  frame: number;
  fps: number;
  items?: {title: string; desc: string; tag?: string}[];
}> = ({frame, fps, items}) => {
  const defaultItems = [
    {
      title: '01 · Jasa Konten & Copywriting AI',
      desc: 'Riset ide, artikel SEO, & script sosmed klien 10x lebih cepat',
      tag: 'HIGH DEMAND',
    },
    {
      title: '02 · Produk Digital & Template',
      desc: 'Buat e-book, Notion system, atau prompt pack sekali, jual ribuan kali',
      tag: 'PASSIVE ASSET',
    },
    {
      title: '03 · Micro-Agency Otomasi & Web AI',
      desc: 'Bantu bisnis lokal bikin landing page, katalog AI, & sistem kerja',
      tag: 'HIGH TICKET',
    },
  ];

  const list = items && items.length ? items : defaultItems;
  const colors = [AI_PALETTE.cyan, AI_PALETTE.gold, AI_PALETTE.emerald];

  return (
    <g>
      {list.slice(0, 3).map((item, i) => {
        const cardPop = spring({frame: frame - i * 9, fps, config: {damping: 13}});
        const yPos = 555 + i * 265;
        const col = colors[i % colors.length];

        return (
          <g key={i} transform={`translate(540, ${yPos}) scale(${cardPop})`} opacity={cardPop}>
            <rect
              x={-450}
              y={-105}
              width={900}
              height={210}
              rx={26}
              fill="url(#aiCardFill)"
              stroke={col}
              strokeWidth={3}
              filter="url(#aiSoftShadow)"
            />
            {/* Left accent bar */}
            <rect x={-450} y={-65} width={10} height={130} rx={5} fill={col} />

            {/* Tag badge */}
            {item.tag && (
              <g transform="translate(295, -62)">
                <rect x={-120} y={-20} width={240} height={38} rx={19} fill="rgba(255,255,255,0.08)" stroke={col} strokeWidth={1.5} />
                <text
                  x={0}
                  y={6}
                  textAnchor="middle"
                  fill={col}
                  fontFamily="Inter, Arial Black, sans-serif"
                  fontWeight={900}
                  fontSize={16}
                  letterSpacing={1.5}
                >
                  {item.tag}
                </text>
              </g>
            )}

            <text
              x={-400}
              y={-12}
              fill="#ffffff"
              fontFamily="Inter, Arial Black, sans-serif"
              fontWeight={900}
              fontSize={29}
            >
              {item.title}
            </text>

            {wrapWords(item.desc, 52)
              .slice(0, 2)
              .map((line, lIdx) => (
                <text
                  key={lIdx}
                  x={-400}
                  y={36 + lIdx * 34}
                  fill={AI_PALETTE.textMuted}
                  fontFamily="Inter, Arial, sans-serif"
                  fontWeight={600}
                  fontSize={23}
                >
                  {line}
                </text>
              ))}
          </g>
        );
      })}
    </g>
  );
};

// ============================================================================
// SCENE 6: EXECUTION & INCOME GROWTH DASHBOARD
// ============================================================================
const SceneExecution: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 13}});
  const chartProgress = interpolate(frame, [5, 55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const bars = [90, 140, 195, 265, 345, 430];

  return (
    <g>
      {/* Revenue & Output Growth Chart Card */}
      <g transform={`translate(540, 690) scale(${enter})`}>
        <rect
          x={-450}
          y={-250}
          width={900}
          height={500}
          rx={28}
          fill="url(#aiCardFill)"
          stroke={AI_PALETTE.emerald}
          strokeWidth={3}
          filter="url(#aiSoftShadow)"
        />
        {/* Top-left Kicker */}
        <text
          x={-395}
          y={-182}
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={19}
          letterSpacing={1.5}
        >
          COMPOUNDING SIDE HUSTLE
        </text>
        {/* Top-right Badge Pill (same header row, zero overlap) */}
        <g transform={`translate(230, -190) scale(${spring({frame: frame - 10, fps})})`}>
          <rect
            x={-175}
            y={-24}
            width={350}
            height={48}
            rx={24}
            fill="rgba(16, 185, 129, 0.18)"
            stroke={AI_PALETTE.emerald}
            strokeWidth={2}
          />
          <text
            x={0}
            y={6}
            textAnchor="middle"
            fill={AI_PALETTE.emerald}
            fontFamily="Inter, Arial Black, sans-serif"
            fontWeight={900}
            fontSize={18}
            letterSpacing={0.8}
          >
            +INCOME TANPA RESIGN
          </text>
        </g>

        {/* Main Card Title on second row */}
        <text
          x={-395}
          y={-122}
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={34}
        >
          Konsisten 1-2 Jam Setiap Malam
        </text>

        {/* Animated Bars (Max height 235px -> top is y = -50, well below y = -122) */}
        {bars.map((h, i) => {
          const bh = h * 0.52 * chartProgress;
          const bx = -360 + i * 130;
          const by = 185 - bh;
          return (
            <g key={i}>
              <rect
                x={bx}
                y={by}
                width={82}
                height={Math.max(12, bh)}
                rx={14}
                fill={i >= 4 ? 'url(#aiEmeraldCyan)' : 'url(#aiCyanBlue)'}
                opacity={0.45 + i * 0.1}
              />
              <text
                x={bx + 41}
                y={222}
                textAnchor="middle"
                fill={AI_PALETTE.textMuted}
                fontFamily="Inter, Arial, sans-serif"
                fontWeight={700}
                fontSize={19}
              >
                Bln {i + 1}
              </text>
            </g>
          );
        })}
      </g>

      {/* 3-Step Nightly Routine Strip */}
      <g transform={`translate(540, 1135) scale(${enter})`}>
        <rect
          x={-450}
          y={-110}
          width={900}
          height={220}
          rx={26}
          fill="url(#aiCardFill)"
          stroke={AI_PALETTE.cyan}
          strokeWidth={2.5}
        />
        <text
          x={0}
          y={-52}
          textAnchor="middle"
          fill={AI_PALETTE.gold}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={22}
          letterSpacing={1.5}
        >
          FORMULA EKSEKUSI 60 MENIT:
        </text>
        <text
          x={0}
          y={6}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={27}
        >
          15m Riset AI  →  30m Eksekusi Draft  →  15m Publish
        </text>
        <text
          x={0}
          y={58}
          textAnchor="middle"
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={600}
          fontSize={23}
        >
          Bukan soal bakat, tapi soal sistem kerja yang dibantu AI
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// SCENE 7: MINDSET COMPARISON (90% Consumer vs Top 10% AI Builder)
// ============================================================================
const SceneMindset: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const leftPop = spring({frame, fps, config: {damping: 13}});
  const rightPop = spring({frame: frame - 10, fps, config: {damping: 13}});

  return (
    <g>
      {/* 90% Consumer Card */}
      <g transform={`translate(540, 575) scale(${leftPop})`}>
        <rect
          x={-450}
          y={-145}
          width={900}
          height={290}
          rx={28}
          fill="url(#aiCardFill)"
          stroke="rgba(244, 63, 94, 0.55)"
          strokeWidth={3}
          filter="url(#aiSoftShadow)"
        />
        <rect
          x={-400}
          y={-110}
          width={360}
          height={46}
          rx={12}
          fill="rgba(244, 63, 94, 0.2)"
          stroke="rgba(244, 63, 94, 0.45)"
          strokeWidth={1.5}
        />
        <text
          x={-220}
          y={-80}
          textAnchor="middle"
          fill={AI_PALETTE.coral}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={20}
          letterSpacing={0.8}
        >
          90% ORANG (KONSUMEN)
        </text>
        <text
          x={-400}
          y={-18}
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={31}
        >
          ❌ Takut Digantikan atau Cuma Iseng
        </text>
        <text
          x={-400}
          y={34}
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={600}
          fontSize={24}
        >
          • Pakai AI cuma buat tanya hal receh tanpa sistem
        </text>
        <text
          x={-400}
          y={76}
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={600}
          fontSize={24}
        >
          • Habis waktu scrolling tanpa bangun aset digital
        </text>
      </g>

      {/* Top 10% Builder Card */}
      <g transform={`translate(540, 995) scale(${rightPop})`}>
        <rect
          x={-450}
          y={-165}
          width={900}
          height={330}
          rx={28}
          fill="url(#aiCardFill)"
          stroke={AI_PALETTE.emerald}
          strokeWidth={3.5}
          filter="url(#aiSoftShadow)"
        />
        <rect
          x={-400}
          y={-126}
          width={430}
          height={46}
          rx={12}
          fill="rgba(16, 185, 129, 0.22)"
          stroke="rgba(16, 185, 129, 0.45)"
          strokeWidth={1.5}
        />
        <text
          x={-185}
          y={-96}
          textAnchor="middle"
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={20}
          letterSpacing={0.8}
        >
          TOP 10% (KREATOR & BUILDER)
        </text>
        <text
          x={-400}
          y={-32}
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={32}
        >
          ✅ Jadikan AI Mesin Produktivitas & Cuan
        </text>
        <text
          x={-400}
          y={22}
          fill={AI_PALETTE.cyan}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={25}
        >
          • Pangkas waktu kerja utama dengan workflow AI
        </text>
        <text
          x={-400}
          y={66}
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={25}
        >
          • Bangun side job & sumber income baru dari rumah
        </text>
        <text
          x={-400}
          y={110}
          fill={AI_PALETTE.gold}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={25}
        >
          • Kuasai masa depan sebelum terlambat
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// SCENE 8: OUTRO CTA CARD
// ============================================================================
const SceneOutro: React.FC<{frame: number; fps: number; handle: string}> = ({frame, fps, handle}) => {
  const enter = spring({frame, fps, config: {damping: 12}});
  const pulse = 1 + 0.04 * Math.sin(frame * 0.22);

  return (
    <g transform={`translate(540, 770) scale(${enter})`}>
      {/* Outer Glow Halo */}
      <circle cx={0} cy={-160} r={160} fill="url(#orbCyan)" />

      {/* Main Profile CTA Card */}
      <rect
        x={-450}
        y={-340}
        width={900}
        height={680}
        rx={38}
        fill="url(#aiCardFill)"
        stroke="url(#aiVioletCyan)"
        strokeWidth={4}
        filter="url(#aiSoftShadow)"
      />

      {/* Instagram Gradient Avatar Ring */}
      <circle cx={0} cy={-185} r={88} fill="url(#igGrad)" filter="url(#aiGlow)" />
      <circle cx={0} cy={-185} r={78} fill="#0b1124" />
      <text
        x={0}
        y={-165}
        textAnchor="middle"
        fill={AI_PALETTE.cyan}
        fontFamily="Inter, Arial Black, sans-serif"
        fontWeight={900}
        fontSize={56}
      >
        AI
      </text>

      {/* Handle Name */}
      <text
        x={0}
        y={-42}
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="Inter, Arial Black, sans-serif"
        fontWeight={900}
        fontSize={52}
        letterSpacing={1}
      >
        {handle}
      </text>

      {/* Niche Subtitle */}
      <text
        x={0}
        y={12}
        textAnchor="middle"
        fill={AI_PALETTE.cyan}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight={800}
        fontSize={26}
        letterSpacing={2}
      >
        AI PRODUCTIVITY  ·  SIDE HUSTLE  ·  WORKFLOW
      </text>

      <text
        x={0}
        y={80}
        textAnchor="middle"
        fill={AI_PALETTE.textMuted}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight={600}
        fontSize={26}
      >
        Bahas tuntas cara kerja lebih cerdas dengan AI
      </text>
      <text
        x={0}
        y={118}
        textAnchor="middle"
        fill={AI_PALETTE.textMuted}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight={600}
        fontSize={26}
      >
        dan membangun side job digital dari nol.
      </text>

      {/* Animated Follow Button */}
      <g transform={`translate(0, 225) scale(${pulse})`}>
        <rect
          x={-310}
          y={-48}
          width={620}
          height={96}
          rx={48}
          fill="url(#aiVioletCyan)"
          filter="url(#aiGlow)"
        />
        <text
          x={0}
          y={12}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={34}
          letterSpacing={1.5}
        >
          FOLLOW {handle.toUpperCase()}
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// JOB SCENE 1: LINKEDIN APPLY HOOK (Why 100+ Applications Get Ghosted)
// ============================================================================
const SceneJobHook: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 13}});
  const shake = Math.sin(frame * 0.4) * 2.5;

  const problems = [
    {title: 'Kirim 1 CV Umum ke 100 Lowongan', tag: 'ATS REJECT', color: '#f43f5e', y: 785},
    {title: 'Cuma Klik Easy Apply di LinkedIn', tag: '500+ SAINGAN', color: '#fb7185', y: 935},
    {title: 'Kirim Email Tanpa Riset & Hook', tag: 'DI-GHOSTING HRD', color: '#f97316', y: 1085},
  ];

  return (
    <g>
      {/* Top LinkedIn vs ATS Filter Status Card */}
      <g transform={`translate(540, 560) scale(${enter})`}>
        {/* Left: LinkedIn Sent Counter */}
        <rect
          x={-450}
          y={-95}
          width={420}
          height={190}
          rx={24}
          fill="url(#aiCardFill)"
          stroke="#0a66c2"
          strokeWidth={3}
          filter="url(#aiSoftShadow)"
        />
        <rect x={-415} y={-68} width={48} height={48} rx={10} fill="#0a66c2" />
        <text
          x={-391}
          y={-34}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={28}
        >
          in
        </text>
        <text
          x={-350}
          y={-36}
          fill="#38bdf8"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={20}
          letterSpacing={1}
        >
          LINKEDIN APPLY
        </text>
        <text
          x={-240}
          y={26}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={44}
        >
          100+ CV
        </text>
        <text
          x={-240}
          y={66}
          textAnchor="middle"
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={20}
        >
          DIKIRIM BULAN INI
        </text>

        {/* Right: ATS Rejection Score */}
        <rect
          x={10}
          y={-95}
          width={440}
          height={190}
          rx={24}
          fill="url(#aiCardFill)"
          stroke={AI_PALETTE.coral}
          strokeWidth={3}
          filter="url(#aiSoftShadow)"
        />
        <text
          x={230}
          y={-42}
          textAnchor="middle"
          fill={AI_PALETTE.coral}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={20}
          letterSpacing={1.2}
        >
          HASIL FILTER SISTEM ATS
        </text>
        <text
          x={230}
          y={24}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={44}
        >
          0 PANGGILAN
        </text>
        <text
          x={230}
          y={66}
          textAnchor="middle"
          fill={AI_PALETTE.coral}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={20}
        >
          SKOR ATS 32% · GAGAL FILTER
        </text>
      </g>

      {/* 3 Mistake Cards */}
      {problems.map((p, i) => {
        const cardPop = spring({frame: frame - i * 8, fps, config: {damping: 13}});
        return (
          <g
            key={i}
            transform={`translate(${540 + (i % 2 === 0 ? shake : -shake)}, ${p.y}) scale(${cardPop})`}
            opacity={cardPop}
          >
            <rect
              x={-450}
              y={-58}
              width={900}
              height={116}
              rx={22}
              fill="url(#aiCardFill)"
              stroke={p.color}
              strokeWidth={2.5}
              filter="url(#aiSoftShadow)"
            />
            <circle cx={-385} cy={0} r={26} fill="rgba(244,63,94,0.18)" />
            <text
              x={-385}
              y={10}
              textAnchor="middle"
              fill={p.color}
              fontFamily="Arial Black, sans-serif"
              fontSize={28}
              fontWeight={900}
            >
              ✕
            </text>
            <text
              x={-335}
              y={-6}
              fill="#ffffff"
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={800}
              fontSize={27}
            >
              {p.title}
            </text>
            <text
              x={-335}
              y={30}
              fill={AI_PALETTE.textMuted}
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={600}
              fontSize={20}
            >
              Lamaran langsung tersingkir sebelum dibaca HRD
            </text>
            <rect x={210} y={-22} width={210} height={44} rx={12} fill="rgba(244,63,94,0.2)" />
            <text
              x={315}
              y={7}
              textAnchor="middle"
              fill={p.color}
              fontFamily="Inter, Arial Black, sans-serif"
              fontWeight={900}
              fontSize={17}
            >
              {p.tag}
            </text>
          </g>
        );
      })}

      {/* Bottom Solution Banner */}
      <g transform={`translate(540, 1255) scale(${enter})`}>
        <rect
          x={-450}
          y={-42}
          width={900}
          height={84}
          rx={42}
          fill="rgba(16, 185, 129, 0.14)"
          stroke={AI_PALETTE.emerald}
          strokeWidth={2.5}
        />
        <text
          x={0}
          y={8}
          textAnchor="middle"
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={23}
          letterSpacing={0.8}
        >
          SOLUSI: KOMBINASI LINKEDIN + CHATGPT + GMAIL
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// JOB SCENE 2: LINKEDIN JOB SCAN & KEYWORD EXTRACTION
// ============================================================================
const SceneLinkedinScan: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 13}});
  const scanY = interpolate((frame * 4) % 240, [0, 240], [-70, 190]);

  const reqs = [
    {label: 'Keyword 1: Data Analysis & Reporting', badge: 'WAJIB ADA DI CV'},
    {label: 'Keyword 2: Project Management & Agile', badge: 'SKILL UTAMA'},
    {label: 'Keyword 3: Cross-Functional Collaboration', badge: 'PRIORITAS HRD'},
  ];

  return (
    <g>
      {/* LinkedIn Job Post Window */}
      <g transform={`translate(540, 680) scale(${enter})`}>
        <rect
          x={-450}
          y={-240}
          width={900}
          height={480}
          rx={28}
          fill="url(#aiCardFill)"
          stroke="#0a66c2"
          strokeWidth={3.5}
          filter="url(#aiSoftShadow)"
        />
        {/* LinkedIn Top Header */}
        <rect x={-450} y={-240} width={900} height={74} rx={28} fill="#0a66c2" />
        <rect x={-410} y={-222} width={38} height={38} rx={8} fill="#ffffff" />
        <text
          x={-391}
          y={-194}
          textAnchor="middle"
          fill="#0a66c2"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={24}
        >
          in
        </text>
        <text
          x={-352}
          y={-195}
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={23}
          letterSpacing={1}
        >
          LINKEDIN JOB DESCRIPTION
        </text>
        <rect x={180} y={-222} width={235} height={38} rx={19} fill="rgba(255,255,255,0.2)" />
        <text
          x={297}
          y={-196}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={16}
        >
          STEP 1 · COPY JD
        </text>

        {/* Job Title & Company */}
        <text
          x={-400}
          y={-118}
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={31}
        >
          Digital Operations &amp; Project Specialist
        </text>
        <text
          x={-400}
          y={-82}
          fill="#38bdf8"
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={21}
        >
          Tech Company Indonesia · Jakarta (Hybrid) · Full-Time
        </text>

        {/* Highlighted Requirements inside JD */}
        {reqs.map((r, i) => {
          const rPop = spring({frame: frame - 8 - i * 8, fps, config: {damping: 13}});
          const ry = -15 + i * 78;
          return (
            <g key={i} transform={`translate(0, ${ry}) scale(${rPop})`}>
              <rect
                x={-405}
                y={-28}
                width={810}
                height={60}
                rx={14}
                fill="rgba(0, 242, 254, 0.1)"
                stroke={AI_PALETTE.cyan}
                strokeWidth={2}
              />
              <text
                x={-380}
                y={9}
                fill="#ffffff"
                fontFamily="Inter, Arial, sans-serif"
                fontWeight={700}
                fontSize={22}
              >
                {r.label}
              </text>
              <rect x={175} y={-17} width={210} height={38} rx={10} fill="rgba(0, 242, 254, 0.2)" />
              <text
                x={280}
                y={8}
                textAnchor="middle"
                fill={AI_PALETTE.cyan}
                fontFamily="Inter, Arial Black, sans-serif"
                fontWeight={900}
                fontSize={15}
              >
                {r.badge}
              </text>
            </g>
          );
        })}

        {/* Laser Scan Line */}
        <line
          x1={-420}
          y1={scanY}
          x2={420}
          y2={scanY}
          stroke={AI_PALETTE.cyan}
          strokeWidth={3}
          opacity={0.65}
          filter="url(#aiGlow)"
        />
      </g>

      {/* Bottom Action Instruction Card */}
      <g transform={`translate(540, 1120) scale(${enter})`}>
        <rect
          x={-450}
          y={-95}
          width={900}
          height={190}
          rx={26}
          fill="url(#aiCardFill)"
          stroke={AI_PALETTE.cyan}
          strokeWidth={2.5}
          filter="url(#aiSoftShadow)"
        />
        <text
          x={0}
          y={-36}
          textAnchor="middle"
          fill={AI_PALETTE.gold}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={21}
          letterSpacing={1.5}
        >
          JANGAN LANGSUNG KLIK EASY APPLY!
        </text>
        <text
          x={0}
          y={14}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={29}
        >
          Salin Kualifikasi Lowongan → Paste ke ChatGPT
        </text>
        <text
          x={0}
          y={56}
          textAnchor="middle"
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={600}
          fontSize={22}
        >
          Biarkan AI membedah kata kunci yang dicari mesin ATS HRD
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// JOB SCENE 3: CHATGPT CV TAILORING & ATS MATCH 94%
// ============================================================================
const SceneChatgptCv: React.FC<{frame: number; fps: number; promptText?: string}> = ({
  frame,
  fps,
  promptText = 'Ini kualifikasi dari LinkedIn dan ini CV saya. Sesuaikan bullet point CV saya agar relevan dan lolos filter ATS...',
}) => {
  const enter = spring({frame, fps, config: {damping: 13}});
  const chars = Math.min(promptText.length, Math.floor(frame * 1.8));
  const typed = promptText.slice(0, chars);

  const oldBar = interpolate(frame, [8, 35], [0, 210], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const newBar = interpolate(frame, [15, 50], [0, 560], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <g>
      {/* ChatGPT Prompt Terminal */}
      <g transform={`translate(540, 565) scale(${enter})`}>
        <rect
          x={-450}
          y={-150}
          width={900}
          height={300}
          rx={28}
          fill="#0b1520"
          stroke="#10a37f"
          strokeWidth={3.5}
          filter="url(#aiSoftShadow)"
        />
        {/* ChatGPT Header */}
        <rect x={-450} y={-150} width={900} height={64} rx={28} fill="#10a37f" />
        <circle cx={-400} cy={-118} r={16} fill="#ffffff" />
        <circle cx={-400} cy={-118} r={8} fill="#10a37f" />
        <text
          x={-368}
          y={-110}
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={22}
          letterSpacing={1}
        >
          CHATGPT · CV &amp; ATS OPTIMIZER
        </text>

        {/* Prompt Input Area */}
        <rect
          x={-415}
          y={-66}
          width={830}
          height={188}
          rx={18}
          fill="#060c14"
          stroke="rgba(16, 163, 127, 0.35)"
          strokeWidth={2}
        />
        <text
          x={-385}
          y={-24}
          fill="#10b981"
          fontFamily="Inter, monospace"
          fontWeight={800}
          fontSize={20}
        >
          PROMPT CHATGPT &gt;
        </text>
        {wrapWords(typed, 46)
          .slice(0, 3)
          .map((line, lIdx) => (
            <text
              key={lIdx}
              x={-385}
              y={16 + lIdx * 34}
              fill="#ffffff"
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={600}
              fontSize={23}
            >
              {line}
            </text>
          ))}
      </g>

      {/* ATS Score Upgrade Card */}
      <g transform={`translate(540, 1020) scale(${enter})`}>
        <rect
          x={-450}
          y={-215}
          width={900}
          height={430}
          rx={28}
          fill="url(#aiCardFill)"
          stroke={AI_PALETTE.emerald}
          strokeWidth={3}
          filter="url(#aiSoftShadow)"
        />
        <text
          x={-400}
          y={-152}
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={22}
          letterSpacing={1.5}
        >
          HASIL OPTIMASI CV DENGAN CHATGPT:
        </text>

        {/* Before Row */}
        <text
          x={-400}
          y={-96}
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={22}
        >
          CV Lama (Umum / Copy-Paste)
        </text>
        <rect x={-400} y={-78} width={oldBar} height={40} rx={10} fill="url(#aiCoralRed)" />
        <text
          x={-380 + oldBar}
          y={-50}
          fill={AI_PALETTE.coral}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={24}
        >
          32% MATCH (DITOLAK)
        </text>

        {/* After Row */}
        <text
          x={-400}
          y={6}
          fill={AI_PALETTE.cyan}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={800}
          fontSize={22}
        >
          CV Tailored ChatGPT (Sesuai Keyword LinkedIn)
        </text>
        <rect x={-400} y={24} width={newBar} height={42} rx={10} fill="url(#aiEmeraldCyan)" filter="url(#aiGlow)" />
        <text
          x={-380 + newBar}
          y={53}
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={25}
        >
          94% LOLOS ATS!
        </text>

        {/* 3 Keyword Match Pills */}
        {['✓ Keyword ATS Masuk', '✓ Pencapaian Terukur', '✓ Relevan 100%'].map((kw, i) => (
          <g key={i} transform={`translate(${-285 + i * 285}, 135)`}>
            <rect
              x={-130}
              y={-26}
              width={260}
              height={52}
              rx={14}
              fill="rgba(16, 185, 129, 0.16)"
              stroke={AI_PALETTE.emerald}
              strokeWidth={1.8}
            />
            <text
              x={0}
              y={7}
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="Inter, Arial, sans-serif"
              fontWeight={800}
              fontSize={19}
            >
              {kw}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
};

// ============================================================================
// JOB SCENE 4: CHATGPT COLD EMAIL & COVER LETTER GENERATOR
// ============================================================================
const SceneChatgptEmail: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const parts = [
    {
      title: '01 · Subject Email Anti-Skip',
      desc: 'Lamaran [Posisi] - [Nama] · Siap Bantu [Target Perusahaan]',
      tag: 'OPEN RATE TINGGI',
      color: AI_PALETTE.cyan,
    },
    {
      title: '02 · Paragraf Pembuka & Bukti Skill',
      desc: 'ChatGPT merangkum 3 pencapaian terbaikmu yang relevan dengan JD',
      tag: 'PERSONALIZED',
      color: AI_PALETTE.emerald,
    },
    {
      title: '03 · Call to Action Profesional',
      desc: 'Tutup dengan ajakan diskusi singkat & lampiran CV ATS-friendly',
      tag: 'SIAP KIRIM',
      color: AI_PALETTE.gold,
    },
  ];

  return (
    <g>
      {parts.map((item, i) => {
        const cardPop = spring({frame: frame - i * 8, fps, config: {damping: 13}});
        const yPos = 555 + i * 265;
        return (
          <g key={i} transform={`translate(540, ${yPos}) scale(${cardPop})`} opacity={cardPop}>
            <rect
              x={-450}
              y={-105}
              width={900}
              height={210}
              rx={26}
              fill="url(#aiCardFill)"
              stroke={item.color}
              strokeWidth={3}
              filter="url(#aiSoftShadow)"
            />
            <rect x={-450} y={-65} width={10} height={130} rx={5} fill={item.color} />

            {/* Tag badge */}
            <g transform="translate(285, -62)">
              <rect
                x={-130}
                y={-20}
                width={260}
                height={38}
                rx={19}
                fill="rgba(255,255,255,0.08)"
                stroke={item.color}
                strokeWidth={1.5}
              />
              <text
                x={0}
                y={6}
                textAnchor="middle"
                fill={item.color}
                fontFamily="Inter, Arial Black, sans-serif"
                fontWeight={900}
                fontSize={16}
                letterSpacing={1.2}
              >
                {item.tag}
              </text>
            </g>

            <text
              x={-400}
              y={-12}
              fill="#ffffff"
              fontFamily="Inter, Arial Black, sans-serif"
              fontWeight={900}
              fontSize={29}
            >
              {item.title}
            </text>

            {wrapWords(item.desc, 52)
              .slice(0, 2)
              .map((line, lIdx) => (
                <text
                  key={lIdx}
                  x={-400}
                  y={36 + lIdx * 34}
                  fill={AI_PALETTE.textMuted}
                  fontFamily="Inter, Arial, sans-serif"
                  fontWeight={600}
                  fontSize={23}
                >
                  {line}
                </text>
              ))}
          </g>
        );
      })}
    </g>
  );
};

// ============================================================================
// JOB SCENE 5: GMAIL DIRECT SEND TO HRD / RECRUITER
// ============================================================================
const SceneGmailSend: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 13}});
  const btnPop = spring({frame: frame - 18, fps, config: {damping: 11}});

  return (
    <g>
      {/* Gmail Compose Window */}
      <g transform={`translate(540, 745) scale(${enter})`}>
        <rect
          x={-450}
          y={-310}
          width={900}
          height={620}
          rx={28}
          fill="url(#aiCardFill)"
          stroke="#ea4335"
          strokeWidth={3.5}
          filter="url(#aiSoftShadow)"
        />
        {/* Gmail Top Header Bar */}
        <rect x={-450} y={-310} width={900} height={72} rx={28} fill="#ea4335" />
        <rect x={-410} y={-293} width={44} height={38} rx={8} fill="#ffffff" />
        <text
          x={-388}
          y={-265}
          textAnchor="middle"
          fill="#ea4335"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={25}
        >
          M
        </text>
        <text
          x={-348}
          y={-265}
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={23}
          letterSpacing={1}
        >
          GMAIL · PESAN LAMARAN BARU
        </text>

        {/* To Field */}
        <text
          x={-405}
          y={-192}
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={21}
        >
          Kepada:
        </text>
        <rect
          x={-300}
          y={-218}
          width={450}
          height={40}
          rx={20}
          fill="rgba(59, 130, 246, 0.18)"
          stroke="#3b82f6"
          strokeWidth={1.5}
        />
        <text
          x={-75}
          y={-191}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={20}
        >
          recruitment@perusahaan-impian.com
        </text>
        <line x1={-405} y1={-162} x2={405} y2={-162} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />

        {/* Subject Field */}
        <text
          x={-405}
          y={-122}
          fill={AI_PALETTE.gold}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={800}
          fontSize={21}
        >
          Subjek:
        </text>
        <text
          x={-310}
          y={-122}
          fill="#ffffff"
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={800}
          fontSize={21}
        >
          Project Specialist - Lelianto (Portofolio &amp; CV ATS)
        </text>
        <line x1={-405} y1={-96} x2={405} y2={-96} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />

        {/* Email Body Lines */}
        <text x={-405} y={-48} fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={22}>
          Halo Tim Rekrutmen / Hiring Manager,
        </text>
        <text x={-405} y={-6} fill={AI_PALETTE.textMuted} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={21}>
          Melalui LinkedIn saya melihat posisi Project Specialist yang dibuka.
        </text>
        <text x={-405} y={30} fill={AI_PALETTE.textMuted} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={21}>
          Berikut 3 dampak relevan dan CV yang telah disesuaikan dengan
        </text>
        <text x={-405} y={66} fill={AI_PALETTE.textMuted} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={21}>
          kebutuhan tim Anda...
        </text>

        {/* Attachment Box */}
        <rect
          x={-405}
          y={104}
          width={810}
          height={68}
          rx={16}
          fill="rgba(16, 185, 129, 0.14)"
          stroke={AI_PALETTE.emerald}
          strokeWidth={2}
        />
        <text
          x={-375}
          y={146}
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={22}
        >
          📎 CV_Lelianto_Tailored_ATS_94.pdf  ·  Portofolio.pdf
        </text>

        {/* Send Button + Sent Status */}
        <g transform={`translate(-210, 232) scale(${btnPop})`}>
          <rect x={-195} y={-36} width={390} height={72} rx={36} fill="#2563eb" filter="url(#aiGlow)" />
          <text
            x={0}
            y={9}
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="Inter, Arial Black, sans-serif"
            fontWeight={900}
            fontSize={24}
            letterSpacing={1}
          >
            KIRIM VIA GMAIL  ➤
          </text>
        </g>

        <g transform={`translate(215, 232) scale(${btnPop})`}>
          <rect
            x={-190}
            y={-36}
            width={380}
            height={72}
            rx={36}
            fill="rgba(16, 185, 129, 0.2)"
            stroke={AI_PALETTE.emerald}
            strokeWidth={2}
          />
          <text
            x={0}
            y={8}
            textAnchor="middle"
            fill={AI_PALETTE.emerald}
            fontFamily="Inter, Arial Black, sans-serif"
            fontWeight={900}
            fontSize={20}
          >
            ✓ MASUK INBOX HRD
          </text>
        </g>
      </g>

      {/* Bottom Tip Banner */}
      <g transform={`translate(540, 1185) scale(${enter})`}>
        <rect
          x={-450}
          y={-48}
          width={900}
          height={96}
          rx={24}
          fill="url(#aiCardFill)"
          stroke={AI_PALETTE.cyan}
          strokeWidth={2.5}
        />
        <text
          x={0}
          y={-4}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={25}
        >
          DOUBLE ATTACK: APPLY DI LINKEDIN + EMAIL KE HRD
        </text>
        <text
          x={0}
          y={30}
          textAnchor="middle"
          fill={AI_PALETTE.cyan}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={20}
        >
          Nama kamu langsung menonjol dibanding ratusan pelamar pasif
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// JOB SCENE 6: COMPARISON (Passive Applicant vs Smart AI Job Seeker)
// ============================================================================
const SceneJobComparison: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const leftPop = spring({frame, fps, config: {damping: 13}});
  const rightPop = spring({frame: frame - 10, fps, config: {damping: 13}});

  return (
    <g>
      {/* Passive Job Seeker */}
      <g transform={`translate(540, 575) scale(${leftPop})`}>
        <rect
          x={-450}
          y={-145}
          width={900}
          height={290}
          rx={28}
          fill="url(#aiCardFill)"
          stroke="rgba(244, 63, 94, 0.55)"
          strokeWidth={3}
          filter="url(#aiSoftShadow)"
        />
        <rect
          x={-400}
          y={-110}
          width={390}
          height={46}
          rx={12}
          fill="rgba(244, 63, 94, 0.2)"
          stroke="rgba(244, 63, 94, 0.45)"
          strokeWidth={1.5}
        />
        <text
          x={-205}
          y={-80}
          textAnchor="middle"
          fill={AI_PALETTE.coral}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={19}
          letterSpacing={0.8}
        >
          PELAMAR PASIF (CARA LAMA)
        </text>
        <text
          x={-400}
          y={-18}
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={30}
        >
          ❌ Sebar 1 CV Sama Tanpa Strategi
        </text>
        <text
          x={-400}
          y={34}
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={600}
          fontSize={24}
        >
          • Gagal di saringan awal mesin ATS LinkedIn
        </text>
        <text
          x={-400}
          y={76}
          fill={AI_PALETTE.textMuted}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={600}
          fontSize={24}
        >
          • Menunggu berbulan-bulan tanpa kepastian
        </text>
      </g>

      {/* AI-Powered Job Seeker */}
      <g transform={`translate(540, 995) scale(${rightPop})`}>
        <rect
          x={-450}
          y={-165}
          width={900}
          height={330}
          rx={28}
          fill="url(#aiCardFill)"
          stroke={AI_PALETTE.emerald}
          strokeWidth={3.5}
          filter="url(#aiSoftShadow)"
        />
        <rect
          x={-400}
          y={-126}
          width={520}
          height={46}
          rx={12}
          fill="rgba(16, 185, 129, 0.22)"
          stroke="rgba(16, 185, 129, 0.45)"
          strokeWidth={1.5}
        />
        <text
          x={-140}
          y={-96}
          textAnchor="middle"
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={19}
          letterSpacing={0.8}
        >
          STRATEGI CHATGPT × LINKEDIN × GMAIL
        </text>
        <text
          x={-400}
          y={-32}
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={31}
        >
          ✅ Peluang Dipanggil Interview 5x Lipat
        </text>
        <text
          x={-400}
          y={22}
          fill={AI_PALETTE.cyan}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={24}
        >
          • Bedah keyword lowongan LinkedIn dalam 30 detik
        </text>
        <text
          x={-400}
          y={66}
          fill={AI_PALETTE.emerald}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={24}
        >
          • Optimasi CV &amp; surat lamaran personal di ChatGPT
        </text>
        <text
          x={-400}
          y={110}
          fill={AI_PALETTE.gold}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight={700}
          fontSize={24}
        >
          • Kirim email profesional langsung ke Gmail HRD
        </text>
      </g>
    </g>
  );
};

// ============================================================================
// MAIN STORY COMPONENT (Timeline Sync + Header + Watermark + Subtitles)
// ============================================================================
export const AiProductivityStory: React.FC<{
  words: AiWord[];
  scenes: AiScene[];
  name?: string;
  watermark?: string;
  keywords?: string[];
  accent?: string;
}> = ({
  words,
  scenes,
  name = 'AI × SIDE JOB',
  watermark = DEFAULT_HANDLE,
  keywords = [],
  accent = AI_PALETTE.cyan,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const kwSet = React.useMemo(() => new Set(keywords.map(clean)), [keywords]);

  // Compute scene boundaries from spoken cue words
  const sceneTimeline = React.useMemo(() => {
    if (!scenes.length) {
      return [{scene: {kind: 'burnout', cue: null} as AiScene, startF: 0, endF: durationInFrames}];
    }

    const segments: {scene: AiScene; startF: number; endF: number}[] = [];
    let curIdx = 0;
    let startF = 0;
    let lastMatchWordIdx = 0;

    for (let i = 1; i < scenes.length; i++) {
      const s = scenes[i];
      if (!s.cue) continue;
      const target = clean(s.cue);
      let foundIdx = -1;
      for (let wIdx = lastMatchWordIdx; wIdx < words.length; wIdx++) {
        if (clean(words[wIdx].text).includes(target)) {
          foundIdx = wIdx;
          break;
        }
      }
      if (foundIdx !== -1) {
        const match = words[foundIdx];
        const cueFrame = Math.max(startF + 35, Math.round((match.fromMs / 1000) * fps));
        segments.push({scene: scenes[curIdx], startF, endF: cueFrame});
        startF = cueFrame;
        curIdx = i;
        lastMatchWordIdx = foundIdx + 1;
      }
    }
    segments.push({scene: scenes[curIdx], startF, endF: durationInFrames});
    return segments;
  }, [scenes, words, fps, durationInFrames]);

  const activeSegment =
    sceneTimeline.find((s) => frame >= s.startF && frame < s.endF) ||
    sceneTimeline[sceneTimeline.length - 1];
  const localF = frame - activeSegment.startF;
  const curScene = activeSegment.scene;

  // Subtitle pagination: smart 1-line chunks (max 3 words & <=22 chars) so subtitles never wrap to 2 lines
  const nowMs = (frame / fps) * 1000;
  const pages = React.useMemo(() => {
    const out: {words: AiWord[]; startMs: number; endMs: number}[] = [];
    let cur: AiWord[] = [];
    let curChars = 0;
    for (const w of words) {
      const len = w.text.length;
      if (cur.length > 0 && (cur.length >= 3 || curChars + 1 + len > 22)) {
        out.push({
          words: cur,
          startMs: cur[0].fromMs,
          endMs: cur[cur.length - 1].toMs,
        });
        cur = [w];
        curChars = len;
      } else {
        cur.push(w);
        curChars += (cur.length > 1 ? 1 : 0) + len;
      }
    }
    if (cur.length) {
      out.push({
        words: cur,
        startMs: cur[0].fromMs,
        endMs: cur[cur.length - 1].toMs,
      });
    }
    return out;
  }, [words]);

  const activePage = React.useMemo(() => {
    if (!pages.length) return null;
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const nextStart = i + 1 < pages.length ? pages[i + 1].startMs : Infinity;
      if (nowMs >= p.startMs && nowMs < nextStart) {
        return p;
      }
    }
    return pages[0];
  }, [pages, nowMs]);

  const progressPct = Math.min(100, (frame / Math.max(1, durationInFrames - 1)) * 100);

  return (
    <AbsoluteFill style={{background: AI_PALETTE.bgDeep, overflow: 'hidden'}}>
      {/* Main SVG Motion Graphics Canvas */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <AiDefs />
        <CyberBackground globalFrame={frame} kind={curScene.kind} />

        {/* Scene Header Banner */}
        <SceneHeaderCard
          kicker={curScene.kicker}
          label={curScene.label}
          sub={curScene.sub}
          frame={localF}
          fps={fps}
          accentColor={
            curScene.kind === 'burnout' || curScene.kind === 'job_hook'
              ? AI_PALETTE.coral
              : curScene.kind === 'sidejobs' ||
                curScene.kind === 'time_unlocked' ||
                curScene.kind === 'chatgpt_email'
              ? AI_PALETTE.gold
              : curScene.kind === 'chatgpt_cv'
              ? AI_PALETTE.emerald
              : AI_PALETTE.cyan
          }
        />

        {/* Scene Visual Body */}
        {curScene.kind === 'burnout' && <SceneBurnout frame={localF} fps={fps} />}
        {curScene.kind === 'leverage' && <SceneLeverage frame={localF} fps={fps} />}
        {curScene.kind === 'workflow' && (
          <SceneWorkflow frame={localF} fps={fps} promptText={curScene.promptText} />
        )}
        {curScene.kind === 'time_unlocked' && <SceneTimeUnlocked frame={localF} fps={fps} />}
        {curScene.kind === 'sidejobs' && (
          <SceneSideJobs frame={localF} fps={fps} items={curScene.items} />
        )}
        {curScene.kind === 'execution' && <SceneExecution frame={localF} fps={fps} />}
        {curScene.kind === 'mindset' && <SceneMindset frame={localF} fps={fps} />}
        {curScene.kind === 'job_hook' && <SceneJobHook frame={localF} fps={fps} />}
        {curScene.kind === 'linkedin_scan' && <SceneLinkedinScan frame={localF} fps={fps} />}
        {curScene.kind === 'chatgpt_cv' && (
          <SceneChatgptCv frame={localF} fps={fps} promptText={curScene.promptText} />
        )}
        {curScene.kind === 'chatgpt_email' && <SceneChatgptEmail frame={localF} fps={fps} />}
        {curScene.kind === 'gmail_send' && <SceneGmailSend frame={localF} fps={fps} />}
        {curScene.kind === 'job_comparison' && <SceneJobComparison frame={localF} fps={fps} />}
        {curScene.kind === 'outro' && (
          <SceneOutro frame={localF} fps={fps} handle={watermark} />
        )}
      </svg>

      {/* TOP PROGRESS BAR */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 8,
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #8b5cf6, #00f2fe, #10b981)',
            boxShadow: '0 0 16px #00f2fe',
          }}
        />
      </div>

      {/* TOP-LEFT TOPIC BADGE */}
      <div
        style={{
          position: 'absolute',
          top: 68,
          left: 48,
          padding: '12px 26px',
          borderRadius: 999,
          background: 'rgba(11, 17, 36, 0.88)',
          border: `2.5px solid ${accent}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 12px ${accent}`,
          }}
        />
        <span
          style={{
            fontFamily: 'Inter, Arial Black, sans-serif',
            fontWeight: 900,
            fontSize: 23,
            color: '#ffffff',
            letterSpacing: 1.5,
          }}
        >
          {name.toUpperCase()}
        </span>
      </div>

      {/* TOP-RIGHT PERSISTENT INSTAGRAM WATERMARK */}
      <div
        style={{
          position: 'absolute',
          top: 66,
          right: 48,
          padding: '10px 24px 10px 16px',
          borderRadius: 999,
          background: 'rgba(11, 17, 36, 0.9)',
          border: '2px solid rgba(255, 255, 255, 0.22)',
          boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Instagram Gradient Camera Icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            background:
              'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(220, 39, 67, 0.5)',
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: '3px solid #ffffff',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: 'Inter, Arial Black, sans-serif',
            fontWeight: 900,
            fontSize: 27,
            color: '#ffffff',
            letterSpacing: 0.6,
          }}
        >
          {watermark}
        </span>
      </div>

      {/* BOTTOM KINETIC KARAOKE SUBTITLES (Crisp, non-overlapping word pills) */}
      {activePage && (
        <div
          style={{
            position: 'absolute',
            bottom: 210,
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            padding: '0 44px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: 980,
              padding: '20px 34px',
              borderRadius: 30,
              background: 'rgba(7, 11, 24, 0.92)',
              border: '2.5px solid rgba(0, 242, 254, 0.28)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.78)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px 16px',
            }}
          >
            {activePage.words.map((w, idx) => {
              const isKw = kwSet.has(clean(w.text));
              const isSpoken = nowMs >= w.fromMs && nowMs <= w.toMs + 120;
              const isPast = nowMs > w.toMs + 120;

              return (
                <span
                  key={`${w.fromMs}-${idx}`}
                  style={{
                    display: 'inline-block',
                    padding: isSpoken ? '6px 16px' : '4px 8px',
                    borderRadius: 14,
                    background: isSpoken
                      ? isKw
                        ? 'rgba(255, 210, 63, 0.22)'
                        : 'rgba(0, 242, 254, 0.2)'
                      : 'transparent',
                    border: isSpoken
                      ? `2px solid ${isKw ? '#ffd23f' : '#00f2fe'}`
                      : '2px solid transparent',
                    fontFamily: 'Inter, Arial Black, sans-serif',
                    fontWeight: 900,
                    fontSize: 42,
                    lineHeight: 1.15,
                    color: isSpoken
                      ? isKw
                        ? '#ffd23f'
                        : '#00f2fe'
                      : isKw
                      ? '#ffd23f'
                      : isPast
                      ? '#ffffff'
                      : 'rgba(255, 255, 255, 0.62)',
                    textShadow: isSpoken ? '0 4px 18px rgba(0, 242, 254, 0.45)' : 'none',
                  }}
                >
                  {w.text}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtle Bottom Handle Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 135,
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, Arial, sans-serif',
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: 2.5,
            color: 'rgba(148, 163, 184, 0.75)',
          }}
        >
          INSTAGRAM · {watermark.toUpperCase()} · AI & PRODUCTIVITY
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// STANDALONE "AiReel" COMPOSITION (Isolated from content.json / voiceover.wav)
// ============================================================================
const tokensToWords = (tokens: AiWord[]): AiWord[] => {
  const words: AiWord[] = [];
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

export const AiReel: React.FC = () => {
  const {durationInFrames} = useVideoConfig();
  const [wordsRaw, setWordsRaw] = useState<AiWord[] | null>(null);
  const [handle] = useState(() => delayRender('ai-captions'));

  useEffect(() => {
    fetch(staticFile('captions-ai.json'))
      .then((r) => (r.ok ? r.json() : []))
      .then((caps: Caption[]) => {
        const safe = caps ?? [];
        const combined = tokensToWords(
          safe.map((c) => ({text: c.text, fromMs: c.startMs, toMs: c.endMs})),
        );
        setWordsRaw(combined);
        continueRender(handle);
      })
      .catch(() => {
        setWordsRaw([]);
        continueRender(handle);
      });
  }, [handle]);

  const aiContent = aiRawContent as {
    name?: string;
    watermark?: string;
    accent?: string;
    music?: string;
    musicVolume?: number;
    keywords?: string[];
    captionFixes?: Record<string, string>;
    aiScenes?: AiScene[];
  };

  const words = useMemo(() => {
    const fixes = aiContent.captionFixes ?? {};
    return (wordsRaw ?? [])
      .map((w) => {
        const bare = w.text.replace(/[.,?!:]+$/, '');
        const fix = fixes[bare];
        return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
      })
      .filter((w) => w.text.trim() !== '');
  }, [wordsRaw, aiContent.captionFixes]);

  const vol = aiContent.musicVolume ?? 0.08;

  return (
    <AbsoluteFill style={{background: '#050811'}}>
      <Audio src={staticFile('voiceover-ai.wav')} />
      {aiContent.music && (
        <Audio
          src={staticFile(aiContent.music)}
          volume={(f) =>
            interpolate(
              f,
              [0, 18, durationInFrames - 25, durationInFrames],
              [0, vol, vol, 0],
              {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
            )
          }
        />
      )}
      {words.length ? (
        <AiProductivityStory
          words={words}
          scenes={(aiContent.aiScenes as AiScene[]) ?? []}
          name={aiContent.name ?? 'CHATGPT × LINKEDIN'}
          watermark={aiContent.watermark ?? DEFAULT_HANDLE}
          keywords={aiContent.keywords ?? []}
          accent={aiContent.accent ?? '#00f2fe'}
        />
      ) : null}
    </AbsoluteFill>
  );
};
