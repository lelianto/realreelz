// "YoutubePsych" template: Widescreen 16:9 (1920x1080) Long-Form YouTube Documentary
// Topic: Psychology, Logical Fallacies, and Their 2,400-Year History
// Features: Multi-chapter timeline HUD, running timecode, split widescreen stage
// (animated SVG historical/psychological diagrams + structured dossier panel),
// chapter transition bumpers, and broadcast lower-third karaoke subtitles.
import React, {useEffect, useMemo, useState} from 'react';
import {DEFAULT_HANDLE} from './brand';
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  getRemotionEnvironment,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {Caption} from '@remotion/captions';
import ytRawContent from './content-youtube-psych.json';

export type YtWord = {text: string; fromMs: number; toMs: number};

export type YtChapter = {
  number: string;
  title: string;
  era?: string;
};

export type YtScene = {
  kind: string;
  cue: string | null;
  chapterIndex?: number;
  isChapterStart?: boolean;
  era?: string;
  label?: string;
  sub?: string;
  quote?: string;
  author?: string;
  formula?: string;
  statValue?: string;
  statLabel?: string;
  leftLabel?: string;
  rightLabel?: string;
  points?: string[];
};

const W = 1920;
const H = 1080;

export const YT_PALETTE = {
  bgDeep: '#070a12',
  bgMid: '#0e1525',
  bgPanel: 'rgba(15, 23, 42, 0.86)',
  bgCard: 'rgba(18, 28, 50, 0.9)',
  gold: '#e5b84b',
  goldBright: '#ffd23f',
  parchment: '#f3e8d2',
  cyan: '#22d3ee',
  blue: '#3b82f6',
  emerald: '#10b981',
  coral: '#f43f5e',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  borderSubtle: 'rgba(255, 255, 255, 0.12)',
  borderGold: 'rgba(229, 184, 75, 0.45)',
};

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const wrapText = (text: string, maxChars: number): string[] => {
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

const formatTimecode = (sec: number): string => {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
};

// ============================================================================
// Shared SVG Gradients & Filters
// ============================================================================
const YtDefs: React.FC = () => (
  <defs>
    <linearGradient id="ytBgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#060911" />
      <stop offset="50%" stopColor="#0d1424" />
      <stop offset="100%" stopColor="#080c17" />
    </linearGradient>

    <linearGradient id="ytStageGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(17, 26, 46, 0.92)" />
      <stop offset="100%" stopColor="rgba(9, 14, 26, 0.96)" />
    </linearGradient>

    <linearGradient id="ytGoldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#fde68a" />
      <stop offset="50%" stopColor="#e5b84b" />
      <stop offset="100%" stopColor="#b47b18" />
    </linearGradient>

    <linearGradient id="ytCyanGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#67e8f9" />
      <stop offset="50%" stopColor="#22d3ee" />
      <stop offset="100%" stopColor="#0284c7" />
    </linearGradient>

    <linearGradient id="ytCoralGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#fda4af" />
      <stop offset="50%" stopColor="#f43f5e" />
      <stop offset="100%" stopColor="#be123c" />
    </linearGradient>

    <linearGradient id="ytEmeraldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#6ee7b7" />
      <stop offset="50%" stopColor="#10b981" />
      <stop offset="100%" stopColor="#047857" />
    </linearGradient>

    <linearGradient id="ytParchGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#f7eedc" />
      <stop offset="55%" stopColor="#e6d3b3" />
      <stop offset="100%" stopColor="#c7ae83" />
    </linearGradient>

    <linearGradient id="ytMarbleGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#f1f5f9" />
      <stop offset="65%" stopColor="#cbd5e1" />
      <stop offset="100%" stopColor="#94a3b8" />
    </linearGradient>

    <radialGradient id="ytGoldAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(229, 184, 75, 0.25)" />
      <stop offset="65%" stopColor="rgba(229, 184, 75, 0.06)" />
      <stop offset="100%" stopColor="rgba(229, 184, 75, 0)" />
    </radialGradient>

    <radialGradient id="ytCyanAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(34, 211, 238, 0.24)" />
      <stop offset="65%" stopColor="rgba(59, 130, 246, 0.06)" />
      <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
    </radialGradient>

    <radialGradient id="ytCoralAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(244, 63, 94, 0.24)" />
      <stop offset="65%" stopColor="rgba(244, 63, 94, 0.05)" />
      <stop offset="100%" stopColor="rgba(244, 63, 94, 0)" />
    </radialGradient>
  </defs>
);

// ============================================================================
// Atmospheric Documentary Background (1920x1080)
// ============================================================================
const DocumentaryBackdrop: React.FC<{frame: number; chapterIdx: number}> = ({
  chapterIdx,
}) => {
  const isWarm = chapterIdx === 1 || chapterIdx === 3 || chapterIdx === 6;
  const auraId = isWarm ? 'ytGoldAura' : chapterIdx === 2 ? 'ytCoralAura' : 'ytCyanAura';

  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill="url(#ytBgGrad)" />
      <circle cx={600} cy={520} r={650} fill={`url(#${auraId})`} />
      <circle cx={1450} cy={500} r={520} fill="url(#ytGoldAura)" />

      {/* Subtle architectural grid */}
      <g>
        {Array.from({length: 25}).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 80}
            y1={0}
            x2={i * 80}
            y2={H}
            stroke="rgba(148, 163, 184, 0.07)"
            strokeWidth={1}
          />
        ))}
        {Array.from({length: 15}).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * 80}
            x2={W}
            y2={i * 80}
            stroke="rgba(148, 163, 184, 0.07)"
            strokeWidth={1}
          />
        ))}
      </g>

      {/* Main Left Visual Stage Container (x: 56..1186, y: 215..885) */}
      <rect
        x={56}
        y={215}
        width={1130}
        height={670}
        rx={24}
        fill="url(#ytStageGrad)"
        stroke="rgba(229, 184, 75, 0.28)"
        strokeWidth={2}
      />
      {/* Corner ornamental brackets on main stage */}
      <path
        d="M 56 245 L 56 215 L 86 215"
        fill="none"
        stroke={YT_PALETTE.gold}
        strokeWidth={3.5}
      />
      <path
        d="M 1156 215 L 1186 215 L 1186 245"
        fill="none"
        stroke={YT_PALETTE.gold}
        strokeWidth={3.5}
      />
      <path
        d="M 56 855 L 56 885 L 86 885"
        fill="none"
        stroke={YT_PALETTE.gold}
        strokeWidth={3.5}
      />
      <path
        d="M 1156 885 L 1186 885 L 1186 855"
        fill="none"
        stroke={YT_PALETTE.gold}
        strokeWidth={3.5}
      />
    </g>
  );
};

