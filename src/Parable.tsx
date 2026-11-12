// "Parable" template: allegorical social-philosophy reels set in a fictional
// land ("Negeri Konoha"). Cold midnight palette (ink-blue, charcoal, cold
// marble) with gold + red accents, film grain, vignette and a slow Ken Burns
// move. Scenes are drawn as SVG silhouettes of power imagery (Plato's cave,
// puppeteer, throne, divided crowd, the naked emperor, pointing mob, tilted
// scales, cracked pillars). Scene cuts follow cue words in the narration, the
// same cue engine as the chronicle/stickman templates.
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type ParWord = {text: string; fromMs: number; toMs: number};
export type ParScene = {
  kind: string; // title|cave|puppet|arena|throne|bread|divide|emperor|silence|scales|pillar|quote|outro
  cue: string | null;
  label?: string; // headline / hook line
  sub?: string; // small supporting line
  quote?: string; // for the quote scene
  author?: string; // attribution under a quote
};

const W = 1080;
const H = 1920;

// cold "state & power" palette -----------------------------------------------
const BG_TOP = '#070c13';
const BG_MID = '#111f2e';
const BG_GLOW = '#274055';
const GROUND = '#0a1017';
const STONE = '#5c6b79';
const STONE_SH = '#333f49';
const MARBLE = '#c4ced7';
const MARBLE_SH = '#64717d';
const CREAM = '#ece3cf';
const GOLD = '#e0b24a';
const RED = '#c6483b';
const INK = '#0a0e13';
const DARK = '#04070b';

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

// ---------------------------------------------------------------------------
// Shared atmosphere: gradients, cold sky, warm fire glow, film grain, vignette
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <linearGradient id="psky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={BG_TOP} />
      <stop offset="55%" stopColor={BG_MID} />
      <stop offset="100%" stopColor="#0c1620" />
    </linearGradient>
    <radialGradient id="pglow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#4c7596" stopOpacity="0.9" />
      <stop offset="60%" stopColor={BG_GLOW} stopOpacity="0.4" />
      <stop offset="100%" stopColor={BG_GLOW} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="pfire" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0.95" />
      <stop offset="45%" stopColor="#f0932f" stopOpacity="0.6" />
      <stop offset="100%" stopColor="#f0932f" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="pvig" cx="50%" cy="46%" r="72%">
      <stop offset="50%" stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#02040a" stopOpacity="0.9" />
    </radialGradient>
    <linearGradient id="pstone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={STONE} />
      <stop offset="100%" stopColor={STONE_SH} />
    </linearGradient>
    <linearGradient id="pmarble" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={MARBLE} />
      <stop offset="60%" stopColor="#aab6c0" />
      <stop offset="100%" stopColor={MARBLE_SH} />
    </linearGradient>
    <filter id="pgrain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
      <feColorMatrix in="n" type="saturate" values="0" />
    </filter>
  </defs>
);

const Grain: React.FC = () => (
  <>
    <rect x="0" y="0" width={W} height={H} fill="url(#pvig)" />
    <rect x="0" y="0" width={W} height={H} filter="url(#pgrain)" opacity="0.08" />
  </>
);

// plain cold backdrop + floor, with an optional cold glow bloom
const RoomBG: React.FC<{glow?: [number, number]; warm?: boolean}> = ({glow = [540, 820], warm = false}) => (
  <>
    <rect x="0" y="0" width={W} height={H} fill="url(#psky)" />
    <circle cx={glow[0]} cy={glow[1]} r={560} fill={`url(#${warm ? 'pfire' : 'pglow'})`} />
    <rect x="0" y="1320" width={W} height={H - 1320} fill={GROUND} />
    <rect x="0" y="1320" width={W} height="4" fill={STONE_SH} opacity="0.6" />
  </>
);

// ---------------------------------------------------------------------------
// Silhouette building blocks
// ---------------------------------------------------------------------------
// a simple standing person, feet at (x,y)
const Figure: React.FC<{x: number; y: number; s?: number; color?: string; flip?: boolean; armsUp?: boolean}> = ({
  x,
  y,
  s = 1,
  color = DARK,
  flip = false,
  armsUp = false,
}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} fill={color}>
    <circle cx="0" cy="-168" r="33" />
    <rect x="-30" y="-132" width="60" height="112" rx="20" />
    <rect x="-27" y="-22" width="22" height="86" rx="9" />
    <rect x="5" y="-22" width="22" height="86" rx="9" />
    {armsUp ? (
      <>
        <rect x="-46" y="-168" width="18" height="78" rx="9" transform="rotate(32 -37 -150)" />
        <rect x="28" y="-168" width="18" height="78" rx="9" transform="rotate(-32 37 -150)" />
      </>
    ) : (
      <>
        <rect x="-44" y="-124" width="17" height="82" rx="8" />
        <rect x="27" y="-124" width="17" height="82" rx="8" />
      </>
    )}
  </g>
);

