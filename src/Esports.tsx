// "Esports" template: modern MLBB/MPL match-recap "hype scoreboard" reel.
// Everything is drawn as SVG (no photos / no real team logos — emblems are
// generic geometric shields so nothing trademarked is reproduced). Dark arena
// palette with team-colour neon glows, a big animated score reveal, bracket
// road, roster cards, a golden M8 "ticket" stamp and a brand outro. Scene cuts
// follow cue words in the narration, exactly like the chronicle/stickman
// templates (same FIRST-substring cue resolver — keep cues unique + increasing).
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type EspWord = {text: string; fromMs: number; toMs: number};
export type EspScene = {
  kind: string; // title | versus | score | road | roster | ticket | next | outro
  cue: string | null;
  label?: string; // headline
  sub?: string; // supporting line
  kicker?: string; // small top tag for this scene
  // score / versus
  teamL?: string;
  teamR?: string;
  scoreL?: number;
  scoreR?: number;
  winner?: 'L' | 'R';
  bo?: string; // e.g. "BEST OF 5"
  // road
  steps?: {opp: string; score: string}[];
  // roster
  players?: {name: string; role: string}[];
  // ticket / next
  big?: string;
  small?: string;
};

const W = 1080;
const H = 1920;

// ---- arena palette ---------------------------------------------------------
const BG0 = '#070a14';
const BG1 = '#0d1324';
const BG2 = '#18213f';
const NAVI = '#FFE23D';
const NAVI2 = '#F5B000';
const TLID = '#2f6bff';
const TLID2 = '#0a2a7a';
const CYAN = '#36e0f0';
const MAG = '#b23cff';
const GOLD = '#FFC94D';
const GOLD2 = '#E09018';
const WHITE = '#F4F7FF';
const MUTE = '#8A96B8';
const WIN = '#3df0a0';
const INK = '#07090f';

const DISP = "'Arial Black', 'Arial Narrow', Impact, system-ui, sans-serif";
const BODY = "'Arial', 'Helvetica Neue', system-ui, sans-serif";

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const wrap = (s: string, max: number): string[] => {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur.trim());
  return lines;
};

// ---------------------------------------------------------------------------
// Shared defs + background
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stopColor={BG1} />
      <stop offset="55%" stopColor={BG0} />
      <stop offset="100%" stopColor="#05070e" />
    </linearGradient>
    <radialGradient id="glowY" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={NAVI} stopOpacity="0.55" />
      <stop offset="100%" stopColor={NAVI} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glowB" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={TLID} stopOpacity="0.55" />
      <stop offset="100%" stopColor={TLID} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glowG" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={GOLD} stopOpacity="0.6" />
      <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
    </radialGradient>
    <linearGradient id="yfill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={NAVI} />
      <stop offset="100%" stopColor={NAVI2} />
    </linearGradient>
    <linearGradient id="bfill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={CYAN} />
      <stop offset="100%" stopColor={TLID} />
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFE9A8" />
      <stop offset="45%" stopColor={GOLD} />
      <stop offset="100%" stopColor={GOLD2} />
    </linearGradient>
    <linearGradient id="panelY" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#1b1c12" />
      <stop offset="100%" stopColor="#0c0d08" />
    </linearGradient>
    <linearGradient id="panelB" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#0f1836" />
      <stop offset="100%" stopColor="#070b1c" />
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="10" /></filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
      <feColorMatrix in="n" type="saturate" values="0" />
    </filter>
    <radialGradient id="vig" cx="50%" cy="42%" r="75%">
      <stop offset="55%" stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#000" stopOpacity="0.72" />
    </radialGradient>
  </defs>
);

// faint hex-grid field
const HexField: React.FC<{op?: number}> = ({op = 0.06}) => {
  const rows = [];
  const r = 46;
  const dx = r * 1.73;
  const dy = r * 1.5;
  for (let j = -1; j * dy < H + r; j++) {
    for (let i = -1; i * dx < W + r; i++) {
      const cx = i * dx + (j % 2 ? dx / 2 : 0);
      const cy = j * dy;
      const pts = [...Array(6)].map((_, k) => {
        const a = (Math.PI / 180) * (60 * k - 30);
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
      }).join(' ');
      rows.push(<polygon key={`${i}-${j}`} points={pts} fill="none" stroke="#3a4a80" strokeWidth="1.2" opacity={op} />);
    }
  }
  return <g>{rows}</g>;
};