// ============================================================================
// Right-Side Documentary Dossier Panel (x: 1212..1864, y: 215..885)
// ============================================================================
const DossierPanel: React.FC<{
  scene: YtScene;
  localFrame: number;
  fps: number;
}> = ({scene, localFrame, fps}) => {
  const cardEnter = spring({frame: localFrame, fps, config: {damping: 15}});
  const points = scene.points ?? [];

  return (
    <g transform="translate(1212, 215)">
      {/* Outer Dossier Frame */}
      <rect
        x={0}
        y={0}
        width={652}
        height={670}
        rx={24}
        fill="rgba(12, 19, 36, 0.9)"
        stroke="rgba(255, 255, 255, 0.14)"
        strokeWidth={2}
      />

      {/* Dossier Header Strip */}
      <rect
        x={0}
        y={0}
        width={652}
        height={54}
        rx={24}
        fill="rgba(229, 184, 75, 0.14)"
      />
      <circle cx={30} cy={27} r={7} fill={YT_PALETTE.gold} />
      <text
        x={50}
        y={34}
        fill={YT_PALETTE.gold}
        fontFamily="Inter, Arial Black, sans-serif"
        fontWeight={900}
        fontSize={17}
        letterSpacing={2}
      >
        CATATAN RISET &amp; ANALISIS PSIKOLOGI
      </text>

      {/* Top Feature Box: Quote OR Stat OR Formula OR Dual Comparison */}
      <g
        transform={`translate(26, 74) scale(${interpolate(cardEnter, [0, 1], [0.94, 1])})`}
        opacity={cardEnter}
      >
        {scene.quote ? (
          <g>
            <rect
              x={0}
              y={0}
              width={600}
              height={176}
              rx={18}
              fill="rgba(229, 184, 75, 0.09)"
              stroke={YT_PALETTE.borderGold}
              strokeWidth={2}
            />
            <text
              x={22}
              y={46}
              fill={YT_PALETTE.gold}
              fontFamily="Georgia, serif"
              fontWeight={900}
              fontSize={48}
              opacity={0.45}
            >
              “
            </text>
            {wrapText(scene.quote, 48)
              .slice(0, 3)
              .map((line, idx) => (
                <text
                  key={idx}
                  x={48}
                  y={44 + idx * 30}
                  fill={YT_PALETTE.parchment}
                  fontFamily="Georgia, Times New Roman, serif"
                  fontStyle="italic"
                  fontWeight={700}
                  fontSize={21}
                >
                  {line}
                </text>
              ))}
            {scene.author && (
              <text
                x={48}
                y={152}
                fill={YT_PALETTE.gold}
                fontFamily="Inter, Arial, sans-serif"
                fontWeight={800}
                fontSize={16}
                letterSpacing={0.6}
              >
                — {scene.author.toUpperCase()}
              </text>
            )}
          </g>
        ) : scene.statValue ? (
          <g>
            <rect
              x={0}
              y={0}
              width={600}
              height={176}
              rx={18}
              fill="rgba(34, 211, 238, 0.08)"
              stroke="rgba(34, 211, 238, 0.4)"
              strokeWidth={2}
            />
            <line
              x1={235}
              y1={28}
              x2={235}
              y2={148}
              stroke="rgba(34, 211, 238, 0.28)"
              strokeWidth={1.5}
            />
            <text
              x={118}
              y={102}
              textAnchor="middle"
              fill={YT_PALETTE.cyan}
              fontFamily="Inter, Arial Black, sans-serif"
              fontWeight={900}
              fontSize={scene.statValue.length > 6 ? 40 : 56}
            >
              {scene.statValue}
            </text>
            {wrapText(scene.statLabel ?? '', 31)
              .slice(0, 3)
              .map((line, idx) => (
                <text
                  key={idx}
                  x={258}
                  y={60 + idx * 30}
                  fill={YT_PALETTE.textPrimary}
                  fontFamily="Inter, Arial, sans-serif"
                  fontWeight={700}
                  fontSize={19.5}
                >
                  {line}
                </text>
              ))}
          </g>
        ) : scene.formula ? (
          <g>
            <rect
              x={0}
              y={0}
              width={600}
              height={176}
              rx={18}
              fill="rgba(244, 63, 94, 0.09)"
              stroke="rgba(244, 63, 94, 0.45)"
              strokeWidth={2}
            />
            <text
              x={28}
              y={42}
              fill={YT_PALETTE.coral}
              fontFamily="Inter, Arial Black, sans-serif"
              fontWeight={900}
              fontSize={16}
              letterSpacing={1.5}
            >
              POLA &amp; RUMUS MANIPULASI LOGIKA:
            </text>
            {wrapText(scene.formula, 42)
              .slice(0, 3)
              .map((line, idx) => (
                <text
                  key={idx}
                  x={28}
                  y={84 + idx * 34}
                  fill="#ffffff"
                  fontFamily="Inter, Arial Black, sans-serif"
                  fontWeight={900}
                  fontSize={22}
                >
                  {line}
                </text>
              ))}
          </g>
        ) : (
          <g>
            <rect
              x={0}
              y={0}
              width={600}
              height={176}
              rx={18}
              fill="rgba(16, 185, 129, 0.08)"
              stroke="rgba(16, 185, 129, 0.38)"
              strokeWidth={2}
            />
            <text
              x={28}
              y={42}
              fill={YT_PALETTE.emerald}
              fontFamily="Inter, Arial Black, sans-serif"
              fontWeight={900}
              fontSize={16}
              letterSpacing={1.5}
            >
              KONTRAS KONSEP UTAMA:
            </text>
            <text
              x={28}
              y={88}
              fill={YT_PALETTE.coral}
              fontFamily="Inter, Arial Black, sans-serif"
              fontWeight={800}
              fontSize={20}
            >
              ▸ {scene.leftLabel ?? 'Pola Bias / Manipulasi'}
            </text>
            <text
              x={28}
              y={134}
              fill={YT_PALETTE.cyan}
              fontFamily="Inter, Arial Black, sans-serif"
              fontWeight={800}
              fontSize={20}
            >
              ▸ {scene.rightLabel ?? 'Realitas / Berpikir Kritis'}
            </text>
          </g>
        )}
      </g>

      {/* 3 Key Takeaway Cards */}
      {points.slice(0, 3).map((pt, idx) => {
        const pSpring = spring({
          frame: Math.max(0, localFrame - idx * 5),
          fps,
          config: {damping: 14},
        });
        const yPos = 272 + idx * 124;
        const lines = wrapText(pt, 46).slice(0, 2);

        return (
          <g
            key={idx}
            transform={`translate(26, ${yPos}) translate(${interpolate(pSpring, [0, 1], [30, 0])}, 0)`}
            opacity={pSpring}
          >
            <rect
              x={0}
              y={0}
              width={600}
              height={108}
              rx={16}
              fill="rgba(22, 33, 58, 0.85)"
              stroke="rgba(255, 255, 255, 0.11)"
              strokeWidth={1.5}
            />
            {/* Number Badge */}
            <rect
              x={18}
              y={22}
              width={54}
              height={64}
              rx={12}
              fill="rgba(229, 184, 75, 0.16)"
              stroke={YT_PALETTE.gold}
              strokeWidth={1.5}
            />
            <text
              x={45}
              y={62}
              textAnchor="middle"
              fill={YT_PALETTE.gold}
              fontFamily="Inter, Arial Black, sans-serif"
              fontWeight={900}
              fontSize={22}
            >
              0{idx + 1}
            </text>
            {lines.map((ln, lIdx) => (
              <text
                key={lIdx}
                x={92}
                y={lines.length === 1 ? 60 : 45 + lIdx * 28}
                fill={YT_PALETTE.textPrimary}
                fontFamily="Inter, Arial, sans-serif"
                fontWeight={600}
                fontSize={19.5}
              >
                {ln}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
};

// ============================================================================
// 20 BESPOKE WIDESCREEN VISUAL SCENES (Left Stage: x=56..1186, y=215..885)
// Center of Left Stage is (621, 550)
// ============================================================================

// 1. PROLOG HOOK: Paradox of the Modern Brain vs Information Overload
const ScenePrologHook: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});
  const pulse = Math.sin(frame * 0.08) * 8;

  const nodes = [
    {x: 240, y: 360, label: 'HOAKS & OPINI', col: YT_PALETTE.coral},
    {x: 210, y: 550, label: 'DEBAT POLITIK', col: YT_PALETTE.amber},
    {x: 250, y: 740, label: 'IKLAN & ALGORITMA', col: YT_PALETTE.violet},
    {x: 990, y: 360, label: 'BIAS KOGNITIF', col: YT_PALETTE.cyan},
    {x: 1020, y: 550, label: 'LOGICAL FALLACY', col: YT_PALETTE.gold},
    {x: 980, y: 740, label: 'TEKANAN SOSIAL', col: YT_PALETTE.emerald},
  ];

  return (
    <g>
      {/* Concentric radar rings */}
      <circle
        cx={621}
        cy={550}
        r={240 + pulse}
        fill="none"
        stroke="rgba(34, 211, 238, 0.18)"
        strokeWidth={2}
        strokeDasharray="10 8"
      />
      <circle
        cx={621}
        cy={550}
        r={175 - pulse * 0.5}
        fill="none"
        stroke="rgba(229, 184, 75, 0.28)"
        strokeWidth={2}
      />

      {/* Connecting neural beams */}
      {nodes.map((n, i) => (
        <g key={i}>
          <line
            x1={n.x}
            y1={n.y}
            x2={621}
            y2={550}
            stroke={n.col}
            strokeWidth={2.5}
            strokeDasharray="8 6"
            opacity={0.6}
          />
          <g transform={`translate(${n.x}, ${n.y}) scale(${enter})`}>
            <rect
              x={-115}
              y={-28}
              width={230}
              height={56}
              rx={28}
              fill="rgba(15, 23, 42, 0.94)"
              stroke={n.col}
              strokeWidth={2.5}
            />
            <text
              x={0}
              y={7}
              textAnchor="middle"
              fill={n.col}
              fontFamily="Inter, Arial Black, sans-serif"
              fontWeight={900}
              fontSize={16}
              letterSpacing={1}
            >
              {n.label}
            </text>
          </g>
        </g>
      ))}

      {/* Central glowing brain & head silhouette */}
      <g transform={`translate(621, 550) scale(${enter})`}>
        <circle
          cx={0}
          cy={0}
          r={118}
          fill="rgba(15, 23, 42, 0.95)"
          stroke={YT_PALETTE.gold}
          strokeWidth={4}
        />
        {/* Stylized Brain Hemispheres */}
        <path
          d="M -8 -65 C -55 -65, -78 -30, -72 10 C -78 45, -45 72, -8 68 Z"
          fill="rgba(244, 63, 94, 0.28)"
          stroke={YT_PALETTE.coral}
          strokeWidth={3}
        />
        <path
          d="M 8 -65 C 55 -65, 78 -30, 72 10 C 78 45, 45 72, 8 68 Z"
          fill="rgba(34, 211, 238, 0.28)"
          stroke={YT_PALETTE.cyan}
          strokeWidth={3}
        />
        {/* Neural circuit lines */}
        <circle cx={-36} cy={-15} r={6} fill={YT_PALETTE.coral} />
        <circle cx={-28} cy={25} r={6} fill={YT_PALETTE.gold} />
        <circle cx={36} cy={-15} r={6} fill={YT_PALETTE.cyan} />
        <circle cx={28} cy={25} r={6} fill={YT_PALETTE.emerald} />
        <text
          x={0}
          y={102}
          textAnchor="middle"
          fill={YT_PALETTE.parchment}
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={16}
          letterSpacing={1.5}
        >
          OTAK MANUSIA
        </text>
      </g>
    </g>
  );
};

// 2. DUAL SYSTEM BRAIN: Kahneman's System 1 vs System 2
const SceneDualSystemBrain: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});
  const bar1 = interpolate(enter, [0, 1], [0, 420]);
  const bar2 = interpolate(enter, [0, 1], [0, 45]);

  return (
    <g>
      {/* Left Hemisphere Box: System 1 */}
      <g transform={`translate(345, 510) scale(${enter})`}>
        <rect
          x={-240}
          y={-245}
          width={480}
          height={490}
          rx={24}
          fill="rgba(244, 63, 94, 0.08)"
          stroke={YT_PALETTE.coral}
          strokeWidth={3}
        />
        <rect x={-200} y={-215} width={400} height={48} rx={12} fill="url(#ytCoralGrad)" />
        <text
          x={0}
          y={-183}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={21}
          letterSpacing={1}
        >
          SISTEM 1 · OTOMATIS &amp; EMOSIONAL
        </text>

        <circle cx={0} cy={-85} r={58} fill="rgba(244, 63, 94, 0.2)" stroke={YT_PALETTE.coral} strokeWidth={3} />
        <text x={0} y={-72} textAnchor="middle" fontSize={44}>
          ⚡
        </text>

        <text x={0} y={8} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={38}>
          95% KEPUTUSAN
        </text>
        <text x={0} y={42} textAnchor="middle" fill={YT_PALETTE.textSecondary} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={19}>
          Cepat · Instingtif · Bawah Sadar
        </text>

        {/* Share bar */}
        <rect x={-210} y={80} width={420} height={22} rx={11} fill="rgba(255,255,255,0.1)" />
        <rect x={-210} y={80} width={bar1} height={22} rx={11} fill="url(#ytCoralGrad)" />

        <text x={0} y={145} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial, sans-serif" fontWeight={800} fontSize={18}>
          ⚠ SANGAT RENTAN TERHADAP FALLACY
        </text>
        <text x={0} y={180} textAnchor="middle" fill={YT_PALETTE.textMuted} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={17}>
          Langsung percaya judul provokatif &amp; emosi
        </text>
      </g>

      {/* Right Hemisphere Box: System 2 */}
      <g transform={`translate(895, 510) scale(${enter})`}>
        <rect
          x={-240}
          y={-245}
          width={480}
          height={490}
          rx={24}
          fill="rgba(34, 211, 238, 0.08)"
          stroke={YT_PALETTE.cyan}
          strokeWidth={3}
        />
        <rect x={-200} y={-215} width={400} height={48} rx={12} fill="url(#ytCyanGrad)" />
        <text
          x={0}
          y={-183}
          textAnchor="middle"
          fill="#06101e"
          fontFamily="Inter, Arial Black, sans-serif"
          fontWeight={900}
          fontSize={21}
          letterSpacing={1}
        >
          SISTEM 2 · ANALITIS &amp; LOGIS
        </text>

        <circle cx={0} cy={-85} r={58} fill="rgba(34, 211, 238, 0.2)" stroke={YT_PALETTE.cyan} strokeWidth={3} />
        <text x={0} y={-72} textAnchor="middle" fontSize={44}>
          🔍
        </text>

        <text x={0} y={8} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={38}>
          5% KEPUTUSAN
        </text>
        <text x={0} y={42} textAnchor="middle" fill={YT_PALETTE.textSecondary} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={19}>
          Lambat · Kritis · Penuh Perhitungan
        </text>

        {/* Share bar */}
        <rect x={-210} y={80} width={420} height={22} rx={11} fill="rgba(255,255,255,0.1)" />
        <rect x={-210} y={80} width={bar2} height={22} rx={11} fill="url(#ytCyanGrad)" />

        <text x={0} y={145} textAnchor="middle" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial, sans-serif" fontWeight={800} fontSize={18}>
          ✓ PERISAI UTAMA BERPIKIR KRITIS
        </text>
        <text x={0} y={180} textAnchor="middle" fill={YT_PALETTE.textMuted} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={17}>
          Boros energi glukosa, jarang diaktifkan
        </text>
      </g>

      {/* Bottom Attribution Pill */}
      <g transform="translate(621, 825)">
        <rect x={-360} y={-26} width={720} height={52} rx={26} fill="rgba(229, 184, 75, 0.16)" stroke={YT_PALETTE.gold} strokeWidth={2} />
        <text x={0} y={7} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={18} letterSpacing={1}>
          DANIEL KAHNEMAN · THINKING, FAST AND SLOW (NOBEL EKONOMI 2002)
        </text>
      </g>
    </g>
  );
};

// 3. COGNITIVE MISER: Energy Shortcut vs Deep Analysis Path
const SceneCognitiveMiser: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g transform={`scale(${ interpolate(enter, [0, 1], [0.96, 1]) })`} opacity={enter}>
      {/* Top Energy Comparison Meter */}
      <g transform="translate(621, 330)">
        <rect x={-500} y={-75} width={1000} height={150} rx={22} fill="rgba(15,23,42,0.9)" stroke={YT_PALETTE.borderGold} strokeWidth={2} />
        <text x={-460} y={-28} fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={20}>
          PARADOKS ENERGI BIOLOGIS OTAK MANUSIA
        </text>
        {/* 2% weight vs 20% energy */}
        <rect x={-460} y={0} width={420} height={46} rx={12} fill="rgba(34, 211, 238, 0.16)" stroke={YT_PALETTE.cyan} strokeWidth={2} />
        <text x={-250} y={30} textAnchor="middle" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={21}>
          BERAT OTAK: HANYA 2% TUBUH
        </text>
        <rect x={20} y={0} width={440} height={46} rx={12} fill="rgba(244, 63, 94, 0.2)" stroke={YT_PALETTE.coral} strokeWidth={2} />
        <text x={240} y={30} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={21}>
          KONSUMSI ENERGI: 20% KALORI TUBUH
        </text>
      </g>

      {/* Fork in the Road Diagram */}
      <g transform="translate(621, 635)">
        {/* Start Node */}
        <rect x={-510} y={-45} width={220} height={90} rx={18} fill="url(#ytGoldGrad)" />
        <text x={-400} y={-5} textAnchor="middle" fill="#090d16" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={19}>
          INFORMASI /
        </text>
        <text x={-400} y={22} textAnchor="middle" fill="#090d16" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={19}>
          OPINI MASUK
        </text>

        {/* Upper Path: Fast Heuristic Shortcut */}
        <path d="M -290 -15 C -150 -130, -50 -130, 90 -130" fill="none" stroke={YT_PALETTE.coral} strokeWidth={6} />
        <rect x={90} y={-195} width={410} height={130} rx={20} fill="rgba(244, 63, 94, 0.14)" stroke={YT_PALETTE.coral} strokeWidth={3} />
        <text x={295} y={-148} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={22}>
          JALAN PINTAS HEURISTIK (HEMAT ENERGI)
        </text>
        <text x={295} y={-112} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={18}>
          Cocok dengan emosi / mayoritas? Langsung percaya!
        </text>
        <text x={295} y={-82} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
          ➔ PINTU MASUK LOGICAL FALLACY
        </text>

        {/* Lower Path: Slow Analytical Verification */}
        <path d="M -290 15 C -150 130, -50 130, 90 130" fill="none" stroke={YT_PALETTE.cyan} strokeWidth={4} strokeDasharray="10 8" />
        <rect x={90} y={65} width={410} height={130} rx={20} fill="rgba(34, 211, 238, 0.1)" stroke={YT_PALETTE.cyan} strokeWidth={2.5} />
        <text x={295} y={112} textAnchor="middle" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={22}>
          VERIFIKASI LOGIKA (BOROS ENERGI)
        </text>
        <text x={295} y={148} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={18}>
          Uji premis, cek data pembanding, tahan ego
        </text>
        <text x={295} y={178} textAnchor="middle" fill={YT_PALETTE.emerald} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
          ➔ KEBENARAN OBJEKTIF &amp; RASIONAL
        </text>
      </g>
    </g>
  );
};