// a back-facing seated head+shoulders (the watching masses)
const SeatedBack: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = DARK}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
    <circle cx="0" cy="-70" r="40" />
    <path d="M -74 20 C -74 -44 74 -44 74 20 Z" />
  </g>
);

// a fluted column, optionally broken at height `broke` (0..1 of full)
const Column: React.FC<{x: number; top: number; base?: number; broke?: number; w?: number}> = ({
  x,
  top,
  base = 1320,
  broke = 1,
  w = 70,
}) => {
  const bt = base - (base - top) * broke;
  return (
    <g>
      <rect x={x - w / 2 - 10} y={base - 18} width={w + 20} height="18" fill={STONE_SH} />
      <rect x={x - w / 2} y={bt} width={w} height={base - 18 - bt} fill="url(#pstone)" />
      {[...Array(5)].map((_, k) => (
        <rect key={k} x={x - w / 2 + 8 + k * (w / 6)} y={bt} width="4" height={base - 18 - bt} fill={DARK} opacity="0.2" />
      ))}
      {broke >= 1 ? (
        <>
          <rect x={x - w / 2 - 10} y={bt - 22} width={w + 20} height="22" fill={STONE_SH} />
          <rect x={x - w / 2 - 4} y={bt - 38} width={w + 8} height="18" fill={STONE} />
        </>
      ) : (
        <polygon points={`${x - w / 2},${bt} ${x + w / 2},${bt} ${x + w / 2 - 14},${bt - 26} ${x - w / 2 + 10},${bt - 10}`} fill={STONE_SH} />
      )}
    </g>
  );
};

