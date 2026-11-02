// "Chronicle" template: cinematic sepia history/philosophy reels. Everything is
// drawn as SVG in a warm brown/cream palette (marble busts, Greek temples,
// battle silhouettes, ancient maps, scrolls), with film grain, vignette and a
// slow Ken Burns move. Scene cuts follow cue words in the narration, exactly
// like the stickman template.
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type ChronWord = {text: string; fromMs: number; toMs: number};
export type ChronScene = {
  kind: string; // title | bust | temple | battle | horse | map | scroll | quote | ruin | outro
  cue: string | null;
  label?: string; // headline / name / place
  sub?: string; // small supporting line (dates, era, route)
  quote?: string; // for the quote scene
  author?: string; // attribution under a quote
  points?: string[]; // up to 3 lines for the scroll scene
};

const W = 1080;
const H = 1920;

// warm sepia palette ---------------------------------------------------------
const SKY_TOP = '#241608';
const SKY_MID = '#6b4522';
const SKY_GLOW = '#c8873a';
const GROUND = '#2c1d0f';
const STONE = '#d7bd90';
const STONE_SH = '#8a6a42';
const MARBLE = '#ead9b6';
const MARBLE_SH = '#9c7c52';
const CREAM = '#f1e2bf';
const PARCH = '#e3d2a8';
const PARCH_SH = '#c3aa78';
const INK = '#3a2a18';
const GOLD = '#d7a23f';
const DARK = '#160d05';

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
// Shared atmosphere: gradient defs, dramatic sky, film grain, heavy vignette
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={SKY_TOP} />
      <stop offset="52%" stopColor={SKY_MID} />
      <stop offset="78%" stopColor={SKY_GLOW} />
      <stop offset="100%" stopColor="#7a4a22" />
    </linearGradient>
    <radialGradient id="sun" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#ffe6b0" />
      <stop offset="40%" stopColor="#f0b85c" />
      <stop offset="100%" stopColor="#c8873a" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="vig" cx="50%" cy="46%" r="72%">
      <stop offset="52%" stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#120a03" stopOpacity="0.82" />
    </radialGradient>
    <linearGradient id="parch" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#efdfb8" />
      <stop offset="55%" stopColor={PARCH} />
      <stop offset="100%" stopColor={PARCH_SH} />
    </linearGradient>
    <linearGradient id="marble" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={MARBLE} />
      <stop offset="58%" stopColor="#d5c197" />
      <stop offset="100%" stopColor={MARBLE_SH} />
    </linearGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={STONE} />
      <stop offset="100%" stopColor={STONE_SH} />
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
      <feColorMatrix in="n" type="saturate" values="0" />
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="6" /></filter>
  </defs>
);

const Grain: React.FC = () => (
  <>
    <rect x="0" y="0" width={W} height={H} fill="url(#vig)" />
    <rect x="0" y="0" width={W} height={H} filter="url(#grain)" opacity="0.07" />
  </>
);

const SkyBG: React.FC<{sun?: [number, number]}> = ({sun = [540, 1180]}) => (
  <>
    <rect x="0" y="0" width={W} height={H} fill="url(#sky)" />
    <circle cx={sun[0]} cy={sun[1]} r={620} fill="url(#sun)" />
    <rect x="0" y="1250" width={W} height={H - 1250} fill={GROUND} />
    <rect x="0" y="1250" width={W} height="60" fill="#3a2612" opacity="0.6" />
  </>
);

const ParchBG: React.FC = () => (
  <>
    <rect x="0" y="0" width={W} height={H} fill="#2a1c0e" />
    <rect x="60" y="150" width={W - 120} height={H - 300} rx="18" fill="url(#parch)" />
    <rect x="60" y="150" width={W - 120} height={H - 300} rx="18" fill="url(#grain)" opacity="0.06" />
  </>
);

// ---------------------------------------------------------------------------
// Ornaments & subjects
// ---------------------------------------------------------------------------
const Laurel: React.FC<{cx: number; cy: number; s?: number; color?: string}> = ({cx, cy, s = 1, color = GOLD}) => {
  const leaf = (side: 1 | -1) => {
    const items = [];
    for (let i = 0; i < 7; i++) {
      const a = (-70 + i * 16) * (Math.PI / 180);
      const r = 90 + i * 2;
      const lx = cx + side * Math.cos(a) * r * s * 0.7;
      const ly = cy - Math.sin(a) * r * s;
      items.push(
        <ellipse key={i} cx={lx} cy={ly} rx={26 * s} ry={11 * s} fill={color} opacity={0.9}
          transform={`rotate(${side * (20 - i * 7)} ${lx} ${ly})`} />,
      );
    }
    return items;
  };
  return (
    <g>
      {leaf(-1)}
      {leaf(1)}
    </g>
  );
};