// 4. ANCIENT AGORA: 5th Century BC Athens & The Sophists
const SceneAncientAgora: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g opacity={enter}>
      {/* Classical Greek Temple Pediment & Columns */}
      <g transform="translate(621, 510)">
        {/* Pediment Roof */}
        <polygon
          points="-460,-150 0,-265 460,-150"
          fill="url(#ytMarbleGrad)"
          stroke={YT_PALETTE.gold}
          strokeWidth={3}
        />
        <polygon
          points="-400,-158 0,-242 400,-158"
          fill="rgba(15, 23, 42, 0.85)"
          stroke={YT_PALETTE.gold}
          strokeWidth={1.5}
        />
        <text x={0} y={-180} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Georgia, serif" fontWeight={900} fontSize={24} letterSpacing={4}>
          AGORA ATHENA · ABAD KE-5 SM
        </text>

        {/* Architrave beam */}
        <rect x={-440} y={-150} width={880} height={28} fill="url(#ytMarbleGrad)" />

        {/* 6 Doric Columns */}
        {[-370, -222, -74, 74, 222, 370].map((cx, i) => (
          <g key={i}>
            <rect x={cx - 34} y={-122} width={68} height={18} rx={4} fill="#e2e8f0" />
            <rect x={cx - 26} y={-104} width={52} height={290} fill="url(#ytMarbleGrad)" />
            <line x1={cx - 10} y1={-104} x2={cx - 10} y2={186} stroke="#64748b" strokeWidth={1.5} />
            <line x1={cx + 10} y1={-104} x2={cx + 10} y2={186} stroke="#64748b" strokeWidth={1.5} />
            <rect x={cx - 36} y={186} width={72} height={18} rx={3} fill="#cbd5e1" />
          </g>
        ))}

        {/* Marble Steps */}
        <rect x={-460} y={204} width={920} height={22} fill="#cbd5e1" />
        <rect x={-490} y={226} width={980} height={24} fill="#94a3b8" />

        {/* Central Rhetoric Vs Truth Overlay Card */}
        <rect x={-320} y={-55} width={640} height={200} rx={20} fill="rgba(7, 10, 18, 0.94)" stroke={YT_PALETTE.gold} strokeWidth={3} />
        <text x={0} y={-10} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Georgia, serif" fontWeight={900} fontSize={28}>
          KAUM SOFIS (THE SOPHISTS)
        </text>
        <text x={0} y={32} textAnchor="middle" fill={YT_PALETTE.parchment} fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={20}>
          “Guru Retorika Bayaran di Pengadilan &amp; Parlemen”
        </text>
        <rect x={-260} y={58} width={520} height={58} rx={12} fill="rgba(244, 63, 94, 0.18)" stroke={YT_PALETTE.coral} strokeWidth={1.5} />
        <text x={0} y={94} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={19}>
          TUJUAN: MENANG DEBAT, BUKAN MENCARI KEBENARAN
        </text>
      </g>
    </g>
  );
};

// 5. SOCRATES TRIAL: 399 BC Trial & Hemlock Cup
const SceneSocratesTrial: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});
  const tilt = Math.sin(frame * 0.05) * 4 - 12;

  return (
    <g opacity={enter}>
      {/* Tilted Scales of 500 Athenian Jurors */}
      <g transform="translate(621, 490)">
        {/* Pedestal */}
        <polygon points="-70,250 70,250 25,20 -25,20" fill="url(#ytGoldGrad)" />
        <rect x={-130} y={250} width={260} height={26} rx={8} fill="url(#ytGoldGrad)" />

        {/* Tilted Beam */}
        <g transform={`rotate(${tilt})`}>
          <rect x={-350} y={-10} width={700} height={18} rx={9} fill="url(#ytGoldGrad)" />
          <circle cx={0} cy={0} r={22} fill={YT_PALETTE.goldBright} />

          {/* Left Pan: Rhetoric & Mob Emotion (Heavier) */}
          <line x1={-310} y1={8} x2={-360} y2={120} stroke={YT_PALETTE.gold} strokeWidth={3} />
          <line x1={-310} y1={8} x2={-260} y2={120} stroke={YT_PALETTE.gold} strokeWidth={3} />
          <rect x={-430} y={120} width={240} height={95} rx={16} fill="rgba(244, 63, 94, 0.22)" stroke={YT_PALETTE.coral} strokeWidth={3} />
          <text x={-310} y={160} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={20}>
            FITNAH &amp; EMOSI
          </text>
          <text x={-310} y={190} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={17}>
            Hasutan ke 500 Juri
          </text>

          {/* Right Pan: Socrates' Philosophical Truth */}
          <line x1={310} y1={8} x2={260} y2={120} stroke={YT_PALETTE.gold} strokeWidth={3} />
          <line x1={310} y1={8} x2={360} y2={120} stroke={YT_PALETTE.gold} strokeWidth={3} />
          <rect x={190} y={120} width={240} height={95} rx={16} fill="rgba(34, 211, 238, 0.18)" stroke={YT_PALETTE.cyan} strokeWidth={3} />
          <text x={310} y={160} textAnchor="middle" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={20}>
            LOGIKA SOCRATES
          </text>
          <text x={310} y={190} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={17}>
            Metode Tanya-Jawab
          </text>
        </g>

        {/* Bottom Banner */}
        <rect x={-430} y={300} width={860} height={66} rx={16} fill="rgba(15, 23, 42, 0.94)" stroke={YT_PALETTE.coral} strokeWidth={2} />
        <text x={0} y={341} textAnchor="middle" fill={YT_PALETTE.parchment} fontFamily="Georgia, serif" fontWeight={800} fontSize={22}>
          399 SM · Socrates Dihukum Mati dengan Racun Hemlock Akibat Manipulasi Opini Publik
        </text>
      </g>
    </g>
  );
};