const StageBG: React.FC<{tint?: 'y' | 'b' | 'g' | 'split'; f: number}> = ({tint = 'split', f}) => {
  const sweep = ((f * 7) % (W + 600)) - 300;
  return (
    <>
      <rect x="0" y="0" width={W} height={H} fill="url(#bg)" />
      <HexField />
      {/* team glows */}
      {(tint === 'y' || tint === 'split') && <circle cx={tint === 'split' ? 170 : 540} cy="680" r="640" fill="url(#glowY)" />}
      {(tint === 'b' || tint === 'split') && <circle cx={tint === 'split' ? 910 : 540} cy="680" r="640" fill="url(#glowB)" />}
      {tint === 'g' && <circle cx="540" cy="760" r="720" fill="url(#glowG)" />}
      {/* light sweep */}
      <rect x={sweep} y="0" width="160" height={H} fill="#ffffff" opacity="0.03" transform={`skewX(-12)`} />
      {/* bottom floor line */}
      <rect x="0" y="1580" width={W} height="4" fill="#223" opacity="0.6" />
      <rect x="0" y="0" width={W} height={H} fill="url(#vig)" />
      <rect x="0" y="0" width={W} height={H} filter="url(#grain)" opacity="0.045" />
    </>
  );
};

// persistent top tag
const TopTag: React.FC<{kicker?: string}> = ({kicker}) => (
  <g>
    <rect x="60" y="120" width="18" height="46" fill={MAG} />
    <text x="96" y="156" fontFamily={DISP} fontSize="34" fill={WHITE} letterSpacing="3">
      {kicker ?? 'MPL ID S18 • PLAYOFFS'}
    </text>
  </g>
);