// classical philosopher head, left-facing profile, warm-lit marble
const Bust: React.FC<{cx: number; cy: number; s?: number}> = ({cx, cy, s = 1}) => {
  // path drawn around origin (0,0) at chin, facing left; scaled + translated
  const d =
    'M 70 20 C 72 -70 60 -150 10 -205 C -30 -248 -96 -246 -120 -198 ' + // crown over to brow (left)
    'C -135 -170 -150 -150 -168 -150 C -150 -128 -150 -120 -140 -112 ' + // brow to nose bridge
    'C -175 -92 -176 -60 -150 -48 C -165 -34 -168 -14 -150 -6 ' + // nose tip + under-nose + lip
    'C -176 14 -176 70 -120 92 C -96 128 -40 132 -8 120 ' + // beard bulge
    'C 6 152 6 190 2 230 L 86 230 C 90 150 92 70 70 20 Z'; // jaw to neck down to base
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {/* plinth */}
      <polygon points="-150,232 150,232 118,430 -118,430" fill="url(#stone)" />
      <rect x="-170" y="232" width="340" height="26" fill={STONE} />
      <rect x="-170" y="232" width="340" height="26" fill={DARK} opacity="0.12" />
      {/* hair mass behind */}
      <ellipse cx="18" cy="-150" rx="120" ry="130" fill={MARBLE_SH} opacity="0.85" />
      {/* head */}
      <path d={d} fill="url(#marble)" />
      {/* shadow side (back of head/neck) */}
      <path d="M 70 20 C 90 70 90 150 86 230 L 2 230 C 6 190 6 152 -8 120 C 40 110 70 70 70 20 Z" fill={MARBLE_SH} opacity="0.5" />
      {/* curls on top */}
      {[...Array(6)].map((_, i) => (
        <circle key={i} cx={-70 + i * 34} cy={-196 + (i % 2) * 14} r={22} fill={MARBLE_SH} opacity="0.7" />
      ))}
      {/* beard curls */}
      {[...Array(5)].map((_, i) => (
        <circle key={i} cx={-110 + i * 26} cy={96 + (i % 2) * 16} r={18} fill={MARBLE_SH} opacity="0.55" />
      ))}
      {/* brow + eye */}
      <path d="M -150 -116 C -132 -122 -118 -118 -108 -110" stroke={MARBLE_SH} strokeWidth="7" fill="none" strokeLinecap="round" />
      <ellipse cx="-120" cy="-96" rx="15" ry="9" fill={MARBLE_SH} opacity="0.6" />
    </g>
  );
};

// a row of Doric columns + architrave + pediment
const Temple: React.FC = () => {
  const cols = [120, 290, 460, 630, 800, 970];
  return (
    <g>
      {/* pediment */}
      <polygon points="80,560 540,420 1000,560" fill="url(#stone)" />
      <polygon points="80,560 540,420 1000,560" fill={DARK} opacity="0.1" />
      {/* architrave */}
      <rect x="80" y="560" width="920" height="70" fill={STONE} />
      <rect x="80" y="630" width="920" height="24" fill={STONE_SH} />
      {/* columns */}
      {cols.map((x, i) => (
        <g key={i}>
          <rect x={x - 46} y="654" width="92" height="30" fill={STONE_SH} />
          {[...Array(7)].map((_, k) => (
            <rect key={k} x={x - 34 + k * 10} y="684" width="6" height="566" fill={DARK} opacity="0.18" />
          ))}
          <rect x={x - 38} y="684" width="76" height="566" fill="url(#stone)" />
          <rect x={x - 50} y="1250" width="100" height="26" fill={STONE_SH} />
        </g>
      ))}
    </g>
  );
};