// 6. ARISTOTLE CODEX: Sophistical Refutations (350 BC)
const SceneAristotleCodex: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  const fallaciesLeft = [
    '1. Equivocation (Makna Ganda)',
    '2. Amphiboly (Kalimat Ambigu)',
    '3. Composition (Bagian ➔ Utuh)',
    '4. Division (Utuh ➔ Bagian)',
    '5. Accent (Penekanan Kata)',
    '6. Figure of Speech (Bentuk Kata)',
  ];
  const fallaciesRight = [
    '7. Accident (Kebetulan Semu)',
    '8. Secundum Quid (Generalisasi)',
    '9. Ignoratio Elenchi (Salah Sasaran)',
    '10. Petitio Principii (Penalaran Melingkar)',
    '11. Consequent (Akibat Terbalik)',
    '12. Non Causa Pro Causa (Sebab Palsu)',
    '13. Plurium Interrogationum (Pertanyaan Jebakan)',
  ];

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      {/* Ancient Parchment Scroll */}
      <rect
        x={-500}
        y={-295}
        width={1000}
        height={590}
        rx={22}
        fill="url(#ytParchGrad)"
        stroke="#85581A"
        strokeWidth={5}
      />
      {/* Scroll Wooden Rollers */}
      <rect x={-520} y={-310} width={1040} height={28} rx={14} fill="#5c3a18" stroke={YT_PALETTE.gold} strokeWidth={2} />
      <rect x={-520} y={282} width={1040} height={28} rx={14} fill="#5c3a18" stroke={YT_PALETTE.gold} strokeWidth={2} />

      <text x={0} y={-232} textAnchor="middle" fill="#3b230b" fontFamily="Georgia, serif" fontWeight={900} fontSize={31} letterSpacing={2}>
        ARISTOTELES · DE SOPHISTICI ELENCHIS (350 SM)
      </text>
      <text x={0} y={-194} textAnchor="middle" fill="#6b441e" fontFamily="Inter, Arial, sans-serif" fontWeight={800} fontSize={18} letterSpacing={1}>
        KATALOG 13 SESAT PIKIR PERTAMA DALAM SEJARAH PERADABAN MANUSIA
      </text>
      <line x1={-440} y1={-172} x2={440} y2={-172} stroke="#85581A" strokeWidth={2} />

      {/* Left Column: In Dictione */}
      <rect x={-460} y={-150} width={435} height={395} rx={14} fill="rgba(59, 35, 11, 0.08)" stroke="#85581A" strokeWidth={1.5} />
      <text x={-242} y={-114} textAnchor="middle" fill="#7c2d12" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={19}>
        I. SESAT PIKIR BAHASA (IN DICTIONE)
      </text>
      {fallaciesLeft.map((item, idx) => (
        <text key={idx} x={-435} y={-68 + idx * 46} fill="#291707" fontFamily="Georgia, serif" fontWeight={700} fontSize={19}>
          {item}
        </text>
      ))}

      {/* Right Column: Extra Dictionem */}
      <rect x={25} y={-150} width={435} height={395} rx={14} fill="rgba(59, 35, 11, 0.08)" stroke="#85581A" strokeWidth={1.5} />
      <text x={242} y={-114} textAnchor="middle" fill="#7c2d12" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={19}>
        II. DI LUAR BAHASA (EXTRA DICTIONEM)
      </text>
      {fallaciesRight.map((item, idx) => (
        <text key={idx} x={48} y={-68 + idx * 42} fill="#291707" fontFamily="Georgia, serif" fontWeight={700} fontSize={18.5}>
          {item}
        </text>
      ))}
    </g>
  );
};

// 7. FALLACY AD HOMINEM: Attacking the Person Instead of the Argument
const SceneFallacyAdHominem: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      {/* Left Speaker: Rational Argument */}
      <g transform="translate(-340, 20)">
        <rect x={-175} y={-230} width={350} height={420} rx={22} fill="rgba(34, 211, 238, 0.1)" stroke={YT_PALETTE.cyan} strokeWidth={3} />
        <circle cx={0} cy={-125} r={54} fill="url(#ytCyanGrad)" />
        <text x={0} y={-110} textAnchor="middle" fontSize={44}>
          📊
        </text>
        <text x={0} y={-35} textAnchor="middle" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={22}>
          PEMBICARA A
        </text>
        <rect x={-145} y={-10} width={290} height={160} rx={14} fill="rgba(15, 23, 42, 0.9)" stroke={YT_PALETTE.cyan} strokeWidth={2} />
        <text x={0} y={32} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={19}>
          ARGUMEN &amp; DATA VALID:
        </text>
        <text x={0} y={68} textAnchor="middle" fill={YT_PALETTE.textSecondary} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={17}>
          • Bukti Statistik Terukur
        </text>
        <text x={0} y={98} textAnchor="middle" fill={YT_PALETTE.textSecondary} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={17}>
          • Premis Logis &amp; Teruji
        </text>
        <text x={0} y={128} textAnchor="middle" fill={YT_PALETTE.emerald} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={16}>
          [TIDAK MAMPU DIBANTAH LAWAN]
        </text>
      </g>

      {/* Center Trajectories: Bypassing Data to Hit Person */}
      <g>
        {/* Blocked path to data */}
        <path d="M 155 90 L -155 90" stroke="#64748b" strokeWidth={3} strokeDasharray="8 8" />
        <text x={0} y={122} textAnchor="middle" fill="#94a3b8" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={16}>
          Substansi Argumen Diabaikan ✕
        </text>

        {/* Red Ad Hominem Attack Curve hitting Speaker A directly */}
        <path
          d="M 165 -95 C 50 -250, -50 -250, -165 -115"
          fill="none"
          stroke={YT_PALETTE.coral}
          strokeWidth={7}
        />
        <rect x={-140} y={-255} width={280} height={54} rx={27} fill="url(#ytCoralGrad)" />
        <text x={0} y={-221} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={19}>
          SERANGAN PRIBADI! 🎯
        </text>
      </g>

      {/* Right Speaker: Ad Hominem Attacker */}
      <g transform="translate(340, 20)">
        <rect x={-175} y={-230} width={350} height={420} rx={22} fill="rgba(244, 63, 94, 0.1)" stroke={YT_PALETTE.coral} strokeWidth={3} />
        <circle cx={0} cy={-125} r={54} fill="url(#ytCoralGrad)" />
        <text x={0} y={-110} textAnchor="middle" fontSize={44}>
          🗣️
        </text>
        <text x={0} y={-35} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={22}>
          PELAKU AD HOMINEM
        </text>
        <rect x={-145} y={-10} width={290} height={160} rx={14} fill="rgba(15, 23, 42, 0.9)" stroke={YT_PALETTE.coral} strokeWidth={2} />
        <text x={0} y={32} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={18}>
          SERANG KARAKTERNYA:
        </text>
        <text x={0} y={68} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={17}>
          “Kamu ini lulusan mana?!”
        </text>
        <text x={0} y={98} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={17}>
          “Pasti dibayar pihak sana!”
        </text>
        <text x={0} y={128} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={17}>
          “Anak kemarin sore tahu apa!”
        </text>
      </g>
    </g>
  );
};

// 8. BACKFIRE & AMYGDALA HIJACK: Cognitive Dissonance (Festinger 1957)
const SceneBackfireAmygdala: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});
  const pulse = 1 + Math.sin(frame * 0.14) * 0.12;

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      {/* Brain Cross-Section Container */}
      <circle cx={0} cy={-30} r={210} fill="rgba(15, 23, 42, 0.92)" stroke="rgba(255,255,255,0.2)" strokeWidth={3} />
      {/* Cerebral Cortex Outline */}
      <path
        d="M -150 20 C -175 -95, -90 -185, 15 -180 C 125 -175, 175 -85, 145 25 C 125 90, 50 110, 0 95 C -65 110, -135 80, -150 20 Z"
        fill="rgba(59, 130, 246, 0.16)"
        stroke={YT_PALETTE.cyan}
        strokeWidth={3.5}
      />
      <text x={0} y={-115} textAnchor="middle" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={19}>
        KORTEKS PREFRONTAL (LOGIKA DIMATIKAN)
      </text>

      {/* Glowing Pulsing Amygdala in Center */}
      <g transform={`translate(0, -10) scale(${pulse})`}>
        <circle cx={0} cy={0} r={54} fill="rgba(244, 63, 94, 0.35)" />
        <circle cx={0} cy={0} r={34} fill="url(#ytCoralGrad)" />
        <text x={0} y={7} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={16}>
          AMIGDALA
        </text>
      </g>

      {/* Incoming Fact Arrow vs Ego Shield */}
      <g transform="translate(-390, -15)">
        <rect x={-120} y={-42} width={240} height={84} rx={16} fill="rgba(16, 185, 129, 0.2)" stroke={YT_PALETTE.emerald} strokeWidth={2.5} />
        <text x={0} y={-6} textAnchor="middle" fill={YT_PALETTE.emerald} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={18}>
          FAKTA &amp; DATA BARU
        </text>
        <text x={0} y={22} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={16}>
          Membantah Keyakinan Lama
        </text>
      </g>
      <line x1={-260} y1={-15} x2={-65} y2={-15} stroke={YT_PALETTE.emerald} strokeWidth={4} />

      {/* Right Output: Defensive Rage / Dissonance */}
      <line x1={65} y1={-15} x2={260} y2={-15} stroke={YT_PALETTE.coral} strokeWidth={5} />
      <g transform="translate(390, -15)">
        <rect x={-120} y={-42} width={240} height={84} rx={16} fill="rgba(244, 63, 94, 0.22)" stroke={YT_PALETTE.coral} strokeWidth={2.5} />
        <text x={0} y={-6} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={18}>
          RESPONS ANCAMAN
        </text>
        <text x={0} y={22} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={16}>
          Marah, Menolak &amp; Menyerang
        </text>
      </g>

      {/* Bottom Explanation Banner */}
      <rect x={-460} y={215} width={920} height={68} rx={16} fill="rgba(15, 23, 42, 0.94)" stroke={YT_PALETTE.gold} strokeWidth={2} />
      <text x={0} y={257} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={20}>
        DISONANSI KOGNITIF: OTAK MEMPERLAKUKAN KOREKSI OPINI SEBAGAI SERANGAN FISIK
      </text>
    </g>
  );
};

// 9. STRAWMAN FALLACY: Real Steel Fortress vs Burning Straw Effigy
const SceneFallacyStrawman: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      {/* Left: Strong Real Argument */}
      <g transform="translate(-340, 0)">
        <rect x={-180} y={-240} width={360} height={480} rx={22} fill="rgba(34, 211, 238, 0.1)" stroke={YT_PALETTE.cyan} strokeWidth={3} />
        <rect x={-145} y={-205} width={290} height={46} rx={12} fill="url(#ytCyanGrad)" />
        <text x={0} y={-174} textAnchor="middle" fill="#06101e" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={18}>
          1. ARGUMEN ASLI (KOKOH)
        </text>
        <text x={0} y={-85} textAnchor="middle" fontSize={64}>
          🏰
        </text>
        <text x={0} y={0} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={21}>
          Proporsional &amp; Berdata
        </text>
        <text x={0} y={50} textAnchor="middle" fill={YT_PALETTE.textSecondary} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={18}>
          “Mari evaluasi efektivitas
        </text>
        <text x={0} y={78} textAnchor="middle" fill={YT_PALETTE.textSecondary} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={18}>
          anggaran pendidikan kita.”
        </text>
        <text x={0} y={155} textAnchor="middle" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
          SULIT DIPATAHKAN SECARA JUJUR
        </text>
      </g>

      {/* Center Distortion Arrow */}
      <g>
        <path d="M -140 0 L 140 0" stroke={YT_PALETTE.amber} strokeWidth={6} />
        <circle cx={0} cy={0} r={66} fill="rgba(15, 23, 42, 0.96)" stroke={YT_PALETTE.amber} strokeWidth={3.5} />
        <text x={0} y={-8} textAnchor="middle" fill={YT_PALETTE.amber} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={17}>
          PELINTIR
        </text>
        <text x={0} y={16} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={15}>
          Jadi Ekstrem
        </text>
      </g>

      {/* Right: Burning Strawman */}
      <g transform="translate(340, 0)">
        <rect x={-180} y={-240} width={360} height={480} rx={22} fill="rgba(244, 63, 94, 0.12)" stroke={YT_PALETTE.coral} strokeWidth={3} />
        <rect x={-145} y={-205} width={290} height={46} rx={12} fill="url(#ytCoralGrad)" />
        <text x={0} y={-174} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={18}>
          2. BONEKA JERAMI (PALSU)
        </text>
        <text x={0} y={-85} textAnchor="middle" fontSize={64}>
          🔥
        </text>
        <text x={0} y={0} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={21}>
          Karikatur Konyol Lawan
        </text>
        <text x={0} y={50} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={18}>
          “Oh, jadi kamu benci guru dan
        </text>
        <text x={0} y={78} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={18}>
          ingin anak bangsa bodoh?!”
        </text>
        <text x={0} y={155} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
          MUDAH DISERANG DI DEPAN PUBLIK
        </text>
      </g>
    </g>
  );
};