// generic (non-trademark) team emblem: angular shield + monogram
const Emblem: React.FC<{cx: number; cy: number; s?: number; color: string; fill: string; mono: string}> = ({
  cx, cy, s = 1, color, fill, mono,
}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`}>
    <polygon points="0,-120 104,-60 104,60 0,128 -104,60 -104,-60" fill={INK} stroke={color} strokeWidth="7" />
    <polygon points="0,-120 104,-60 104,60 0,128 -104,60 -104,-60" fill={`url(#${fill})`} opacity="0.14" />
    <polygon points="-104,-60 104,60 104,20 -104,-100" fill={color} opacity="0.25" />
    <text x="0" y="26" textAnchor="middle" fontFamily={DISP} fontSize="62" fill={color}
      fontStyle="italic" letterSpacing="1">{mono}</text>
  </g>
);

// role glyph for roster cards
const RoleIcon: React.FC<{role: string; x: number; y: number}> = ({role, x, y}) => {
  const r = role.toLowerCase();
  const col = NAVI;
  return (
    <g transform={`translate(${x} ${y})`} stroke={col} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {r.includes('jung') && (<><path d="M -22 20 L 0 -24 L 22 20 Z" /><path d="M 0 -24 L 0 24" /></>)}
      {r.includes('exp') && (<><rect x="-22" y="-22" width="44" height="44" rx="6" /><path d="M -22 8 L 22 8" /></>)}
      {r.includes('roam') && (<><circle r="22" /><path d="M 0 -22 L 0 -8 M 0 22 L 0 8 M -22 0 L -8 0 M 22 0 L 8 0" /></>)}
      {r.includes('gold') && (<><circle r="20" /><path d="M -9 0 L 9 0 M 0 -9 L 0 9" /></>)}
      {r.includes('mid') && (<><path d="M -22 -18 L 22 -18 M 0 -18 L 0 22" /></>)}
      {!r.match(/jung|exp|roam|gold|mid/) && <circle r="20" />}
    </g>
  );
};

// chunky display headline with team/gold underline, reveals on entry
const Headline: React.FC<{text: string; y: number; size?: number; f: number; color?: string; accent?: string; sub?: string; italic?: boolean}> = ({
  text, y, size = 92, f, color = WHITE, accent = NAVI, sub, italic = true,
}) => {
  const {fps} = useVideoConfig();
  const p = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 14});
  const lines = wrap(text.toUpperCase(), 15);
  return (
    <g opacity={p} transform={`translate(${interpolate(p, [0, 1], [-40, 0])} 0)`}>
      {lines.map((ln, i) => (
        <text key={i} x={W / 2} y={y + i * (size + 8)} textAnchor="middle" fontFamily={DISP}
          fontStyle={italic ? 'italic' : 'normal'} fontSize={size} fill={color} letterSpacing="1"
          style={{paintOrder: 'stroke', stroke: INK, strokeWidth: 9}}>{ln}</text>
      ))}
      <rect x={W / 2 - 110} y={y + (lines.length - 1) * (size + 8) + 26} width="220" height="8" fill={accent} />
      {sub ? (
        <text x={W / 2} y={y + (lines.length - 1) * (size + 8) + 86} textAnchor="middle" fontFamily={BODY}
          fontWeight="700" fontSize="40" fill={MUTE} letterSpacing="2">{sub.toUpperCase()}</text>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------
const SceneArt: React.FC<{scene: EspScene; f: number; len: number}> = ({scene, f, len}) => {
  const {fps} = useVideoConfig();
  const k = scene.kind;
  const pop = spring({frame: f, fps, config: {damping: 14}, durationInFrames: 12});

  if (k === 'title') {
    return (
      <>
        <Defs />
        <StageBG tint="split" f={f} />
        <TopTag kicker={scene.kicker} />
        {/* confetti */}
        {[...Array(26)].map((_, i) => {
          const seed = (i * 97) % 100;
          const x = (seed / 100) * W;
          const y = ((f * (2 + (i % 4)) + seed * 9) % (H + 200)) - 100;
          const col = [NAVI, CYAN, MAG, GOLD][i % 4];
          return <rect key={i} x={x} y={y} width="10" height="22" fill={col} opacity="0.5"
            transform={`rotate(${(f * 3 + i * 40) % 360} ${x} ${y})`} />;
        })}
        <g transform={`translate(0 ${interpolate(pop, [0, 1], [40, 0])})`} opacity={pop}>
          <Headline text={scene.label ?? 'NAVI'} y={900} size={150} f={f} accent={NAVI} />
        </g>
        {scene.sub ? <Headline text={scene.sub} y={1150} size={56} f={f} color={MUTE} accent={MAG} italic /> : null}
      </>
    );
  }

  if (k === 'versus') {
    const dash = interpolate(pop, [0, 1], [0, 1]);
    return (
      <>
        <Defs />
        <StageBG tint="split" f={f} />
        <TopTag kicker={scene.kicker ?? 'UPPER BRACKET FINAL'} />
        {/* banner */}
        <g transform="translate(540 360)">
          <rect x="-360" y="-40" width="720" height="80" rx="40" fill={INK} stroke={MAG} strokeWidth="3" />
          <text x="0" y="14" textAnchor="middle" fontFamily={DISP} fontSize="40" fill={WHITE} letterSpacing="4">
            {(scene.label ?? 'UPPER BRACKET FINAL').toUpperCase()}
          </text>
        </g>
        <g opacity={pop}>
          <Emblem cx={300} cy={820} s={1.5} color={NAVI} fill="yfill" mono={scene.teamL ?? 'NAVI'} />
          <Emblem cx={780} cy={820} s={1.5} color={CYAN} fill="bfill" mono={scene.teamR ?? 'TLID'} />
        </g>
        {/* VS clash */}
        <g transform="translate(540 820)" opacity={dash}>
          <circle r="92" fill={INK} stroke={WHITE} strokeWidth="4" />
          <text x="0" y="30" textAnchor="middle" fontFamily={DISP} fontStyle="italic" fontSize="86" fill={WHITE}>VS</text>
        </g>
        <text x={300} y={1010} textAnchor="middle" fontFamily={DISP} fontSize="58" fill={NAVI} letterSpacing="4">
          {(scene.teamL ?? 'NAVI').toUpperCase()}
        </text>
        <text x={780} y={1010} textAnchor="middle" fontFamily={DISP} fontSize="58" fill={CYAN} letterSpacing="4">
          {(scene.teamR ?? 'TLID').toUpperCase()}
        </text>
        {scene.sub ? (
          <text x={W / 2} y={1150} textAnchor="middle" fontFamily={BODY} fontWeight="700" fontSize="40" fill={MUTE}
            letterSpacing="2">{scene.sub.toUpperCase()}</text>
        ) : null}
      </>
    );
  }

  if (k === 'score') {
    const win = scene.winner ?? 'L';
    const sL = scene.scoreL ?? 3;
    const sR = scene.scoreR ?? 2;
    // count-up
    const cL = Math.round(interpolate(spring({frame: f, fps, durationInFrames: 22, config: {damping: 18}}), [0, 1], [0, sL]));
    const cR = Math.round(interpolate(spring({frame: f - 6, fps, durationInFrames: 22, config: {damping: 18}}), [0, 1], [0, sR]));
    const flash = Math.max(0, 1 - f / 10);
    const pulse = 1 + 0.03 * Math.sin(f / 7);
    return (
      <>
        <Defs />
        <StageBG tint="split" f={f} />
        <TopTag kicker={scene.kicker ?? 'FINAL SCORE'} />
        {/* team panels */}
        <g opacity={pop}>
          <g transform={`translate(272 ${interpolate(pop, [0, 1], [-30, 0])})`}>
            <rect x="-180" y="560" width="360" height="520" rx="26" fill="url(#panelY)" stroke={NAVI} strokeWidth={win === 'L' ? 6 : 2} opacity={win === 'L' ? 1 : 0.55} />
            {win === 'L' && <rect x="-180" y="560" width="360" height="520" rx="26" fill="url(#glowY)" opacity="0.22" />}
            <Emblem cx={0} cy={820} s={1.15} color={NAVI} fill="yfill" mono={scene.teamL ?? 'NAVI'} />
          </g>
          <g transform={`translate(808 ${interpolate(pop, [0, 1], [-30, 0])})`}>
            <rect x="-180" y="560" width="360" height="520" rx="26" fill="url(#panelB)" stroke={CYAN} strokeWidth={win === 'R' ? 6 : 2} opacity={win === 'R' ? 1 : 0.55} />
            <Emblem cx={0} cy={820} s={1.15} color={CYAN} fill="bfill" mono={scene.teamR ?? 'TLID'} />
          </g>
        </g>
        {/* giant score */}
        <g transform={`translate(540 1230) scale(${pulse})`}>
          <text x="-150" y="0" textAnchor="middle" fontFamily={DISP} fontStyle="italic" fontSize="300" fill={NAVI}
            style={{paintOrder: 'stroke', stroke: INK, strokeWidth: 14}}>{cL}</text>
          <text x="0" y="-16" textAnchor="middle" fontFamily={DISP} fontSize="150" fill={MUTE}>-</text>
          <text x="150" y="0" textAnchor="middle" fontFamily={DISP} fontStyle="italic" fontSize="300" fill={CYAN}
            style={{paintOrder: 'stroke', stroke: INK, strokeWidth: 14}}>{cR}</text>
        </g>
        {/* BO tag */}
        <g transform="translate(540 1330)">
          <rect x="-150" y="-34" width="300" height="64" rx="32" fill={INK} stroke={MAG} strokeWidth="2" />
          <text x="0" y="12" textAnchor="middle" fontFamily={DISP} fontSize="34" fill={WHITE} letterSpacing="3">
            {(scene.bo ?? 'BEST OF 5').toUpperCase()}
          </text>
        </g>
        {/* winner stamp */}
        <g transform={`translate(${win === 'L' ? 272 : 808} 520) rotate(-8)`} opacity={spring({frame: f - 14, fps, durationInFrames: 10, config: {damping: 12}})}>
          <rect x="-120" y="-34" width="240" height="68" rx="10" fill={win === 'L' ? NAVI : CYAN} />
          <text x="0" y="14" textAnchor="middle" fontFamily={DISP} fontStyle="italic" fontSize="40" fill={INK} letterSpacing="2">WINNER</text>
        </g>
        <rect x="0" y="0" width={W} height={H} fill={WHITE} opacity={flash * 0.5} />
      </>
    );
  }

  if (k === 'road') {
    const steps = scene.steps ?? [];
    return (
      <>
        <Defs />
        <StageBG tint="y" f={f} />
        <TopTag kicker={scene.kicker ?? 'JALAN MENUJU FINAL'} />
        <Headline text={scene.label ?? 'ROAD TO GRAND FINAL'} y={420} size={74} f={f} accent={NAVI} />
        {steps.map((st, i) => {
          const sp = spring({frame: f - 8 - i * 10, fps, durationInFrames: 12, config: {damping: 16}});
          const y = 640 + i * 230;
          return (
            <g key={i} opacity={sp} transform={`translate(${interpolate(sp, [0, 1], [-60, 0])} 0)`}>
              <rect x="110" y={y} width="860" height="180" rx="22" fill="#0c1327" stroke="#2b3a66" strokeWidth="2" />
              {/* win check */}
              <circle cx="210" cy={y + 90} r="48" fill={WIN} opacity="0.16" />
              <path d={`M 186 ${y + 90} l 18 20 l 34 -42`} stroke={WIN} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x="300" y={y + 78} fontFamily={DISP} fontStyle="italic" fontSize="52" fill={WHITE}>{st.opp.toUpperCase()}</text>
              <text x="300" y={y + 134} fontFamily={BODY} fontWeight="700" fontSize="34" fill={MUTE} letterSpacing="2">MENANG</text>
              <text x="930" y={y + 116} textAnchor="end" fontFamily={DISP} fontStyle="italic" fontSize="86" fill={NAVI}>{st.score}</text>
            </g>
          );
        })}
      </>
    );
  }

  if (k === 'roster') {
    const players = scene.players ?? [];
    return (
      <>
        <Defs />
        <StageBG tint="y" f={f} />
        <TopTag kicker={scene.kicker ?? 'SKUAD NAVI'} />
        <Headline text={scene.label ?? 'SANG BINTANG'} y={430} size={78} f={f} accent={NAVI} sub={scene.sub} />
        {players.map((p, i) => {
          const sp = spring({frame: f - 8 - i * 9, fps, durationInFrames: 12, config: {damping: 15}});
          const y = 700 + i * 250;
          return (
            <g key={i} opacity={sp} transform={`translate(0 ${interpolate(sp, [0, 1], [40, 0])})`}>
              <rect x="120" y={y} width="840" height="200" rx="24" fill="url(#panelY)" stroke={NAVI} strokeWidth="2" opacity="0.95" />
              <rect x="120" y={y} width="12" height="200" fill={NAVI} />
              <circle cx="240" cy={y + 100} r="60" fill="#12140b" stroke={NAVI} strokeWidth="3" />
              <RoleIcon role={p.role} x={240} y={y + 100} />
              <text x="360" y={y + 92} fontFamily={DISP} fontStyle="italic" fontSize="66" fill={WHITE}>{p.name.toUpperCase()}</text>
              <text x="360" y={y + 150} fontFamily={BODY} fontWeight="700" fontSize="36" fill={GOLD} letterSpacing="3">{p.role.toUpperCase()}</text>
            </g>
          );
        })}
      </>
    );
  }

  if (k === 'ticket') {
    const tilt = interpolate(pop, [0, 1], [-14, -5]);
    const shine = ((f * 9) % 520) - 120;
    return (
      <>
        <Defs />
        <StageBG tint="g" f={f} />
        <TopTag kicker={scene.kicker ?? 'HADIAHNYA'} />
        <Headline text={scene.label ?? 'TIKET KE M8'} y={420} size={82} f={f} accent={GOLD} />
        <g transform={`translate(540 980) rotate(${tilt})`} opacity={pop}>
          {/* ticket body */}
          <rect x="-400" y="-230" width="800" height="460" rx="34" fill="url(#gold)" />
          <rect x="-400" y="-230" width="800" height="460" rx="34" fill="none" stroke="#fff6d8" strokeWidth="4" opacity="0.6" />
          {/* perforation */}
          <line x1="150" y1="-230" x2="150" y2="230" stroke={INK} strokeWidth="4" strokeDasharray="10 14" opacity="0.5" />
          {/* shine */}
          <rect x={shine} y="-230" width="70" height="460" fill="#ffffff" opacity="0.18" transform="skewX(-16)" />
          {/* trophy */}
          <g transform="translate(300 0)" fill={INK}>
            <path d="M -60 -90 h 120 v 40 a 60 60 0 0 1 -120 0 Z" />
            <path d="M -60 -70 h -34 a 24 24 0 0 0 24 40 Z" />
            <path d="M 60 -70 h 34 a 24 24 0 0 1 -24 40 Z" />
            <rect x="-14" y="10" width="28" height="46" />
            <rect x="-54" y="56" width="108" height="20" rx="6" />
          </g>
          <text x="-360" y="-120" fontFamily={DISP} fontStyle="italic" fontSize="46" fill={INK}>M8 WORLD</text>
          <text x="-360" y="-58" fontFamily={DISP} fontStyle="italic" fontSize="46" fill={INK}>CHAMPIONSHIP</text>
          <rect x="-360" y="-22" width="470" height="4" fill={INK} opacity="0.4" />
          <text x="-360" y="58" fontFamily={BODY} fontWeight="900" fontSize="40" fill={INK}>{(scene.big ?? 'TIKET PERTAMA').toUpperCase()}</text>
          <text x="-360" y="150" fontFamily={BODY} fontWeight="700" fontSize="36" fill="#3a2d08" letterSpacing="2">{(scene.small ?? 'TURKI • 3–23 JAN').toUpperCase()}</text>
        </g>
      </>
    );
  }

  if (k === 'next') {
    return (
      <>
        <Defs />
        <StageBG tint="split" f={f} />
        <TopTag kicker={scene.kicker ?? 'BELUM SELESAI'} />
        <Headline text={scene.label ?? 'GRAND FINAL MENANTI'} y={620} size={88} f={f} accent={MAG} />
        <g transform="translate(540 980)" opacity={pop}>
          <rect x="-300" y="-120" width="600" height="240" rx="26" fill="#0c1327" stroke={MAG} strokeWidth="3" />
          <rect x="-300" y="-120" width="600" height="70" rx="26" fill={MAG} opacity="0.9" />
          <rect x="-300" y="-66" width="600" height="16" fill="#0c1327" />
          <text x="0" y="-70" textAnchor="middle" fontFamily={DISP} fontStyle="italic" fontSize="40" fill={WHITE} letterSpacing="3">
            {(scene.small ?? 'GRAND FINAL').toUpperCase()}
          </text>
          <text x="0" y="56" textAnchor="middle" fontFamily={DISP} fontStyle="italic" fontSize="128" fill={WHITE}>
            {scene.big ?? '8 NOV'}
          </text>
        </g>
        {scene.sub ? (
          <text x={W / 2} y={1200} textAnchor="middle" fontFamily={BODY} fontWeight="700" fontSize="40" fill={MUTE} letterSpacing="2">
            {scene.sub.toUpperCase()}
          </text>
        ) : null}
      </>
    );
  }

  // outro
  return (
    <>
      <Defs />
      <StageBG tint="split" f={f} />
      {[...Array(20)].map((_, i) => {
        const seed = (i * 71) % 100;
        const x = (seed / 100) * W;
        const y = ((f * (2 + (i % 3)) + seed * 11) % (H + 200)) - 100;
        return <rect key={i} x={x} y={y} width="9" height="20" fill={[NAVI, CYAN, GOLD][i % 3]} opacity="0.45"
          transform={`rotate(${(f * 4 + i * 33) % 360} ${x} ${y})`} />;
      })}
      <Headline text={scene.label ?? 'BORN TO WIN'} y={820} size={128} f={f} accent={NAVI} />
      {scene.sub ? <Headline text={scene.sub} y={1030} size={50} f={f} color={MUTE} accent={MAG} /> : null}
      <g transform={`translate(${W / 2} 1300)`} opacity={spring({frame: f - 10, fps, durationInFrames: 10, config: {damping: 13}})}>
        <rect x="-260" y="-58" width="520" height="104" rx="52" fill={NAVI} />
        <text x="0" y="14" textAnchor="middle" fontFamily={DISP} fontStyle="italic" fontSize="52" fill={INK}>
          {scene.small ?? '@rakyatrebahanid'}
        </text>
      </g>
    </>
  );
};

// ---------------------------------------------------------------------------
// Running subtitle — safe band (kept < y1520 so platform UI doesn't cover it)
// ---------------------------------------------------------------------------
const groupWords = (words: EspWord[]) => {
  const groups: EspWord[][] = [];
  let cur: EspWord[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length === 3 || /[.,?!:]$/.test(w.text)) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  return groups;
};

const Subtitle: React.FC<{words: EspWord[]; keywords: string[]}> = ({words, keywords}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const groups = groupWords(words);
  const group = groups.find(
    (g, i) => ms >= g[0].fromMs && ms < (groups[i + 1]?.[0].fromMs ?? g[g.length - 1].toMs + 500),
  );
  if (!group) return null;
  const startF = (group[0].fromMs / 1000) * fps;
  const pop = spring({frame: frame - startF, fps, config: {damping: 13}, durationInFrames: 7});
  const keys = keywords.map(clean);
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top: 1400,
        textAlign: 'center',
        fontFamily: DISP,
        fontStyle: 'italic',
        fontSize: 62,
        lineHeight: 1.15,
        color: WHITE,
        WebkitTextStroke: '11px #07090f',
        paintOrder: 'stroke fill',
        textShadow: '0 6px 24px rgba(0,0,0,0.6)',
        transform: `scale(${interpolate(pop, [0, 1], [0.9, 1])})`,
      }}
    >
      {group.map((w, i) => (
        <span key={i} style={{color: keys.some((kk) => clean(w.text).includes(kk)) ? NAVI : WHITE}}>
          {w.text.replace(/[.,:]$/, '')}{' '}
        </span>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root: cue-driven timeline + subtle punch-in
// ---------------------------------------------------------------------------
export const EsportsStory: React.FC<{
  words: EspWord[];
  scenes: EspScene[];
  keywords: string[];
}> = ({words, scenes, keywords}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // No narration (silent preview / Studio): spread scenes evenly so the whole
  // look is visible. With captions, cut on cue words like the other templates.
  const even = words.length === 0;
  const starts = scenes.map((s, i) => {
    if (even) return Math.round((i / Math.max(scenes.length, 1)) * durationInFrames);
    if (!s.cue) return 0;
    const w = words.find((x) => clean(x.text).includes(clean(s.cue as string)));
    return w ? Math.round((w.fromMs / 1000) * fps) : null;
  });
  const timeline = scenes
    .map((s, i) => ({scene: s, from: starts[i]}))
    .filter((s): s is {scene: EspScene; from: number} => s.from !== null);
  const idx = timeline.reduce((best, s, i) => (frame >= s.from ? i : best), 0);
  const item = timeline[idx] ?? {scene: scenes[0], from: 0};
  const scene = item.scene;
  const from = item.from;
  const end = timeline[idx + 1]?.from ?? durationInFrames;
  const f = frame - from;
  const len = Math.max(end - from, 1);

  const punch = spring({frame: f, fps, config: {damping: 18}, durationInFrames: 12});
  const zoom = interpolate(punch, [0, 1], [1.08, 1.0]) + (f / len) * 0.03;

  return (
    <AbsoluteFill style={{background: BG0, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 48%'}}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <SceneArt key={scene.kind + idx} scene={scene} f={f} len={len} />
        </svg>
      </AbsoluteFill>
      <Subtitle words={words} keywords={keywords} />
    </AbsoluteFill>
  );
};