// a crown glyph
const Crown: React.FC<{cx: number; cy: number; s?: number; color?: string}> = ({cx, cy, s = 1, color = GOLD}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`} fill={color}>
    <path d="M -70 30 L -70 -40 L -35 2 L 0 -52 L 35 2 L 70 -40 L 70 30 Z" />
    <rect x="-70" y="30" width="140" height="22" />
    <circle cx="-70" cy="-44" r="9" />
    <circle cx="0" cy="-58" r="10" />
    <circle cx="70" cy="-44" r="9" />
  </g>
);

// ---------------------------------------------------------------------------
// Headline block (cream serif, gold rule, italic gold subline)
// ---------------------------------------------------------------------------
const Headline: React.FC<{text: string; y: number; size?: number; f: number; sub?: string; color?: string}> = ({
  text,
  y,
  size = 74,
  f,
  sub,
  color = CREAM,
}) => {
  const {fps} = useVideoConfig();
  const p = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 16});
  const lines = wrap(text.toUpperCase(), 17);
  return (
    <g opacity={p} transform={`translate(0 ${interpolate(p, [0, 1], [26, 0])})`}>
      {lines.map((ln, i) => (
        <text key={i} x={W / 2} y={y + i * (size + 12)} textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize={size}
          fill={color} letterSpacing="2"
          style={{paintOrder: 'stroke', stroke: DARK, strokeWidth: 11}}>
          {ln}
        </text>
      ))}
      <rect x={W / 2 - 90} y={y + lines.length * (size + 12) - 26} width="180" height="5" fill={GOLD} />
      {sub ? (
        <text x={W / 2} y={y + lines.length * (size + 12) + 42} textAnchor="middle"
          fontFamily="Georgia, serif" fontStyle="italic" fontSize="37" fill={GOLD}
          style={{paintOrder: 'stroke', stroke: DARK, strokeWidth: 6}}>
          {sub}
        </text>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// One scene (full 1080x1920 SVG)
// ---------------------------------------------------------------------------
const SceneArt: React.FC<{scene: ParScene; f: number}> = ({scene, f}) => {
  const {fps} = useVideoConfig();
  const k = scene.kind;

  if (k === 'title') {
    // cold hall: two receding rows of columns + center glow + hook headline
    return (
      <>
        <Defs />
        <RoomBG glow={[540, 740]} />
        {[160, 300, 470].map((x, i) => (
          <Column key={'l' + i} x={x} top={420 + i * 60} base={1320} w={70 - i * 10} />
        ))}
        {[920, 780, 610].map((x, i) => (
          <Column key={'r' + i} x={x} top={420 + i * 60} base={1320} w={70 - i * 10} />
        ))}
        <Grain />
        <Headline text={scene.label ?? ''} y={960} size={70} f={f} sub={scene.sub} />
      </>
    );
  }

  if (k === 'cave') {
    // prisoners facing a lit wall; fire glow behind; shadow puppets on the wall
    return (
      <>
        <Defs />
        <rect x="0" y="0" width={W} height={H} fill="url(#psky)" />
        {/* lit wall */}
        <rect x="90" y="240" width={W - 180} height="560" rx="14" fill="#223241" />
        <rect x="90" y="240" width={W - 180} height="560" rx="14" fill="url(#pglow)" opacity="0.5" />
        {/* cast shadows on the wall */}
        <Figure x={360} y={760} s={1.0} color="#0c141c" />
        <Figure x={560} y={760} s={1.25} color="#0c141c" />
        <Figure x={760} y={760} s={0.9} color="#0c141c" flip />
        {/* fire glow between prisoners and wall */}
        <circle cx={540} cy={1020} r={240} fill="url(#pfire)" />
        <polygon points="520,1080 540,980 560,1080" fill="#f6ab42" />
        <polygon points="528,1080 540,1020 552,1080" fill="#ffd98a" />
        {/* chained prisoners, backs to us, facing the wall */}
        <SeatedBack x={320} y={1300} s={1.5} />
        <SeatedBack x={540} y={1320} s={1.7} />
        <SeatedBack x={770} y={1300} s={1.5} />
        <Grain />
        {scene.label ? <Headline text={scene.label} y={1540} size={66} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'puppet') {
    // a control bar held from above, strings down to marionette figures
    return (
      <>
        <Defs />
        <RoomBG glow={[540, 520]} />
        {/* giant hand / control bar */}
        <rect x={W / 2 - 220} y={300} width="440" height="30" rx="12" fill={STONE} />
        <rect x={W / 2 - 24} y={190} width="48" height="120" rx="20" fill={STONE_SH} />
        {[-300, 0, 300].map((dx, i) => {
          const fx = W / 2 + dx;
          return (
            <g key={i}>
              <line x1={W / 2 + dx * 0.5} y1={330} x2={fx - 36} y2={930} stroke={GOLD} strokeWidth="2.5" opacity="0.7" />
              <line x1={W / 2 + dx * 0.5} y1={330} x2={fx + 36} y2={930} stroke={GOLD} strokeWidth="2.5" opacity="0.7" />
              <line x1={W / 2 + dx * 0.5} y1={330} x2={fx} y2={1130} stroke={GOLD} strokeWidth="2" opacity="0.5" />
              <Figure x={fx} y={1150} s={1.15} color="#46586a" />
            </g>
          );
        })}
        <Grain />
        {scene.label ? <Headline text={scene.label} y={1540} size={66} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'arena') {
    // spotlight cone onto theater masks; crowd watching from the dark
    return (
      <>
        <Defs />
        <rect x="0" y="0" width={W} height={H} fill="url(#psky)" />
        <polygon points="470,200 610,200 860,1120 220,1120" fill="#f4e3b8" opacity="0.1" />
        <polygon points="505,200 575,200 720,1040 360,1040" fill="#ffedc0" opacity="0.12" />
        {/* stage */}
        <rect x="150" y="1040" width={W - 300} height="40" fill={STONE_SH} />
        {/* comedy + tragedy masks */}
        <g transform="translate(430 760)">
          <ellipse cx="0" cy="0" rx="110" ry="140" fill="url(#pmarble)" />
          <path d="M -60 20 C -20 70 20 70 60 20" stroke={INK} strokeWidth="10" fill="none" strokeLinecap="round" />
          <ellipse cx="-42" cy="-30" rx="16" ry="10" fill={INK} />
          <ellipse cx="42" cy="-30" rx="16" ry="10" fill={INK} />
        </g>
        <g transform="translate(650 780)">
          <ellipse cx="0" cy="0" rx="110" ry="140" fill="#9aa6b0" />
          <path d="M -60 60 C -20 20 20 20 60 60" stroke={INK} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M -58 -34 L -26 -24 M 58 -34 L 26 -24" stroke={INK} strokeWidth="9" strokeLinecap="round" />
        </g>
        {/* crowd */}
        {[200, 340, 480, 600, 740, 880].map((x, i) => (
          <SeatedBack key={i} x={x} y={1320} s={1.1 + (i % 2) * 0.2} color="#0b1219" />
        ))}
        <Grain />
        {scene.label ? <Headline text={scene.label} y={1540} size={66} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'throne') {
    // raised throne + crown glow, cold hall
    return (
      <>
        <Defs />
        <RoomBG glow={[540, 640]} />
        {/* steps */}
        {[0, 1, 2].map((i) => (
          <rect key={i} x={W / 2 - 150 - i * 90} y={1180 + i * 50} width={300 + i * 180} height="50" fill={i % 2 ? STONE_SH : STONE} opacity={0.9} />
        ))}
        {/* throne */}
        <rect x={W / 2 - 110} y={760} width="220" height="430" rx="14" fill={STONE_SH} />
        <rect x={W / 2 - 150} y={520} width="60" height="670" rx="18" fill="url(#pstone)" />
        <rect x={W / 2 + 90} y={520} width="60" height="670" rx="18" fill="url(#pstone)" />
        <rect x={W / 2 - 150} y={520} width="300" height="60" rx="18" fill={STONE} />
        <Crown cx={W / 2} cy={460} s={1.3} />
        <circle cx={W / 2} cy={470} r={150} fill="url(#pglow)" opacity="0.8" />
        <Grain />
        {scene.label ? <Headline text={scene.label} y={250} size={66} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'bread') {
    // a hand from above dropping coins/loaves to a reaching crowd
    return (
      <>
        <Defs />
        <RoomBG glow={[540, 420]} />
        {/* hand */}
        <ellipse cx={W / 2} cy={330} rx="150" ry="90" fill={STONE} />
        <rect x={W / 2 - 30} y={210} width="60" height="130" rx="24" fill={STONE_SH} />
        {/* falling loaves/coins */}
        {[[420, 560], [560, 640], [660, 540], [500, 760], [620, 820]].map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx="30" ry="22" fill={GOLD} opacity="0.92" transform={`rotate(${i * 25} ${x} ${y})`} />
        ))}
        {/* reaching crowd */}
        {[220, 360, 500, 640, 780, 900].map((x, i) => (
          <Figure key={i} x={x} y={1310} s={1.05 + (i % 3) * 0.12} color="#0e1b26" armsUp />
        ))}
        <Grain />
        {scene.label ? <Headline text={scene.label} y={1540} size={66} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'divide') {
    // crowd split into two opposing halves across a crack; ruler watching above
    return (
      <>
        <Defs />
        <RoomBG glow={[540, 520]} />
        {/* crack in the ground */}
        <polygon points="520,1320 560,1320 600,1920 480,1920" fill={DARK} />
        <polygon points="534,1320 546,1320 560,1720 520,1720" fill="#0a1b22" />
        {/* left group (tinted red) leaning right */}
        {[180, 300, 420].map((x, i) => (
          <Figure key={'L' + i} x={x} y={1320} s={1.1 + (i % 2) * 0.15} color="#5a2420" flip />
        ))}
        {/* right group (tinted blue) leaning left */}
        {[660, 780, 900].map((x, i) => (
          <Figure key={'R' + i} x={x} y={1320} s={1.1 + (i % 2) * 0.15} color="#1d3a4e" />
        ))}
        {/* ruler on a pedestal, watching */}
        <rect x={W / 2 - 70} y={720} width="140" height="180" fill={STONE_SH} />
        <Figure x={W / 2} y={720} s={1.2} color="#0e1b26" />
        <Crown cx={W / 2} cy={520} s={0.8} />
        <Grain />
        {scene.label ? <Headline text={scene.label} y={250} size={64} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'emperor') {
    // a robed "emperor" on a dais, crowd bowing, one small child pointing (gold)
    return (
      <>
        <Defs />
        <RoomBG glow={[540, 560]} />
        <rect x={W / 2 - 220} y={1120} width="440" height="200" fill={STONE_SH} />
        {/* emperor: robe triangle + head + crown, faint (the "invisible clothes") */}
        <polygon points={`${W / 2},760 ${W / 2 - 140},1120 ${W / 2 + 140},1120`} fill="#243544" opacity="0.5" stroke={GOLD} strokeWidth="3" strokeDasharray="6 10" />
        <circle cx={W / 2} cy={720} r={46} fill="#2a3b4a" />
        <Crown cx={W / 2} cy={620} s={1.0} />
        {/* bowing crowd */}
        {[220, 340, 740, 860].map((x, i) => (
          <g key={i} transform={`translate(${x} 1300) scale(${1 + (i % 2) * 0.1})`}>
            <circle cx="0" cy="-30" r="34" fill="#0d1a24" />
            <path d="M -60 60 C -50 -16 50 -16 60 60 Z" fill="#0d1a24" />
          </g>
        ))}
        {/* the child who sees the truth */}
        <Figure x={540} y={1320} s={0.72} color={GOLD} armsUp />
        <Grain />
        {scene.label ? <Headline text={scene.label} y={250} size={64} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'silence') {
    // a lone figure (gold) ringed by a pointing mob; a crossed-out speech bubble
    return (
      <>
        <Defs />
        <RoomBG glow={[540, 820]} warm={false} />
        {/* pointing mob */}
        {[160, 300, 780, 920].map((x, i) => {
          const flip = x > W / 2;
          return (
            <g key={i}>
              <Figure x={x} y={1320} s={1.15} color="#111f2b" flip={flip} />
              {/* pointing arm toward center */}
              <line x1={x + (flip ? -46 : 46)} y1={1172} x2={W / 2 + (flip ? 90 : -90)} y2={1120} stroke={RED} strokeWidth="9" strokeLinecap="round" opacity="0.85" />
            </g>
          );
        })}
        {/* lone truth-teller */}
        <Figure x={W / 2} y={1330} s={1.3} color={GOLD} />
        {/* silenced speech bubble */}
        <g transform={`translate(${W / 2} 820)`}>
          <rect x="-150" y="-90" width="300" height="150" rx="30" fill={CREAM} />
          <polygon points="-30,55 30,55 -10,120" fill={CREAM} />
          <line x1="-96" y1="-40" x2="96" y2="30" stroke={RED} strokeWidth="18" strokeLinecap="round" />
          <line x1="96" y1="-40" x2="-96" y2="30" stroke={RED} strokeWidth="18" strokeLinecap="round" />
        </g>
        <Grain />
        {scene.label ? <Headline text={scene.label} y={250} size={64} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'scales') {
    // balance scales, heavily tilted: gold outweighs the lone citizen
    const tilt = 14;
    return (
      <>
        <Defs />
        <RoomBG glow={[540, 620]} />
        <rect x={W / 2 - 14} y={560} width="28" height="640" fill="url(#pstone)" />
        <rect x={W / 2 - 120} y={1180} width="240" height="40" rx="12" fill={STONE_SH} />
        <g transform={`rotate(${tilt} ${W / 2} 600)`}>
          <rect x={W / 2 - 300} y={588} width="600" height="18" rx="9" fill={STONE} />
          {/* left pan: heavy gold */}
          <line x1={W / 2 - 290} y1={600} x2={W / 2 - 290} y2={760} stroke={STONE} strokeWidth="5" />
          <path d={`M ${W / 2 - 370} 760 A 80 60 0 0 0 ${W / 2 - 210} 760 Z`} fill={STONE_SH} />
          {[[-330, 740], [-290, 718], [-250, 740]].map(([dx, y], i) => (
            <circle key={i} cx={W / 2 + dx} cy={y} r="24" fill={GOLD} />
          ))}
          {/* right pan: the citizen, outweighed, lifted high */}
          <line x1={W / 2 + 290} y1={600} x2={W / 2 + 290} y2={720} stroke={STONE} strokeWidth="5" />
          <path d={`M ${W / 2 + 210} 720 A 80 60 0 0 0 ${W / 2 + 370} 720 Z`} fill={STONE_SH} />
          <Figure x={W / 2 + 290} y={700} s={0.6} color="#13222e" />
        </g>
        <Grain />
        {scene.label ? <Headline text={scene.label} y={250} size={64} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'pillar') {
    // cracked, decaying columns: the rotting institution
    return (
      <>
        <Defs />
        <RoomBG glow={[320, 900]} />
        <Column x={240} top={520} broke={0.62} />
        <Column x={540} top={380} broke={1} />
        <Column x={840} top={620} broke={0.46} />
        <ellipse cx="700" cy="1360" rx="70" ry="24" fill={STONE_SH} />
        <ellipse cx="300" cy="1380" rx="54" ry="20" fill={STONE_SH} />
        <Grain />
        {scene.label ? <Headline text={scene.label} y={1560} size={66} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'quote') {
    const p = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 18});
    const lines = wrap(scene.quote ?? '', 22);
    return (
      <>
        <Defs />
        <RoomBG glow={[540, 980]} />
        <Grain />
        <g opacity={p}>
          <text x={W / 2} y="700" textAnchor="middle" fontFamily="Georgia, serif" fontSize="300"
            fill={GOLD} opacity="0.85">&#8220;</text>
          {lines.map((ln, i) => (
            <text key={i} x={W / 2} y={860 + i * 92} textAnchor="middle"
              fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight="600"
              fontSize="66" fill={CREAM}
              style={{paintOrder: 'stroke', stroke: DARK, strokeWidth: 11}}>{ln}</text>
          ))}
          {scene.author ? (
            <text x={W / 2} y={930 + lines.length * 92} textAnchor="middle" fontFamily="Georgia, serif"
              fontSize="40" fill={GOLD} letterSpacing="3"
              style={{paintOrder: 'stroke', stroke: DARK, strokeWidth: 6}}>
              {(scene.author || '').toUpperCase()}
            </text>
          ) : null}
        </g>
      </>
    );
  }

  // outro
  return (
    <>
      <Defs />
      <RoomBG glow={[540, 760]} />
      {[200, 360].map((x, i) => (
        <Column key={'ol' + i} x={x} top={440 + i * 60} base={1320} w={64 - i * 10} />
      ))}
      {[880, 720].map((x, i) => (
        <Column key={'or' + i} x={x} top={440 + i * 60} base={1320} w={64 - i * 10} />
      ))}
      <Grain />
      <Headline text={scene.label ?? ''} y={900} size={70} f={f} sub={scene.sub} />
      <g transform={`translate(${W / 2} 1260)`}>
        <rect x="-210" y="-54" width="420" height="92" rx="46" fill={GOLD} />
        <text x="0" y="8" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700"
          fontSize="46" fill={DARK}>@ceritastik</text>
      </g>
    </>
  );
};

// ---------------------------------------------------------------------------
// Subtitle (cream serif, dark stroke, gold keywords)
// ---------------------------------------------------------------------------
const groupWords = (words: ParWord[]) => {
  const groups: ParWord[][] = [];
  let cur: ParWord[] = [];
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

const Subtitle: React.FC<{words: ParWord[]; keywords: string[]}> = ({words, keywords}) => {
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
        left: 80,
        right: 80,
        top: 1360,
        textAlign: 'center',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontWeight: 700,
        fontSize: 60,
        lineHeight: 1.2,
        color: CREAM,
        WebkitTextStroke: '12px #050a10',
        paintOrder: 'stroke fill',
        transform: `scale(${interpolate(pop, [0, 1], [0.88, 1])})`,
      }}
    >
      {group.map((w, i) => (
        <span key={i} style={{color: keys.some((kk) => clean(w.text).includes(kk)) ? GOLD : CREAM}}>
          {w.text.replace(/[.,:]$/, '')}{' '}
        </span>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root: cue-driven timeline + Ken Burns move
// ---------------------------------------------------------------------------
export const ParableStory: React.FC<{
  words: ParWord[];
  scenes: ParScene[];
  keywords: string[];
}> = ({words, scenes, keywords}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const starts = scenes.map((s) => {
    if (!s.cue) return 0;
    const w = words.find((x) => clean(x.text).includes(clean(s.cue as string)));
    return w ? Math.round((w.fromMs / 1000) * fps) : null;
  });
  const timeline = scenes
    .map((s, i) => ({scene: s, from: starts[i]}))
    .filter((s): s is {scene: ParScene; from: number} => s.from !== null);
  const idx = timeline.reduce((best, s, i) => (frame >= s.from ? i : best), 0);
  const item = timeline[idx];
  const scene = item.scene;
  const end = timeline[idx + 1]?.from ?? durationInFrames;
  const f = frame - item.from;
  const len = Math.max(end - item.from, 1);

  const punch = spring({frame: f, fps, config: {damping: 16}, durationInFrames: 14});
  const zoom = interpolate(punch, [0, 1], [1.12, 1.03]) + (f / len) * 0.06;
  const panX = (idx % 2 === 0 ? 1 : -1) * interpolate(f / len, [0, 1], [-18, 18]);

  return (
    <AbsoluteFill style={{background: DARK, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translateX(${panX}px) scale(${zoom})`,
          transformOrigin: '50% 52%',
        }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <SceneArt key={scene.kind + idx} scene={scene} f={f} />
        </svg>
      </AbsoluteFill>
      <Subtitle words={words} keywords={keywords} />
    </AbsoluteFill>
  );
};