// 10. BERNAYS PROPAGANDA: 1928 Engineering of Consent
const SceneBernaysPropaganda: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});
  const wave = (frame * 1.5) % 90;

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      {/* Top Master Formula Node */}
      <rect x={-380} y={-275} width={760} height={110} rx={20} fill="rgba(229, 184, 75, 0.14)" stroke={YT_PALETTE.gold} strokeWidth={3} />
      <text x={0} y={-230} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Georgia, serif" fontWeight={900} fontSize={27}>
        EDWARD BERNAYS · “PROPAGANDA” (1928)
      </text>
      <text x={0} y={-192} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={19}>
        Psikoanalisis Bawah Sadar (Sigmund Freud) + Media Massa = Kendali Opini Publik
      </text>

      {/* Broadcast Waves */}
      <circle cx={0} cy={-60} r={40 + wave} fill="none" stroke="rgba(244, 63, 94, 0.35)" strokeWidth={2.5} />
      <circle cx={0} cy={-60} r={80 + wave} fill="none" stroke="rgba(229, 184, 75, 0.25)" strokeWidth={2} />

      {/* Puppeteer Strings to 3 Crowd Drives */}
      {[-310, 0, 310].map((cx, idx) => {
        const titles = ['KETAKUTAN MASSA', 'HASRAT STATUS SOSIAL', 'NALURI KAWANAN'];
        const subs = ['Ciptakan ancaman bersama', 'Simbol gengsi & identitas', 'Semua orang melakukannya'];
        const cols = [YT_PALETTE.coral, YT_PALETTE.gold, YT_PALETTE.cyan];
        return (
          <g key={idx}>
            <line x1={0} y1={-165} x2={cx} y2={45} stroke={cols[idx]} strokeWidth={3} strokeDasharray="8 6" />
            <g transform={`translate(${cx}, 135)`}>
              <rect x={-140} y={-90} width={280} height={180} rx={18} fill="rgba(15, 23, 42, 0.94)" stroke={cols[idx]} strokeWidth={2.5} />
              <text x={0} y={-35} textAnchor="middle" fill={cols[idx]} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={19}>
                {titles[idx]}
              </text>
              <text x={0} y={8} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={17}>
                {subs[idx]}
              </text>
              <text x={0} y={54} textAnchor="middle" fill={YT_PALETTE.textMuted} fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={15}>
                Bawah Sadar Emosional
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};

// 11. ASCH CONFORMITY EXPERIMENT (1951): Target Line vs Lines A, B, C
const SceneAschExperiment: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      {/* Card 1: Target Line */}
      <g transform="translate(-320, -30)">
        <rect x={-170} y={-220} width={340} height={380} rx={20} fill="#f8fafc" stroke={YT_PALETTE.gold} strokeWidth={4} />
        <text x={0} y={-170} textAnchor="middle" fill="#0f172a" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={22}>
          KARTU ACUAN
        </text>
        <line x1={0} y1={-110} x2={0} y2={90} stroke="#0f172a" strokeWidth={12} strokeLinecap="round" />
        <text x={0} y={135} textAnchor="middle" fill="#334155" fontFamily="Inter, Arial, sans-serif" fontWeight={800} fontSize={18}>
          GARIS TARGET (X)
        </text>
      </g>

      {/* Card 2: Comparison Lines A, B, C */}
      <g transform="translate(180, -30)">
        <rect x={-260} y={-220} width={520} height={380} rx={20} fill="#f8fafc" stroke={YT_PALETTE.cyan} strokeWidth={4} />
        <text x={0} y={-170} textAnchor="middle" fill="#0f172a" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={22}>
          KARTU PILIHAN (EKSPERIMEN ASCH 1951)
        </text>

        {/* Line A (Too short, but chosen by actors) */}
        <line x1={-140} y1={-30} x2={-140} y2={90} stroke={YT_PALETTE.coral} strokeWidth={12} strokeLinecap="round" />
        <text x={-140} y={135} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={22}>
          A (SALAH)
        </text>
        <rect x={-225} y={-105} width={170} height={42} rx={10} fill="rgba(244, 63, 94, 0.15)" stroke={YT_PALETTE.coral} strokeWidth={2} />
        <text x={-140} y={-78} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={15}>
          DIPILIH 7 AKTOR!
        </text>

        {/* Line B (Too long) */}
        <line x1={0} y1={-145} x2={0} y2={90} stroke="#64748b" strokeWidth={12} strokeLinecap="round" />
        <text x={0} y={135} textAnchor="middle" fill="#334155" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={22}>
          B
        </text>

        {/* Line C (Exact Match) */}
        <line x1={140} y1={-110} x2={140} y2={90} stroke={YT_PALETTE.emerald} strokeWidth={12} strokeLinecap="round" />
        <text x={140} y={135} textAnchor="middle" fill={YT_PALETTE.emerald} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={22}>
          C (BENAR)
        </text>
      </g>

      {/* Bottom Result Banner */}
      <rect x={-490} y={195} width={980} height={85} rx={18} fill="rgba(244, 63, 94, 0.18)" stroke={YT_PALETTE.coral} strokeWidth={2.5} />
      <text x={0} y={232} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={22}>
        HASIL: 75% MANUSIA NORMAL IKUT MENJAWAB “A” YANG JELAS SALAH
      </text>
      <text x={0} y={264} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={18}>
        Bandwagon Fallacy bekerja karena rasa takut dikucilkan kelompok mengalahkan penglihatan mata
      </text>
    </g>
  );
};

// 12. FALSE DILEMMA: Black/White Polarization vs Hidden Nuance Spectrum
const SceneFalseDilemma: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      {/* Top Trap Warning */}
      <text x={0} y={-245} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={24} letterSpacing={1.5}>
        ILUSI DUA KUBU EKSTREM (FALSE DILEMMA / HITAM-PUTIH)
      </text>

      {/* Extreme Left Box */}
      <rect x={-500} y={-195} width={310} height={220} rx={20} fill="rgba(244, 63, 94, 0.16)" stroke={YT_PALETTE.coral} strokeWidth={3} />
      <text x={-345} y={-110} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={24}>
        KUBU MUTLAK A
      </text>
      <text x={-345} y={-65} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={18}>
        “Ikut Kami 100%”
      </text>
      <text x={-345} y={-25} textAnchor="middle" fill={YT_PALETTE.textMuted} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={16}>
        Tanpa Kritik Sedikit Pun
      </text>

      {/* VS Badge */}
      <circle cx={0} cy={-85} r={45} fill="rgba(15,23,42,0.95)" stroke={YT_PALETTE.gold} strokeWidth={3} />
      <text x={0} y={-76} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={24}>
        ATAU
      </text>

      {/* Extreme Right Box */}
      <rect x={190} y={-195} width={310} height={220} rx={20} fill="rgba(244, 63, 94, 0.16)" stroke={YT_PALETTE.coral} strokeWidth={3} />
      <text x={345} y={-110} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={24}>
        KUBU MUSUH B
      </text>
      <text x={345} y={-65} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={18}>
        “Berarti Kamu Musuh!”
      </text>
      <text x={345} y={-25} textAnchor="middle" fill={YT_PALETTE.textMuted} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={16}>
        Ancaman &amp; Ketakutan
      </text>

      {/* Bottom Revealed Nuance Spectrum */}
      <rect x={-500} y={75} width={1000} height={195} rx={22} fill="rgba(34, 211, 238, 0.1)" stroke={YT_PALETTE.cyan} strokeWidth={3} />
      <text x={0} y={120} textAnchor="middle" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={21}>
        REALITAS YANG DISEMBUNYIKAN: SPEKTRUM SOLUSI RASIONAL (C, D, E, F)
      </text>
      {['Opsi C: Jalan Tengah', 'Opsi D: Revisi Data', 'Opsi E: Kolaborasi', 'Opsi F: Inovasi Baru'].map((opt, i) => (
        <g key={i} transform={`translate(${-360 + i * 240}, 195)`}>
          <rect x={-105} y={-32} width={210} height={64} rx={14} fill="rgba(16, 185, 129, 0.2)" stroke={YT_PALETTE.emerald} strokeWidth={2} />
          <text x={0} y={7} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
            {opt}
          </text>
        </g>
      ))}
    </g>
  );
};

// 13. WALD SURVIVORSHIP BIAS: WW2 Bomber Bullet Map (1943)
const SceneWaldSurvivorship: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});
  const pulse = 1 + Math.sin(frame * 0.12) * 0.08;

  // Bullet coordinates on wings & fuselage (NOT on cockpit or engines)
  const bulletHits = [
    [-260, -10], [-220, 15], [-190, -20], [-150, 10], [150, -15], [195, 18], [235, -8], [275, 12],
    [-25, -45], [22, -35], [-15, 45], [25, 65], [-10, 110], [15, 135], [-55, 195], [55, 195],
  ];

  return (
    <g transform={`translate(621, 540) scale(${enter})`}>
      {/* Blueprint Grid Box */}
      <rect x={-500} y={-285} width={1000} height={590} rx={22} fill="rgba(10, 25, 54, 0.9)" stroke={YT_PALETTE.cyan} strokeWidth={2.5} />
      <text x={-460} y={-238} fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={19} letterSpacing={1.5}>
        BLUEPRINT STATISTICAL RESEARCH GROUP · ABRAHAM WALD (1943)
      </text>

      {/* Top-Down Twin-Engine WWII Bomber Silhouette */}
      <g transform="translate(0, -15)">
        {/* Main Wings */}
        <polygon
          points="-360,-25 -50,-45 50,-45 360,-25 360,35 50,55 -50,55 -360,35"
          fill="#1e293b"
          stroke={YT_PALETTE.cyan}
          strokeWidth={3}
        />
        {/* Fuselage */}
        <path
          d="M -38 -190 C -38 -230, 38 -230, 38 -190 L 32 210 L -32 210 Z"
          fill="#334155"
          stroke={YT_PALETTE.cyan}
          strokeWidth={3}
        />
        {/* Tail Stabilizers */}
        <polygon
          points="-135,175 135,175 150,215 -150,215"
          fill="#1e293b"
          stroke={YT_PALETTE.cyan}
          strokeWidth={3}
        />

        {/* CRITICAL ZONES (Clean of bullets -> Must be armored!): Cockpit & 2 Engines */}
        <g transform={`scale(${pulse})`}>
          {/* Cockpit */}
          <circle cx={0} cy={-150} r={34} fill="rgba(34, 211, 238, 0.3)" stroke={YT_PALETTE.cyan} strokeWidth={3.5} />
          {/* Left Engine */}
          <circle cx={-105} cy={-5} r={38} fill="rgba(34, 211, 238, 0.3)" stroke={YT_PALETTE.cyan} strokeWidth={3.5} />
          {/* Right Engine */}
          <circle cx={105} cy={-5} r={38} fill="rgba(34, 211, 238, 0.3)" stroke={YT_PALETTE.cyan} strokeWidth={3.5} />
        </g>

        {/* Red Bullet Holes on Returning Planes */}
        {bulletHits.map(([bx, by], idx) => (
          <circle key={idx} cx={bx} cy={by} r={9} fill={YT_PALETTE.coral} stroke="#ffffff" strokeWidth={2} />
        ))}
      </g>

      {/* Legend Callouts */}
      <g transform="translate(-260, 245)">
        <circle cx={-180} cy={0} r={10} fill={YT_PALETTE.coral} />
        <text x={-155} y={6} fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={17}>
          Merah: Tertembak tapi Pesawat Selamat Pulang
        </text>
      </g>
      <g transform="translate(230, 245)">
        <circle cx={-185} cy={0} r={10} fill={YT_PALETTE.cyan} />
        <text x={-160} y={6} fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
          Biru: Area Fatal (Tertembak = Jatuh di Laut)
        </text>
      </g>
    </g>
  );
};