// crested hoplite silhouette on a ridge
const Hoplite: React.FC<{x: number; y: number; s?: number; flip?: boolean}> = ({x, y, s = 1, flip = false}) => (
  <g transform={`translate(${x} ${y}) scale(${(flip ? -s : s)} ${s})`} fill={DARK}>
    {/* spear */}
    <rect x="48" y="-360" width="9" height="360" />
    <polygon points="52,-372 44,-348 61,-348" />
    {/* legs */}
    <rect x="-22" y="-120" width="18" height="120" />
    <rect x="6" y="-120" width="18" height="120" />
    {/* torso */}
    <rect x="-28" y="-250" width="56" height="140" rx="10" />
    {/* shield */}
    <circle cx="-34" cy="-180" r="52" />
    <circle cx="-34" cy="-180" r="52" fill="none" stroke={STONE_SH} strokeWidth="5" opacity="0.5" />
    {/* head + corinthian helmet with crest */}
    <circle cx="0" cy="-280" r="26" />
    <path d="M -16 -306 C -6 -342 30 -342 40 -300 C 20 -312 0 -312 -16 -306 Z" />
  </g>
);

// Trojan horse silhouette on a wheeled platform
const TrojanHorse: React.FC<{cx: number; cy: number; s?: number}> = ({cx, cy, s = 1}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`} fill={DARK}>
    {/* platform + wheels */}
    <rect x="-300" y="150" width="600" height="40" />
    <circle cx="-210" cy="214" r="46" />
    <circle cx="-70" cy="214" r="46" />
    <circle cx="70" cy="214" r="46" />
    <circle cx="210" cy="214" r="46" />
    {/* legs */}
    <rect x="-200" y="20" width="40" height="130" />
    <rect x="-90" y="20" width="40" height="130" />
    <rect x="70" y="20" width="40" height="130" />
    <rect x="180" y="20" width="40" height="130" />
    {/* body */}
    <path d="M -270 40 C -280 -60 -180 -110 -40 -110 L 170 -110 C 250 -110 280 -40 270 40 Z" />
    {/* neck + head */}
    <path d="M 180 -100 C 250 -170 300 -200 330 -150 C 360 -120 360 -70 320 -40 L 250 -40 C 210 -60 190 -80 180 -100 Z" />
    <polygon points="330,-168 352,-210 360,-166" />
    <polygon points="352,-168 376,-206 380,-164" />
  </g>
);

// aged map card with coastline, a dotted route, star marker, compass
const MapArt: React.FC<{label?: string; sub?: string}> = ({label, sub}) => (
  <g>
    <rect x="110" y="360" width={W - 220} height="1120" rx="12" fill="url(#parch)" />
    <rect x="110" y="360" width={W - 220} height="1120" rx="12" fill="url(#grain)" opacity="0.05" />
    {/* sea contour lines */}
    {[...Array(7)].map((_, i) => (
      <path key={i} d={`M 150 ${520 + i * 120} C 400 ${480 + i * 120}, 700 ${560 + i * 120}, 930 ${500 + i * 120}`}
        fill="none" stroke={PARCH_SH} strokeWidth="2" opacity="0.5" />
    ))}
    {/* land masses */}
    <path d="M 180 760 C 300 680, 520 700, 600 820 C 660 910, 520 980, 420 960 C 300 940, 160 900, 180 760 Z"
      fill={STONE_SH} opacity="0.75" />
    <path d="M 640 1040 C 760 980, 900 1020, 910 1140 C 915 1240, 780 1280, 700 1230 C 620 1180, 600 1090, 640 1040 Z"
      fill={STONE_SH} opacity="0.7" />
    {/* dotted route */}
    <path d="M 420 880 C 540 980, 620 1040, 760 1120" fill="none" stroke="#9a3b1e" strokeWidth="6"
      strokeLinecap="round" strokeDasharray="4 26" />
    {/* markers */}
    <g transform="translate(420 880)" fill="#9a3b1e">
      <circle r="12" />
    </g>
    <g transform="translate(760 1120)" fill="#9a3b1e">
      <polygon points="0,-24 7,-7 26,-7 11,4 17,22 0,11 -17,22 -11,4 -26,-7 -7,-7" />
    </g>
    {/* compass rose */}
    <g transform="translate(830 500)" stroke={INK} fill={INK} opacity="0.75">
      <circle r="42" fill="none" strokeWidth="3" />
      <polygon points="0,-40 9,0 0,40 -9,0" fill={INK} />
      <polygon points="-40,0 0,9 40,0 0,-9" fill={INK} opacity="0.5" />
    </g>
    {label ? (
      <text x={W / 2} y="440" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700"
        fontSize="54" fill={INK} letterSpacing="2">{label.toUpperCase()}</text>
    ) : null}
    {sub ? (
      <text x={W / 2} y="1420" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic"
        fontSize="34" fill={STONE_SH}>{sub}</text>
    ) : null}
  </g>
);

// broken column ruins
const Ruins: React.FC = () => (
  <g>
    {[
      {x: 230, h: 560, broke: 0.62},
      {x: 540, h: 760, broke: 1},
      {x: 850, h: 460, broke: 0.48},
    ].map((c, i) => {
      const top = 1250 - c.h * c.broke;
      return (
        <g key={i}>
          <rect x={c.x - 46} y="1250" width="92" height="20" fill={STONE_SH} />
          {[...Array(6)].map((_, k) => (
            <rect key={k} x={c.x - 30 + k * 11} y={top} width="6" height={1250 - top} fill={DARK} opacity="0.16" />
          ))}
          <rect x={c.x - 34} y={top} width="68" height={1250 - top} fill="url(#stone)" />
          {c.broke < 1 ? (
            <polygon points={`${c.x - 34},${top} ${c.x + 34},${top} ${c.x + 20},${top - 22} ${c.x - 24},${top - 8}`}
              fill={STONE_SH} />
          ) : (
            <>
              <rect x={c.x - 46} y={top - 26} width="92" height="26" fill={STONE_SH} />
              <rect x={c.x - 40} y={top - 44} width="80" height="20" fill={STONE} />
            </>
          )}
        </g>
      );
    })}
    {/* a toppled drum on the ground */}
    <ellipse cx="700" cy="1340" rx="70" ry="26" fill={STONE_SH} />
  </g>
);

// ---------------------------------------------------------------------------
// Headline block that reveals on scene entry
// ---------------------------------------------------------------------------
const Headline: React.FC<{text: string; y: number; size?: number; f: number; sub?: string}> = ({
  text,
  y,
  size = 74,
  f,
  sub,
}) => {
  const {fps} = useVideoConfig();
  const p = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 16});
  const lines = wrap(text.toUpperCase(), 18);
  return (
    <g opacity={p} transform={`translate(0 ${interpolate(p, [0, 1], [26, 0])})`}>
      {lines.map((ln, i) => (
        <text key={i} x={W / 2} y={y + i * (size + 10)} textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif" fontWeight="700" fontSize={size}
          fill={CREAM} letterSpacing="3"
          style={{paintOrder: 'stroke', stroke: DARK, strokeWidth: 10}}>
          {ln}
        </text>
      ))}
      <rect x={W / 2 - 90} y={y + lines.length * (size + 10) - 24} width="180" height="5" fill={GOLD} />
      {sub ? (
        <text x={W / 2} y={y + lines.length * (size + 10) + 44} textAnchor="middle"
          fontFamily="Georgia, serif" fontStyle="italic" fontSize="38" fill={GOLD}
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
const SceneArt: React.FC<{scene: ChronScene; f: number}> = ({scene, f}) => {
  const {fps} = useVideoConfig();
  const k = scene.kind;

  if (k === 'title') {
    return (
      <>
        <Defs />
        <SkyBG sun={[540, 980]} />
        <Temple />
        <Grain />
        <Laurel cx={W / 2} cy={760} s={1.1} />
        <Headline text={scene.label ?? ''} y={1120} size={92} f={f} sub={scene.sub} />
      </>
    );
  }

  if (k === 'bust') {
    return (
      <>
        <Defs />
        <SkyBG sun={[730, 760]} />
        <Grain />
        <Bust cx={520} cy={880} s={1.5} />
        <Headline text={scene.label ?? ''} y={1480} size={78} f={f} sub={scene.sub} />
      </>
    );
  }

  if (k === 'temple') {
    return (
      <>
        <Defs />
        <SkyBG sun={[540, 900]} />
        <Temple />
        <Grain />
        {scene.label ? <Headline text={scene.label} y={1500} size={70} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'battle') {
    return (
      <>
        <Defs />
        <SkyBG sun={[760, 1120]} />
        {/* ridge */}
        <path d="M 0 1250 L 300 1180 L 620 1240 L 1080 1160 L 1080 1920 L 0 1920 Z" fill={GROUND} />
        <Hoplite x={250} y={1250} s={1.15} />
        <Hoplite x={470} y={1240} s={0.95} />
        <Hoplite x={690} y={1250} s={1.25} flip />
        <Hoplite x={900} y={1230} s={0.85} flip />
        <Grain />
        {scene.label ? <Headline text={scene.label} y={1540} size={70} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'horse') {
    return (
      <>
        <Defs />
        <SkyBG sun={[540, 1000]} />
        <TrojanHorse cx={560} cy={960} s={1.25} />
        <Grain />
        {scene.label ? <Headline text={scene.label} y={1560} size={70} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'ruin') {
    return (
      <>
        <Defs />
        <SkyBG sun={[300, 1080]} />
        <Ruins />
        <Grain />
        {scene.label ? <Headline text={scene.label} y={1560} size={70} f={f} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'map') {
    return (
      <>
        <Defs />
        <MapArt label={scene.label} sub={scene.sub} />
        <Grain />
      </>
    );
  }

  if (k === 'scroll') {
    const pts = scene.points ?? [];
    return (
      <>
        <Defs />
        <ParchBG />
        {/* rolled ends */}
        <rect x="70" y="520" width="940" height="60" rx="30" fill={PARCH_SH} />
        <rect x="70" y="1380" width="940" height="60" rx="30" fill={PARCH_SH} />
        <Grain />
        {scene.label ? (
          <g>
            {wrap(scene.label.toUpperCase(), 16).map((ln, i) => (
              <text key={i} x={W / 2} y={720 + i * 86} textAnchor="middle" fontFamily="Georgia, serif"
                fontWeight="700" fontSize="72" fill={INK} letterSpacing="2">{ln}</text>
            ))}
            <rect x={W / 2 - 80} y={760} width="160" height="4" fill={GOLD} />
          </g>
        ) : null}
        {pts.map((p, i) => (
          <text key={i} x={W / 2} y={940 + i * 130} textAnchor="middle" fontFamily="Georgia, serif"
            fontSize="46" fill={STONE_SH}>{p}</text>
        ))}
      </>
    );
  }

  if (k === 'quote') {
    const p = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 18});
    const lines = wrap(scene.quote ?? '', 22);
    return (
      <>
        <Defs />
        <SkyBG sun={[540, 1300]} />
        <Grain />
        <g opacity={p}>
          <text x={W / 2} y="720" textAnchor="middle" fontFamily="Georgia, serif" fontSize="300"
            fill={GOLD} opacity="0.85">&#8220;</text>
          {lines.map((ln, i) => (
            <text key={i} x={W / 2} y={880 + i * 92} textAnchor="middle"
              fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight="600"
              fontSize="68" fill={CREAM}
              style={{paintOrder: 'stroke', stroke: DARK, strokeWidth: 10}}>{ln}</text>
          ))}
          {scene.author ? (
            <text x={W / 2} y={940 + lines.length * 92} textAnchor="middle" fontFamily="Georgia, serif"
              fontSize="42" fill={GOLD} letterSpacing="3"
              style={{paintOrder: 'stroke', stroke: DARK, strokeWidth: 6}}>
              &#8212;&nbsp;{(scene.author || '').toUpperCase()}
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
      <SkyBG sun={[540, 1020]} />
      <Ruins />
      <Grain />
      <Laurel cx={W / 2} cy={760} s={1} />
      <Headline text={scene.label ?? ''} y={1120} size={76} f={f} />
      <g transform={`translate(${W / 2} 1360)`}>
        <rect x="-210" y="-54" width="420" height="92" rx="46" fill={GOLD} />
        <text x="0" y="8" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700"
          fontSize="46" fill={DARK}>@ceritastik</text>
      </g>
    </>
  );
};

// ---------------------------------------------------------------------------
// Subtitle (cream serif, brown stroke, gold keywords)
// ---------------------------------------------------------------------------
const groupWords = (words: ChronWord[]) => {
  const groups: ChronWord[][] = [];
  let cur: ChronWord[] = [];
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

const Subtitle: React.FC<{words: ChronWord[]; keywords: string[]}> = ({words, keywords}) => {
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
        left: 60,
        right: 60,
        top: 1650,
        textAlign: 'center',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontWeight: 700,
        fontSize: 70,
        lineHeight: 1.2,
        color: CREAM,
        WebkitTextStroke: '12px #241509',
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
export const ChronicleStory: React.FC<{
  words: ChronWord[];
  scenes: ChronScene[];
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
    .filter((s): s is {scene: ChronScene; from: number} => s.from !== null);
  const idx = timeline.reduce((best, s, i) => (frame >= s.from ? i : best), 0);
  const item = timeline[idx];
  const scene = item.scene;
  const end = timeline[idx + 1]?.from ?? durationInFrames;
  const f = frame - item.from;
  const len = Math.max(end - item.from, 1);

  // slow Ken Burns: punch-in on cut, then drift; alternate pan direction
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