// 14. MODERN SURVIVORSHIP BIAS: The Iceberg of Silent Evidence
const SceneModernSurvivorship: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      {/* Waterline */}
      <line x1={-510} y1={-60} x2={510} y2={-60} stroke={YT_PALETTE.cyan} strokeWidth={4} strokeDasharray="12 8" />
      <text x={-485} y={-78} fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={17}>
        PERMUKAAN MEDIA &amp; PANGGUNG MOTIVASI (YANG TERLIHAT)
      </text>

      {/* Tip of Iceberg: 0.01% Winners */}
      <polygon
        points="-140,-60 0,-255 140,-60"
        fill="url(#ytGoldGrad)"
        stroke="#ffffff"
        strokeWidth={3}
      />
      <text x={0} y={-135} textAnchor="middle" fill="#090d16" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={24}>
        0,01%
      </text>
      <text x={0} y={-95} textAnchor="middle" fill="#090d16" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={17}>
        SUKSES VIRAL
      </text>

      {/* Submerged Massive Iceberg: 99.99% Silent Failures */}
      <polygon
        points="-140,-56 140,-56 380,275 -380,275"
        fill="rgba(244, 63, 94, 0.18)"
        stroke={YT_PALETTE.coral}
        strokeWidth={3}
      />
      <text x={0} y={45} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={48}>
        99,99% BUKTI BISU
      </text>
      <text x={0} y={95} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={22}>
        Ratusan Ribu Orang dengan Langkah Serupa Namun Gagal &amp; Bangkrut
      </text>
      <text x={0} y={140} textAnchor="middle" fill={YT_PALETTE.textSecondary} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={19}>
        “Orang yang gagal tidak pernah diundang berbicara di podcast atau menulis buku”
      </text>
      <text x={0} y={215} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={18}>
        JANGAN MENIRU RESEP TANPA MELIHAT KUBURAN DATA YANG GAGAL
      </text>
    </g>
  );
};

// 15. SUNK COST & PROSPECT THEORY: Kahneman & Tversky (1979) Loss Aversion Curve
const SceneSunkCostProspect: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      {/* Graph Frame */}
      <rect x={-500} y={-285} width={1000} height={570} rx={22} fill="rgba(12, 19, 36, 0.92)" stroke="rgba(255,255,255,0.16)" strokeWidth={2} />

      {/* Axes */}
      <line x1={-420} y1={-20} x2={420} y2={-20} stroke="#94a3b8" strokeWidth={2.5} />
      <line x1={0} y1={-240} x2={0} y2={245} stroke="#94a3b8" strokeWidth={2.5} />

      {/* Axis Labels */}
      <text x={395} y={-36} textAnchor="end" fill={YT_PALETTE.emerald} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
        KEUNTUNGAN (+Rp100rb)
      </text>
      <text x={-395} y={18} textAnchor="start" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
        KERUGIAN (-Rp100rb)
      </text>
      <text x={16} y={-215} fill={YT_PALETTE.emerald} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
        + BAHAGIA (1x)
      </text>
      <text x={16} y={230} fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
        - RASA SAKIT PSIKOLOGIS (2,25x!)
      </text>

      {/* Gain Curve (Upper Right - Shallow) */}
      <path
        d="M 0 -20 Q 140 -115, 360 -130"
        fill="none"
        stroke={YT_PALETTE.emerald}
        strokeWidth={6}
      />
      <circle cx={260} cy={-120} r={10} fill={YT_PALETTE.emerald} />

      {/* Loss Curve (Lower Left - Steep 2.25x Drop!) */}
      <path
        d="M 0 -20 Q -120 155, -280 230"
        fill="none"
        stroke={YT_PALETTE.coral}
        strokeWidth={7}
      />
      <circle cx={-260} cy={218} r={12} fill={YT_PALETTE.coral} />

      {/* Callout Box for Sunk Cost Trap */}
      <rect x={60} y={40} width={395} height={175} rx={18} fill="rgba(244, 63, 94, 0.14)" stroke={YT_PALETTE.coral} strokeWidth={2.5} />
      <text x={257} y={82} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={20}>
        JEBAKAN SUNK COST FALLACY
      </text>
      <text x={257} y={118} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={17}>
        Demi menghindari rasa sakit mengakui
      </text>
      <text x={257} y={145} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={17}>
        kerugian masa lalu, kita justru terus
      </text>
      <text x={257} y={172} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
        menambah modal ke hal yang gagal!
      </text>
    </g>
  );
};

// 16. CONFIRMATION BIAS & ECHO CHAMBER
const SceneConfirmationChamber: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      {/* Incoming Mixed Facts on Left */}
      <g transform="translate(-390, 0)">
        <text x={0} y={-215} textAnchor="middle" fill={YT_PALETTE.textSecondary} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={18}>
          REALITAS OBJEKTIF
        </text>
        {[-140, -70, 0, 70, 140].map((y, idx) => {
          const isMatch = idx === 2;
          return (
            <g key={idx} transform={`translate(0, ${y})`}>
              <rect
                x={-110}
                y={-22}
                width={220}
                height={44}
                rx={10}
                fill={isMatch ? 'rgba(229, 184, 75, 0.25)' : 'rgba(34, 211, 238, 0.14)'}
                stroke={isMatch ? YT_PALETTE.gold : YT_PALETTE.cyan}
                strokeWidth={2}
              />
              <text
                x={0}
                y={6}
                textAnchor="middle"
                fill={isMatch ? YT_PALETTE.gold : YT_PALETTE.cyan}
                fontFamily="Inter, Arial Black, sans-serif"
                fontWeight={800}
                fontSize={15}
              >
                {isMatch ? '✓ 1 Opini Cocok' : `✕ Fakta Berbeda #${idx + 1}`}
              </text>
            </g>
          );
        })}
      </g>

      {/* Center Filter Gate: Confirmation Bias + Algorithm */}
      <rect x={-95} y={-230} width={190} height={460} rx={24} fill="rgba(244, 63, 94, 0.16)" stroke={YT_PALETTE.coral} strokeWidth={3.5} />
      <text x={0} y={-165} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={18}>
        FILTER BIAS
      </text>
      <text x={0} y={-138} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={15}>
        &amp; ALGORITMA
      </text>
      <circle cx={0} cy={0} r={44} fill="url(#ytGoldGrad)" />
      <text x={0} y={10} textAnchor="middle" fontSize={32}>
        🧲
      </text>
      <text x={0} y={150} textAnchor="middle" fill={YT_PALETTE.textSecondary} fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={15}>
        99% Fakta Lain
      </text>
      <text x={0} y={175} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={16}>
        DITOLAK OTAK
      </text>

      {/* Right: Echo Chamber Bubble */}
      <g transform="translate(320, 0)">
        <circle cx={0} cy={0} r={185} fill="rgba(229, 184, 75, 0.12)" stroke={YT_PALETTE.gold} strokeWidth={4} strokeDasharray="12 8" />
        <text x={0} y={-75} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={22}>
          RUANG GEMA
        </text>
        <text x={0} y={-44} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={17}>
          (ECHO CHAMBER)
        </text>
        <text x={0} y={15} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={18}>
          “Semua yang kulihat
        </text>
        <text x={0} y={42} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={18}>
          membenarkan pendapatku!”
        </text>
      </g>
    </g>
  );
};

// 17. DUNNING-KRUGER EFFECT CURVE (1999)
const SceneDunningKruger: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      <rect x={-500} y={-285} width={1000} height={570} rx={22} fill="rgba(12, 19, 36, 0.92)" stroke="rgba(255,255,255,0.16)" strokeWidth={2} />

      {/* Axes */}
      <line x1={-390} y1={190} x2={430} y2={190} stroke="#94a3b8" strokeWidth={3} />
      <line x1={-390} y1={-220} x2={-390} y2={190} stroke="#94a3b8" strokeWidth={3} />

      <text x={-370} y={-205} fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={18}>
        KEPERCAYAAN DIRI (CONFIDENCE) ▲
      </text>
      <text x={420} y={232} textAnchor="end" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={18}>
        KOMPETENSI &amp; ILMU NYATA (KNOWLEDGE) ►
      </text>

      {/* Dunning-Kruger Curve Path */}
      <path
        d="M -385 180 C -340 -210, -245 -220, -210 -150 C -150 -20, -110 155, -35 150 C 90 140, 220 -20, 385 -65"
        fill="none"
        stroke="url(#ytGoldGrad)"
        strokeWidth={7}
      />

      {/* Peak 1: Mount Stupid */}
      <circle cx={-260} cy={-172} r={14} fill={YT_PALETTE.coral} stroke="#ffffff" strokeWidth={3} />
      <rect x={-370} y={-255} width={275} height={60} rx={12} fill="rgba(244, 63, 94, 0.22)" stroke={YT_PALETTE.coral} strokeWidth={2} />
      <text x={-232} y={-228} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={16}>
        GUNUNG KEBODOHAN
      </text>
      <text x={-232} y={-206} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={14}>
        Tahu Sedikit · Pede Maksimal
      </text>

      {/* Valley of Despair */}
      <circle cx={-45} cy={148} r={12} fill={YT_PALETTE.amber} stroke="#ffffff" strokeWidth={3} />
      <text x={-45} y={115} textAnchor="middle" fill={YT_PALETTE.amber} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={16}>
        LEMBAH KESADARAN
      </text>

      {/* Plateau of Sustainability (True Expert) */}
      <circle cx={385} cy={-65} r={14} fill={YT_PALETTE.cyan} stroke="#ffffff" strokeWidth={3} />
      <rect x={145} y={-155} width={285} height={64} rx={12} fill="rgba(34, 211, 238, 0.18)" stroke={YT_PALETTE.cyan} strokeWidth={2} />
      <text x={287} y={-126} textAnchor="middle" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={16}>
        DATARAN AHLI SEJATI
      </text>
      <text x={287} y={-102} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={14}>
        Kompeten · Cermat &amp; Rendah Hati
      </text>
    </g>
  );
};

// 18. STEELMAN METHOD: Antidote to Strawman
const SceneSteelmanMethod: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      {/* Left: Strawman (Rejected) */}
      <g transform="translate(-260, 0)">
        <rect x={-215} y={-235} width={430} height={470} rx={22} fill="rgba(244, 63, 94, 0.08)" stroke="rgba(244, 63, 94, 0.45)" strokeWidth={2.5} />
        <text x={0} y={-175} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={23}>
          ❌ STRAWMAN (CARA RENDAH)
        </text>
        <text x={0} y={-95} textAnchor="middle" fontSize={58}>
          🤡
        </text>
        <text x={0} y={-15} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={19}>
          Memelintir argumen lawan jadi
        </text>
        <text x={0} y={15} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={19}>
          versi paling bodoh &amp; ekstrem
        </text>
        <text x={0} y={115} textAnchor="middle" fill={YT_PALETTE.coral} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={18}>
          Tujuan: Menang Ego di Depan Penonton
        </text>
      </g>

      {/* Right: Steelman (Elevated) */}
      <g transform="translate(260, 0)">
        <rect x={-215} y={-235} width={430} height={470} rx={22} fill="rgba(16, 185, 129, 0.12)" stroke={YT_PALETTE.emerald} strokeWidth={3.5} />
        <text x={0} y={-175} textAnchor="middle" fill={YT_PALETTE.emerald} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={23}>
          ✓ STEELMAN (STANDAR EMAS)
        </text>
        <text x={0} y={-95} textAnchor="middle" fontSize={58}>
          🛡️
        </text>
        <text x={0} y={-15} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={19}>
          Merumuskan argumen lawan dalam
        </text>
        <text x={0} y={15} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={19}>
          versi TERKUAT &amp; PALING ADIL
        </text>
        <text x={0} y={115} textAnchor="middle" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={800} fontSize={18}>
          Tujuan: Menguji Kebenaran Secara Jujur
        </text>
      </g>
    </g>
  );
};

// 19. THREE MENTAL SHIELDS: Practical Critical Thinking Filters
const SceneThreeMentalShields: React.FC<{frame: number; fps: number}> = ({frame, fps}) => {
  const shields = [
    {
      num: 'PERISAI 01',
      title: 'PISAHKAN PESAN & PEMBAWA',
      desc: 'Fokus pada bukti & premis, kebal terhadap Ad Hominem maupun karisma palsu',
      col: YT_PALETTE.gold,
    },
    {
      num: 'PERISAI 02',
      title: 'CARI DATA YANG BISU',
      desc: 'Selalu tanyakan siapa yang gagal namun tidak terlihat (Lawan Survivorship Bias)',
      col: YT_PALETTE.cyan,
    },
    {
      num: 'PERISAI 03',
      title: 'BERANI BERHENTI RUGI',
      desc: 'Ambil keputusan demi masa depan, bukan terjebak biaya masa lalu (Putus Sunk Cost)',
      col: YT_PALETTE.emerald,
    },
  ];

  return (
    <g transform="translate(621, 550)">
      {shields.map((s, idx) => {
        const pop = spring({frame: frame - idx * 8, fps, config: {damping: 14}});
        const xPos = -345 + idx * 345;
        return (
          <g key={idx} transform={`translate(${xPos}, 0) scale(${pop})`}>
            <rect
              x={-155}
              y={-250}
              width={310}
              height={500}
              rx={22}
              fill="rgba(15, 23, 42, 0.94)"
              stroke={s.col}
              strokeWidth={3}
            />
            <rect x={-110} y={-215} width={220} height={42} rx={21} fill={s.col} />
            <text x={0} y={-187} textAnchor="middle" fill="#06101e" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={17} letterSpacing={1}>
              {s.num}
            </text>
            <circle cx={0} cy={-90} r={48} fill="rgba(255,255,255,0.06)" stroke={s.col} strokeWidth={2.5} />
            <text x={0} y={-75} textAnchor="middle" fontSize={40}>
              {idx === 0 ? '⚖️' : idx === 1 ? '🔭' : '✂️'}
            </text>
            {wrapText(s.title, 18).map((ln, lIdx) => (
              <text key={lIdx} x={0} y={0 + lIdx * 28} textAnchor="middle" fill={s.col} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={21}>
                {ln}
              </text>
            ))}
            {wrapText(s.desc, 26).map((ln, lIdx) => (
              <text key={lIdx} x={0} y={82 + lIdx * 26} textAnchor="middle" fill={YT_PALETTE.textSecondary} fontFamily="Inter, Arial, sans-serif" fontWeight={600} fontSize={17}>
                {ln}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
};

// 20. EPILOGUE OUTRO: Socrates & YouTube Call to Action
const SceneEpilogueOutro: React.FC<{frame: number; fps: number; watermark: string}> = ({
  frame,
  fps,
  watermark,
}) => {
  const enter = spring({frame, fps, config: {damping: 14}});

  return (
    <g transform={`translate(621, 550) scale(${enter})`}>
      <rect
        x={-480}
        y={-265}
        width={960}
        height={530}
        rx={28}
        fill="rgba(15, 23, 42, 0.94)"
        stroke={YT_PALETTE.gold}
        strokeWidth={3.5}
      />
      <text
        x={0}
        y={-190}
        textAnchor="middle"
        fill={YT_PALETTE.gold}
        fontFamily="Inter, Arial Black, sans-serif"
        fontWeight={900}
        fontSize={19}
        letterSpacing={3}
      >
        2.400 TAHUN PERJALANAN AKAL SEHAT MANUSIA
      </text>
      <text
        x={0}
        y={-115}
        textAnchor="middle"
        fill={YT_PALETTE.parchment}
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fontWeight={800}
        fontSize={31}
      >
        “Aku tahu bahwa aku belum mengetahui apa-apa.”
      </text>
      <text
        x={0}
        y={-72}
        textAnchor="middle"
        fill={YT_PALETTE.gold}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight={800}
        fontSize={18}
        letterSpacing={1.5}
      >
        — SOCRATES (470–399 SM) · KERENDAHAN HATI INTELEKTUAL
      </text>

      <line x1={-380} y1={-35} x2={380} y2={-35} stroke="rgba(255,255,255,0.15)" strokeWidth={2} />

      {/* YouTube Action Buttons */}
      <g transform="translate(0, 65)">
        <rect x={-390} y={-42} width={240} height={76} rx={38} fill="#ef4444" />
        <text x={-270} y={6} textAnchor="middle" fill="#ffffff" fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={21}>
          ▶ SUBSCRIBE
        </text>

        <rect x={-120} y={-42} width={240} height={76} rx={38} fill="rgba(34, 211, 238, 0.18)" stroke={YT_PALETTE.cyan} strokeWidth={2.5} />
        <text x={0} y={6} textAnchor="middle" fill={YT_PALETTE.cyan} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={21}>
          👍 LIKE &amp; BAGIKAN
        </text>

        <rect x={150} y={-42} width={240} height={76} rx={38} fill="rgba(229, 184, 75, 0.18)" stroke={YT_PALETTE.gold} strokeWidth={2.5} />
        <text x={270} y={6} textAnchor="middle" fill={YT_PALETTE.gold} fontFamily="Inter, Arial Black, sans-serif" fontWeight={900} fontSize={21}>
          💬 DISKUSI
        </text>
      </g>

      <text
        x={0}
        y={195}
        textAnchor="middle"
        fill={YT_PALETTE.textSecondary}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight={700}
        fontSize={20}
      >
        Karya Dokumenter Visual {watermark} · Psikologi, Sejarah &amp; Berpikir Kritis
      </text>
    </g>
  );
};

// ============================================================================
// Main Story Renderer: YoutubePsychStory
// ============================================================================
export const YoutubePsychStory: React.FC<{
  words: YtWord[];
  scenes: YtScene[];
  chapters: YtChapter[];
  title?: string;
  watermark?: string;
  channelName?: string;
  keywords?: string[];
  accent?: string;
}> = ({
  words,
  scenes,
  chapters,
  watermark = DEFAULT_HANDLE,
  channelName = 'LOGIKA & PIKIRAN',
  keywords = [],
  accent = YT_PALETTE.gold,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  const kwSet = useMemo(() => new Set(keywords.map(clean)), [keywords]);

  // Compute scene start timestamps from cue words (monotonically increasing)
  const sceneStartsMs = useMemo(() => {
    const starts: number[] = [];
    let searchFromIdx = 0;

    for (let i = 0; i < scenes.length; i++) {
      const cue = scenes[i].cue;
      if (i === 0 || !cue) {
        starts.push(0);
        continue;
      }
      const target = clean(cue);
      let foundMs = -1;
      for (let w = searchFromIdx; w < words.length; w++) {
        if (clean(words[w].text) === target) {
          foundMs = words[w].fromMs;
          searchFromIdx = w + 1;
          break;
        }
      }
      if (foundMs < 0) {
        foundMs = ((i / scenes.length) * (durationInFrames / fps)) * 1000;
      }
      starts.push(foundMs);
    }
    return starts;
  }, [scenes, words, durationInFrames, fps]);

  // Determine current active scene index
  let activeSceneIdx = 0;
  for (let i = 0; i < sceneStartsMs.length; i++) {
    if (nowMs >= sceneStartsMs[i]) {
      activeSceneIdx = i;
    } else {
      break;
    }
  }

  const curScene = scenes[activeSceneIdx] ?? scenes[0] ?? {kind: 'prolog_hook', cue: null};
  const sceneStartFrame = Math.round(((sceneStartsMs[activeSceneIdx] ?? 0) / 1000) * fps);
  const localFrame = Math.max(0, frame - sceneStartFrame);
  const activeChapterIdx = curScene.chapterIndex ?? 0;

  // Group words into widescreen broadcast subtitle pages (9 words per page)
  const subtitlePages = useMemo(() => {
    const pages: {words: YtWord[]; startMs: number; endMs: number}[] = [];
    const CHUNK = 9;
    for (let i = 0; i < words.length; i += CHUNK) {
      const slice = words.slice(i, i + CHUNK);
      if (slice.length) {
        pages.push({
          words: slice,
          startMs: slice[0].fromMs,
          endMs: slice[slice.length - 1].toMs,
        });
      }
    }
    for (let p = 0; p < pages.length - 1; p++) {
      if (pages[p + 1].startMs - pages[p].endMs < 600) {
        pages[p].endMs = pages[p + 1].startMs;
      }
    }
    return pages;
  }, [words]);

  const activePage = subtitlePages.find(
    (p) => nowMs >= p.startMs - 80 && nowMs <= p.endMs + 220,
  );

  const progressPct = Math.min(100, (frame / Math.max(1, durationInFrames - 1)) * 100);
  const currentSec = frame / fps;
  const totalSec = durationInFrames / fps;

  // Chapter transition bumper (shows during first 50 frames of a new chapter)
  const showChapterBumper = Boolean(curScene.isChapterStart && localFrame < 54);
  const bumperOpacity = showChapterBumper
    ? interpolate(localFrame, [0, 8, 42, 54], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <AbsoluteFill style={{background: YT_PALETTE.bgDeep, overflow: 'hidden'}}>
      {/* Main Widescreen SVG Stage */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <YtDefs />
        <DocumentaryBackdrop frame={frame} chapterIdx={activeChapterIdx} />

        {/* Active Left Stage Visual Scene */}
        {curScene.kind === 'prolog_hook' && <ScenePrologHook frame={localFrame} fps={fps} />}
        {curScene.kind === 'dual_system_brain' && (
          <SceneDualSystemBrain frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'cognitive_miser' && (
          <SceneCognitiveMiser frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'ancient_agora' && (
          <SceneAncientAgora frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'socrates_trial' && (
          <SceneSocratesTrial frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'aristotle_codex' && (
          <SceneAristotleCodex frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'fallacy_adhominem' && (
          <SceneFallacyAdHominem frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'backfire_amygdala' && (
          <SceneBackfireAmygdala frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'fallacy_strawman' && (
          <SceneFallacyStrawman frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'bernays_propaganda' && (
          <SceneBernaysPropaganda frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'asch_experiment' && (
          <SceneAschExperiment frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'false_dilemma' && (
          <SceneFalseDilemma frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'wald_survivorship' && (
          <SceneWaldSurvivorship frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'modern_survivorship' && (
          <SceneModernSurvivorship frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'sunk_cost_prospect' && (
          <SceneSunkCostProspect frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'confirmation_chamber' && (
          <SceneConfirmationChamber frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'dunning_kruger' && (
          <SceneDunningKruger frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'steelman_method' && (
          <SceneSteelmanMethod frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'three_mental_shields' && (
          <SceneThreeMentalShields frame={localFrame} fps={fps} />
        )}
        {curScene.kind === 'epilogue_outro' && (
          <SceneEpilogueOutro frame={localFrame} fps={fps} watermark={watermark} />
        )}

        {/* Right-Side Dossier & Research Notes Panel */}
        <DossierPanel scene={curScene} localFrame={localFrame} fps={fps} />
      </svg>

      {/* ==================================================================== */}
      {/* TOP CHAPTER TIMELINE BAR (YouTube Documentary HUD)                   */}
      {/* ==================================================================== */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: W,
          height: 82,
          background: 'rgba(6, 9, 17, 0.92)',
          borderBottom: '1.5px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 56px',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Progress Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 5,
            background: 'rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #e5b84b, #22d3ee, #10b981)',
              boxShadow: '0 0 12px #e5b84b',
            }}
          />
        </div>

        {/* Chapters Pills */}
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          {chapters.map((ch, idx) => {
            const isActive = idx === activeChapterIdx;
            const isDone = idx < activeChapterIdx;
            return (
              <div
                key={idx}
                style={{
                  padding: isActive ? '8px 16px' : '7px 12px',
                  borderRadius: 999,
                  background: isActive
                    ? 'rgba(229, 184, 75, 0.2)'
                    : isDone
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isActive
                    ? `2px solid ${accent}`
                    : isDone
                    ? '1.5px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Inter, Arial Black, sans-serif',
                    fontWeight: 900,
                    fontSize: 13,
                    color: isActive ? accent : isDone ? '#10b981' : '#64748b',
                    letterSpacing: 0.8,
                  }}
                >
                  {ch.number}
                </span>
                {isActive && (
                  <span
                    style={{
                      fontFamily: 'Inter, Arial, sans-serif',
                      fontWeight: 800,
                      fontSize: 14,
                      color: '#ffffff',
                    }}
                  >
                    {ch.title}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Brand & Timecode */}
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div
            style={{
              padding: '7px 16px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.16)',
              fontFamily: 'Inter, Arial Black, sans-serif',
              fontWeight: 800,
              fontSize: 14,
              color: YT_PALETTE.textSecondary,
              letterSpacing: 1,
            }}
          >
            {channelName} · {watermark}
          </div>
          <div
            style={{
              padding: '7px 14px',
              borderRadius: 10,
              background: 'rgba(229, 184, 75, 0.14)',
              border: `1.5px solid ${ YT_PALETTE.borderGold }`,
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: 16,
              color: YT_PALETTE.gold,
            }}
          >
            {formatTimecode(currentSec)} / {formatTimecode(totalSec)}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SCENE TITLE & HISTORICAL ERA BANNER (y: 96..204)                     */}
      {/* ==================================================================== */}
      <div
        style={{
          position: 'absolute',
          top: 96,
          left: 56,
          right: 56,
          height: 106,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 6,
              background: 'rgba(229, 184, 75, 0.18)',
              border: `1.5px solid ${YT_PALETTE.gold}`,
              fontFamily: 'Inter, Arial Black, sans-serif',
              fontWeight: 900,
              fontSize: 14,
              color: YT_PALETTE.gold,
              letterSpacing: 1.8,
              marginBottom: 8,
            }}
          >
            {curScene.era ?? 'DOKUMENTER PSIKOLOGI & SEJARAH'}
          </div>
          <div
            style={{
              fontFamily: 'Inter, Arial Black, sans-serif',
              fontWeight: 900,
              fontSize: 36,
              color: '#ffffff',
              letterSpacing: -0.5,
              lineHeight: 1.1,
            }}
          >
            {curScene.label}
          </div>
          {curScene.sub && (
            <div
              style={{
                fontFamily: 'Inter, Arial, sans-serif',
                fontWeight: 600,
                fontSize: 19,
                color: YT_PALETTE.textSecondary,
                marginTop: 4,
              }}
            >
              {curScene.sub}
            </div>
          )}
        </div>

        {/* Scene Counter Pill */}
        <div
          style={{
            padding: '12px 22px',
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            textAlign: 'right',
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, Arial Black, sans-serif',
              fontWeight: 900,
              fontSize: 13,
              color: YT_PALETTE.cyan,
              letterSpacing: 1.5,
            }}
          >
            SEGMEN VISUAL
          </div>
          <div
            style={{
              fontFamily: 'Inter, Arial Black, sans-serif',
              fontWeight: 900,
              fontSize: 24,
              color: '#ffffff',
            }}
          >
            {String(activeSceneIdx + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* CHAPTER TRANSITION BUMPER TOAST                                      */}
      {/* ==================================================================== */}
      {showChapterBumper && chapters[activeChapterIdx] && (
        <div
          style={{
            position: 'absolute',
            top: 235,
            left: 80,
            opacity: bumperOpacity,
            padding: '14px 28px',
            borderRadius: 16,
            background: 'linear-gradient(90deg, rgba(229,184,75,0.95), rgba(180,123,24,0.95))',
            boxShadow: '0 12px 32px rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              background: '#090d16',
              color: YT_PALETTE.gold,
              fontFamily: 'Inter, Arial Black, sans-serif',
              fontWeight: 900,
              fontSize: 15,
              letterSpacing: 1.2,
            }}
          >
            {chapters[activeChapterIdx].number}
          </span>
          <span
            style={{
              fontFamily: 'Inter, Arial Black, sans-serif',
              fontWeight: 900,
              fontSize: 20,
              color: '#090d16',
            }}
          >
            {chapters[activeChapterIdx].title.toUpperCase()}
          </span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* WIDESCREEN BROADCAST LOWER-THIRD SUBTITLES (y: 902..1055)            */}
      {/* ==================================================================== */}
      {activePage && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            width: W,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              maxWidth: 1560,
              padding: '16px 36px',
              borderRadius: 20,
              background: 'rgba(6, 10, 20, 0.92)',
              border: '2px solid rgba(229, 184, 75, 0.35)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px 12px',
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
                    padding: isSpoken ? '4px 12px' : '2px 5px',
                    borderRadius: 10,
                    background: isSpoken
                      ? isKw
                        ? 'rgba(229, 184, 75, 0.25)'
                        : 'rgba(34, 211, 238, 0.22)'
                      : 'transparent',
                    border: isSpoken
                      ? `1.5px solid ${isKw ? YT_PALETTE.goldBright : YT_PALETTE.cyan}`
                      : '1.5px solid transparent',
                    fontFamily: 'Inter, Arial Black, sans-serif',
                    fontWeight: 800,
                    fontSize: 30,
                    lineHeight: 1.2,
                    color: isSpoken
                      ? isKw
                        ? YT_PALETTE.goldBright
                        : YT_PALETTE.cyan
                      : isKw
                      ? YT_PALETTE.gold
                      : isPast
                      ? '#ffffff'
                      : 'rgba(255, 255, 255, 0.62)',
                  }}
                >
                  {w.text}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ============================================================================
// STANDALONE "YoutubeLong" 16:9 COMPOSITION (1920x1080)
// ============================================================================
const tokensToWords = (tokens: YtWord[]): YtWord[] => {
  const words: YtWord[] = [];
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

// Captions are generated into public/ (gitignored), so load them at runtime
// instead of importing them: a fresh clone without captions still builds.
const buildYtWords = (captions: Caption[]): YtWord[] => {
  const safe = captions ?? [];
  const raw = tokensToWords(
    safe.map((c) => ({text: c.text, fromMs: c.startMs, toMs: c.endMs})),
  );
  const fixes = (ytRawContent as {captionFixes?: Record<string, string>}).captionFixes ?? {};
  return raw
    .map((w) => {
      const bare = w.text.replace(/[.,?!:]+$/, '');
      const fix = fixes[bare];
      return fix === undefined ? w : {...w, text: w.text.replace(bare, fix)};
    })
    .filter((w) => w.text.trim() !== '');
};

export const YoutubePsychVideo: React.FC = () => {
  const {durationInFrames} = useVideoConfig();
  const [handle] = useState(() => delayRender('Loading captions-yt.json'));
  const [ytWords, setYtWords] = useState<YtWord[]>([]);
  useEffect(() => {
    fetch(staticFile('captions-yt.json'))
      .then((r) => (r.ok ? r.json() : []))
      .then((caps: Caption[]) => setYtWords(buildYtWords(caps)))
      .catch(() => setYtWords([]))
      .finally(() => continueRender(handle));
  }, [handle]);

  const ytContent = ytRawContent as {
    name?: string;
    watermark?: string;
    channelName?: string;
    title?: string;
    accent?: string;
    music?: string;
    musicVolume?: number;
    keywords?: string[];
    captionFixes?: Record<string, string>;
    chapters?: YtChapter[];
    ytScenes?: YtScene[];
  };

  const vol = ytContent.musicVolume ?? 0.08;
  const isRendering = getRemotionEnvironment().isRendering;

  return (
    <AbsoluteFill style={{background: YT_PALETTE.bgDeep}}>
      {!isRendering && <Audio src={staticFile('voiceover-yt.wav')} />}
      {!isRendering && ytContent.music && (
        <Audio
          src={staticFile(ytContent.music)}
          loop
          volume={(f) =>
            interpolate(
              f,
              [0, 30, durationInFrames - 45, durationInFrames],
              [0, vol, vol, 0],
              {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
            )
          }
        />
      )}
      <YoutubePsychStory
        words={ytWords}
        scenes={(ytContent.ytScenes as YtScene[]) ?? []}
        chapters={(ytContent.chapters as YtChapter[]) ?? []}
        title={ytContent.title}
        watermark={ytContent.watermark ?? DEFAULT_HANDLE}
        channelName={ytContent.channelName ?? 'LOGIKA & PIKIRAN'}
        keywords={ytContent.keywords ?? []}
        accent={ytContent.accent ?? YT_PALETTE.gold}
      />
    </AbsoluteFill>
  );
};
