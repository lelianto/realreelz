// "Collage" template: torn-paper / scrapbook documentary reels — the trending
// AI history-geopolitics look (kraft + terracotta paper, torn newspaper strips,
// paper cut-out illustrations with white edges + drop shadow, hand-drawn red
// pen scribbles, red torn date tags, and bold block-highlight captions).
// Everything is drawn as SVG + DOM; scene cuts follow cue words in the
// narration exactly like the chronicle/stickman templates. When there is no
// narration yet (preview), scenes are spread evenly so the look is still
// visible in the Studio.
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type CollageWord = {text: string; fromMs: number; toMs: number};
export type CollageScene = {
  // kind: title | map | burst | object | outro
  kind: string;
  cue: string | null;
  label?: string; // headline (shown big, not the live caption)
  sub?: string; // small supporting line (place / era)
  tag?: string; // red torn date/number label, e.g. "1960"
  subject?: string; // for "object": drop | ship | globe | strait | watch
  bg?: string; // scene background: kraft | terra | news | olive
};

const W = 1080;
const H = 1920;

// paper palette --------------------------------------------------------------
const KRAFT = '#c6a875';
const KRAFT_SH = '#9c8154';
const OLIVE = '#b1a06d';
const TERRA = '#bf6650';
const TERRA_SH = '#9a4c3a';
const NEWS = '#e9e3d2';
const NEWS_SH = '#cfc6ad';
const PAPER = '#f4efe2'; // cut-out white edge
const INK = '#26211b';
const RED = '#b23a2c';
const REDPEN = '#bb3326';
const NAVY = '#4f7ba6';
const NAVY_LT = '#7ea8cd';
const GOLD = '#e0b03e';
const STEEL = '#3d4450';

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const bgColor = (b?: string) =>
  b === 'terra' ? TERRA : b === 'news' ? NEWS : b === 'olive' ? OLIVE : KRAFT;
const bgShade = (b?: string) =>
  b === 'terra' ? TERRA_SH : b === 'news' ? NEWS_SH : b === 'olive' ? '#8f8052' : KRAFT_SH;

// deterministic pseudo-random for torn edges / jitter ------------------------
const rand = (seed: number) => {
  const x = Math.sin(seed * 999.13) * 43758.5453;
  return x - Math.floor(x);
};

// a jagged torn horizontal edge across the full width at baseline `y`.
// `dir` = +1 fills downward (strip hangs from top), -1 fills upward.
const tornStrip = (y: number, h: number, dir: 1 | -1, seed: number) => {
  const steps = 26;
  const pts: string[] = [];
  const edge = dir === 1 ? y + h : y - h;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const jag = (rand(seed + i) - 0.5) * 34 + (rand(seed + i * 7) - 0.5) * 14;
    pts.push(`${x.toFixed(0)},${(edge + jag).toFixed(1)}`);
  }
  const base = dir === 1 ? `${W},${y} 0,${y}` : `${W},${y} 0,${y}`;
  return `${pts.join(' ')} ${base}`;
};

// ---------------------------------------------------------------------------
// Shared defs: paper grain, soft drop shadow, gradients
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    {/* NOTE: no SVG blur/dropshadow filters here on purpose — feTurbulence and
        feDropShadow accumulate GPU memory across Remotion's long seek render and
        make random frames time out. Depth is done with filter-free offset
        copies instead. */}
    <radialGradient id="cvig" cx="50%" cy="46%" r="75%">
      <stop offset="55%" stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#180f06" stopOpacity="0.5" />
    </radialGradient>
  </defs>
);

// torn newspaper strips top & bottom, over a flat paper field
const PaperBG: React.FC<{bg?: string; seed?: number}> = ({bg, seed = 3}) => (
  <>
    <rect x="0" y="0" width={W} height={H} fill={bgColor(bg)} />
    {/* top newspaper strip */}
    <polygon points={tornStrip(0, 300, 1, seed)} fill={NEWS} />
    <Newsprint y={34} />
    {/* bottom newspaper strip */}
    <polygon points={tornStrip(H, 300, -1, seed + 50)} fill={NEWS} />
    <Newsprint y={H - 250} faint />
    {/* subtle shadow under the top tear */}
    <rect x="0" y="286" width={W} height="26" fill={bgShade(bg)} opacity="0.4" />
  </>
);

// fake newspaper text lines (for the torn strips)
const Newsprint: React.FC<{y: number; faint?: boolean}> = ({y, faint}) => (
  <g opacity={faint ? 0.35 : 0.6}>
    {[...Array(5)].map((_, r) => (
      <g key={r}>
        {[...Array(3)].map((_, c) => {
          const colW = (W - 120) / 3;
          const x = 50 + c * colW;
          const lw = colW - 30 - rand(r * 3 + c) * 40;
          return (
            <rect key={c} x={x} y={y + r * 34} width={lw} height="7" rx="3"
              fill={INK} opacity={0.5} />
          );
        })}
      </g>
    ))}
    <rect x="50" y={y - 22} width="300" height="14" rx="4" fill={INK} opacity="0.7" />
  </g>
);

const Grain: React.FC = () => (
  <>
    <rect x="0" y="0" width={W} height={H} fill="url(#cvig)" />
  </>
);

// ---------------------------------------------------------------------------
// Cut-out wrapper: a white torn paper backing + drop shadow behind a shape.
// Pass a silhouette path (drawn around the same origin) to get the border.
// ---------------------------------------------------------------------------
const CutOut: React.FC<{children: React.ReactNode}> = ({children}) => (
  <g>{children}</g>
);

// red pen scribble: loose overlapping ellipse loops
const Scribble: React.FC<{cx: number; cy: number; rx: number; ry: number; s?: number}> = ({
  cx,
  cy,
  rx,
  ry,
  s = 1,
}) => (
  <g transform={`translate(${cx} ${cy})`} fill="none" stroke={REDPEN} strokeWidth={7 * s}
    strokeLinecap="round" opacity="0.9">
    {[0, 1, 2].map((i) => (
      <ellipse key={i} cx={i * 6 - 6} cy={i * 3 - 3} rx={rx - i * 4} ry={ry - i * 3}
        transform={`rotate(${-12 + i * 5})`} />
    ))}
  </g>
);

// a small underline squiggle (red pen)
const Squiggle: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => {
  const pts: string[] = [];
  const n = Math.max(4, Math.round(w / 26));
  for (let i = 0; i <= n; i++) {
    pts.push(`${x + (i / n) * w},${y + (i % 2 === 0 ? 0 : -12)}`);
  }
  return <polyline points={pts.join(' ')} fill="none" stroke={REDPEN} strokeWidth="6"
    strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />;
};

// red torn-paper date/number tag
const RedTag: React.FC<{cx: number; cy: number; text: string; s?: number}> = ({cx, cy, text, s = 1}) => {
  const w = 80 + text.length * 72 * s;
  const pts = `${-w / 2 - 10},${-70 * s} ${w / 2},${-78 * s} ${w / 2 + 12},${64 * s} ${-w / 2},${74 * s}`;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(-5)`}>
      {/* filter-free offset shadow */}
      <polygon points={pts} fill="#1c140c" opacity="0.32" transform="translate(6 12)" />
      <polygon points={pts} fill={RED} />
      <text x="0" y={26 * s} textAnchor="middle" fontFamily="'Arial Black', Arial, sans-serif"
        fontWeight="900" fontSize={108 * s} fill={PAPER} letterSpacing="2">{text}</text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Paper cut-out subjects
// ---------------------------------------------------------------------------
const OilDrop: React.FC<{cx: number; cy: number; s?: number}> = ({cx, cy, s = 1}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`}>
    <CutOut>
      <path d="M 0 -210 C 70 -90 150 -20 150 90 C 150 200 70 250 0 250 C -70 250 -150 200 -150 90 C -150 -20 -70 -90 0 -210 Z"
        fill={PAPER} transform="scale(1.12)" />
      <path d="M 0 -210 C 70 -90 150 -20 150 90 C 150 200 70 250 0 250 C -70 250 -150 200 -150 90 C -150 -20 -70 -90 0 -210 Z"
        fill={INK} />
      <path d="M -40 -70 C -92 0 -96 90 -58 150" fill="none" stroke={PAPER} strokeWidth="18"
        strokeLinecap="round" opacity="0.85" />
    </CutOut>
  </g>
);

// stylised strait: two navy paper banks with a pale channel between them
const Strait: React.FC<{cx: number; cy: number; s?: number}> = ({cx, cy, s = 1}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`}>
    <CutOut>
      <path d="M -260 -120 C -120 -150 120 -90 260 -120 L 260 -40 C 120 -70 -120 -20 -260 -40 Z"
        fill={PAPER} transform="translate(0 -6) scale(1.06 1.2)" />
      <path d="M -260 -120 C -120 -150 120 -90 260 -120 L 260 -40 C 120 -70 -120 -20 -260 -40 Z" fill={NAVY} />
      <path d="M -260 40 C -120 20 120 70 260 40 L 260 120 C 120 150 -120 90 -260 120 Z"
        fill={PAPER} transform="translate(0 6) scale(1.06 1.2)" />
      <path d="M -260 40 C -120 20 120 70 260 40 L 260 120 C 120 150 -120 90 -260 120 Z" fill={NAVY} />
      <path d="M -230 -30 C -90 -46 110 -8 240 -26" fill="none" stroke={NAVY_LT} strokeWidth="12"
        strokeLinecap="round" opacity="0.7" />
      <path d="M -230 54 C -90 38 110 76 240 58" fill="none" stroke={NAVY_LT} strokeWidth="12"
        strokeLinecap="round" opacity="0.7" />
    </CutOut>
  </g>
);

// cargo ship cut-out
const CargoShip: React.FC<{cx: number; cy: number; s?: number; flip?: boolean}> = ({cx, cy, s = 1, flip}) => (
  <g transform={`translate(${cx} ${cy}) scale(${(flip ? -s : s)} ${s})`}>
    <CutOut>
      {/* hull */}
      <path d="M -220 40 L 230 40 L 180 150 L -170 150 Z" fill={STEEL} transform="scale(1.06)" />
      <path d="M -220 40 L 230 40 L 180 150 L -170 150 Z" fill={RED} />
      {/* deck line */}
      <rect x="-220" y="24" width="450" height="22" fill={PAPER} />
      {/* containers */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={-200 + i * 86} y={-44} width="72" height="66"
          fill={[GOLD, NAVY, PAPER, TERRA, OLIVE][i % 5]} stroke={INK} strokeWidth="3" />
      ))}
      {[0, 1, 2].map((i) => (
        <rect key={'t' + i} x={-160 + i * 86} y={-104} width="72" height="60"
          fill={[NAVY, GOLD, TERRA][i % 3]} stroke={INK} strokeWidth="3" />
      ))}
      {/* bridge */}
      <rect x="150" y="-90" width="60" height="112" fill={PAPER} stroke={INK} strokeWidth="3" />
    </CutOut>
  </g>
);

// paper globe
const Globe: React.FC<{cx: number; cy: number; s?: number}> = ({cx, cy, s = 1}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`}>
    <CutOut>
      <circle r="168" fill={PAPER} />
      <circle r="150" fill={NAVY} />
      <path d="M -120 -60 C -60 -90 0 -40 40 -70 C 80 -100 120 -60 110 -10 C 60 -30 30 10 -10 0 C -60 -14 -90 -20 -120 -60 Z"
        fill="#6fa06a" />
      <path d="M -70 60 C -20 40 60 60 100 92 C 60 120 -10 130 -70 110 C -96 96 -96 76 -70 60 Z"
        fill="#6fa06a" />
    </CutOut>
  </g>
);

// an antique pocket watch (time / history motif)
const Watch: React.FC<{cx: number; cy: number; s?: number}> = ({cx, cy, s = 1}) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`}>
    <CutOut>
      <circle r="176" fill={PAPER} />
      <circle r="150" fill={GOLD} />
      <circle r="124" fill={NEWS} stroke={INK} strokeWidth="5" />
      {[...Array(12)].map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <rect key={i} x={-4} y={-118} width="8" height="20" fill={INK}
          transform={`rotate(${(i / 12) * 360}) `} style={{transformOrigin: '0 0'}} />;
      })}
      <line x1="0" y1="0" x2="0" y2="-80" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      <line x1="0" y1="0" x2="58" y2="30" stroke={INK} strokeWidth="7" strokeLinecap="round" />
      <circle r="12" fill={INK} />
      <rect x="-22" y="-210" width="44" height="40" rx="10" fill={GOLD} />
      <circle cx="0" cy="-214" r="22" fill={GOLD} stroke={INK} strokeWidth="4" />
    </CutOut>
  </g>
);

// old map card with coastline + red circle annotation
const MapCard: React.FC<{seed?: number}> = ({seed = 11}) => (
  <g>
    <g>
      <rect x="120" y="470" width={W - 240} height="980" rx="8" fill={PAPER} />
      <rect x="140" y="490" width={W - 280} height="940" fill="#ddd3ba" />
      {/* sea hatch */}
      {[...Array(8)].map((_, i) => (
        <path key={i} d={`M 170 ${560 + i * 110} C 420 ${520 + i * 110}, 700 ${600 + i * 110}, 910 ${540 + i * 110}`}
          fill="none" stroke={NAVY} strokeWidth="2.5" opacity="0.35" />
      ))}
      {/* archipelago land masses */}
      <path d="M 220 760 C 360 690, 540 710, 620 820 C 690 915, 540 985, 430 965 C 320 945, 200 900, 220 760 Z"
        fill="#b7a06a" stroke="#8a744a" strokeWidth="3" />
      <path d="M 660 1020 C 780 960, 900 1000, 905 1120 C 908 1215, 790 1255, 710 1210 C 630 1165, 620 1070, 660 1020 Z"
        fill="#b7a06a" stroke="#8a744a" strokeWidth="3" />
      <path d="M 300 1180 C 360 1150, 440 1170, 450 1230 C 455 1285, 380 1300, 330 1270 C 290 1245, 270 1205, 300 1180 Z"
        fill="#b7a06a" stroke="#8a744a" strokeWidth="3" />
      {/* red annotation circle on a focal point */}
    </g>
    <Scribble cx={560} cy={880} rx={150} ry={120} s={1.1} />
  </g>
);

// starburst of tension: gold paper star + radiating arrows & lightning
const Arrow: React.FC<{angle: number; len: number; color: string; dashed?: boolean}> = ({angle, len, color, dashed}) => (
  <g transform={`rotate(${angle})`}>
    {dashed ? (
      <line x1="150" y1="0" x2={len - 44} y2="0" stroke={color} strokeWidth="14"
        strokeDasharray="30 26" strokeLinecap="round" />
    ) : (
      <line x1="150" y1="0" x2={len - 44} y2="0" stroke={color} strokeWidth="22" strokeLinecap="round" />
    )}
    <polygon points={`${len},0 ${len - 50},-34 ${len - 50},34`} fill={color} />
  </g>
);

const Lightning: React.FC<{angle: number; len: number}> = ({angle, len}) => (
  <g transform={`rotate(${angle}) translate(150 0)`}>
    <polygon
      points={`0,-30 ${len * 0.5},-14 ${len * 0.34},-2 ${len},18 ${len * 0.42},6 ${len * 0.55},22 0,30`}
      fill={GOLD} stroke={INK} strokeWidth="3" transform="scale(1,1)" />
  </g>
);

const Burst: React.FC<{f: number; fps: number}> = ({f, fps}) => {
  const grow = spring({frame: f, fps, config: {damping: 16}, durationInFrames: 20});
  return (
    <g transform={`translate(${W / 2} 960)`}>
      <g>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) =>
          i % 2 === 0 ? (
            <Arrow key={a} angle={a + 11} len={430} color={i % 4 === 0 ? INK : RED} dashed={i % 4 === 0} />
          ) : (
            <Lightning key={a} angle={a + 11} len={360} />
          ),
        )}
        {[22, 112, 202, 292].map((a) => (
          <Arrow key={'r' + a} angle={a} len={360} color={RED} dashed />
        ))}
      </g>
      {/* central paper star */}
      <g transform={`scale(${interpolate(grow, [0, 1], [0.3, 1])}) rotate(${interpolate(grow, [0, 1], [-40, 0])})`}
       >
        <polygon
          points={starPts(9, 150, 66)}
          fill={PAPER} />
        <polygon points={starPts(9, 132, 56)} fill={GOLD} stroke={INK} strokeWidth="4" />
      </g>
    </g>
  );
};

function starPts(spikes: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}

// ---------------------------------------------------------------------------
// Big headline (taped paper label look), reveals on scene entry
// ---------------------------------------------------------------------------
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

const Headline: React.FC<{text: string; y: number; f: number; size?: number; sub?: string}> = ({
  text,
  y,
  f,
  size = 92,
  sub,
}) => {
  const {fps} = useVideoConfig();
  const p = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 14});
  const lines = wrap(text, 15);
  return (
    <g opacity={p} transform={`translate(0 ${interpolate(p, [0, 1], [30, 0])})`}>
      {lines.map((ln, i) => {
        const lw = ln.length * size * 0.58 + 44;
        const cy = y + i * (size + 26);
        const rot = (rand(i + 1) - 0.5) * 3;
        return (
          <g key={i} transform={`rotate(${rot} ${W / 2} ${cy})`}>
            <rect x={W / 2 - lw / 2 + 5} y={cy - size * 0.78 + 9} width={lw} height={size + 12} rx="6"
              fill="#1c140c" opacity="0.3" />
            <rect x={W / 2 - lw / 2} y={cy - size * 0.78} width={lw} height={size + 12} rx="6"
              fill={INK} />
            <text x={W / 2} y={cy} textAnchor="middle" fontFamily="'Arial Black', Arial, sans-serif"
              fontWeight="900" fontSize={size} fill={PAPER} letterSpacing="1">{ln}</text>
          </g>
        );
      })}
      {sub ? (
        <text x={W / 2} y={y + lines.length * (size + 26) - 4} textAnchor="middle"
          fontFamily="Georgia, serif" fontStyle="italic" fontSize="40" fill={INK}
          opacity="0.82">{sub}</text>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// One scene (full-frame SVG)
// ---------------------------------------------------------------------------
const SceneArt: React.FC<{scene: CollageScene; f: number}> = ({scene, f}) => {
  const {fps} = useVideoConfig();
  const k = scene.kind;

  if (k === 'title') {
    return (
      <>
        <Defs />
        <PaperBG bg={scene.bg ?? 'kraft'} seed={5} />
        <Strait cx={W / 2} cy={760} s={1.15} />
        <Grain />
        <Headline text={scene.label ?? ''} y={1180} f={f} size={104} sub={scene.sub} />
        {scene.tag ? <RedTag cx={840} cy={520} text={scene.tag} s={0.7} /> : null}
      </>
    );
  }

  if (k === 'map') {
    return (
      <>
        <Defs />
        <PaperBG bg={scene.bg ?? 'olive'} seed={9} />
        <MapCard />
        <Grain />
        {scene.tag ? <RedTag cx={320} cy={640} text={scene.tag} s={0.82} /> : null}
        {scene.label ? <Headline text={scene.label} y={1620} f={f} size={76} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'burst') {
    return (
      <>
        <Defs />
        <PaperBG bg={scene.bg ?? 'news'} seed={13} />
        <Globe cx={210} cy={470} s={0.62} />
        <Globe cx={880} cy={1500} s={0.62} />
        <CargoShip cx={860} cy={520} s={0.5} />
        <Burst f={f} fps={fps} />
        <Grain />
        {scene.label ? <Headline text={scene.label} y={1640} f={f} size={74} sub={scene.sub} /> : null}
      </>
    );
  }

  if (k === 'outro') {
    return (
      <>
        <Defs />
        <PaperBG bg={scene.bg ?? 'terra'} seed={21} />
        <Globe cx={W / 2} cy={760} s={1.1} />
        <Grain />
        <Headline text={scene.label ?? 'Follow buat part 2'} y={1240} f={f} size={86} />
        <g transform={`translate(${W / 2} 1480) rotate(-3)`}>
          <rect x="-250" y="-58" width="500" height="104" rx="12" fill={INK} />
          <text x="0" y="12" textAnchor="middle" fontFamily="'Arial Black', Arial, sans-serif"
            fontWeight="900" fontSize="58" fill={PAPER}>@ceritastik</text>
        </g>
      </>
    );
  }

  // object scene: one big cut-out subject
  const subj = scene.subject ?? 'drop';
  const Subject =
    subj === 'ship' ? <CargoShip cx={W / 2} cy={840} s={1.2} />
    : subj === 'globe' ? <Globe cx={W / 2} cy={820} s={1.5} />
    : subj === 'strait' ? <Strait cx={W / 2} cy={840} s={1.5} />
    : subj === 'watch' ? <Watch cx={W / 2} cy={820} s={1.5} />
    : <OilDrop cx={W / 2} cy={760} s={1.1} />;
  return (
    <>
      <Defs />
      <PaperBG bg={scene.bg ?? 'terra'} seed={17} />
      {Subject}
      {subj === 'drop' ? <path d="M 350 650 C 300 740 320 860 400 920" fill="none"
        stroke={INK} strokeWidth="6" opacity="0.6" /> : null}
      <Grain />
      {scene.tag ? <RedTag cx={820} cy={520} text={scene.tag} s={0.72} /> : null}
      {scene.label ? <Headline text={scene.label} y={1560} f={f} size={82} sub={scene.sub} /> : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// Block-highlight caption — the signature look (bold white words on dark
// sticker boxes, grouped 2-3 words per line, keyword boxes tinted).
// ---------------------------------------------------------------------------
const groupWords = (words: CollageWord[]) => {
  const groups: CollageWord[][] = [];
  let cur: CollageWord[] = [];
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

const Caption: React.FC<{words: CollageWord[]; keywords: string[]}> = ({words, keywords}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const groups = groupWords(words);
  const gi = groups.findIndex(
    (g, i) => ms >= g[0].fromMs && ms < (groups[i + 1]?.[0].fromMs ?? g[g.length - 1].toMs + 500),
  );
  if (gi < 0) return null;
  const group = groups[gi];
  const startF = (group[0].fromMs / 1000) * fps;
  const pop = spring({frame: frame - startF, fps, config: {damping: 12}, durationInFrames: 7});
  const keys = keywords.map(clean);
  return (
    <div
      style={{
        position: 'absolute',
        left: 50,
        right: 50,
        top: 1300,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px 10px',
        transform: `scale(${interpolate(pop, [0, 1], [0.82, 1])})`,
        transformOrigin: '50% 50%',
      }}
    >
      {group.map((w, i) => {
        const bare = w.text.replace(/[.,:?!]$/, '');
        const isKey = keys.some((kk) => kk && clean(w.text).includes(kk));
        const rot = (rand(gi * 5 + i) - 0.5) * 5;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `rotate(${rot}deg)`,
              background: isKey ? RED : INK,
              color: isKey ? '#fff' : PAPER,
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontWeight: 900,
              fontSize: 80,
              lineHeight: 1,
              padding: '10px 18px 16px',
              borderRadius: 7,
              boxShadow: '0 8px 16px rgba(20,12,6,0.4)',
              textTransform: 'lowercase',
              letterSpacing: '0.5px',
            }}
          >
            {bare}
          </span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root: cue-driven timeline (falls back to even spread with no narration),
// quick paper-slide on each cut.
// ---------------------------------------------------------------------------
export const CollageStory: React.FC<{
  words: CollageWord[];
  scenes: CollageScene[];
  keywords: string[];
}> = ({words, scenes, keywords}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const hasAudio = words.length > 0;

  // scene start frames
  let timeline: {scene: CollageScene; from: number}[];
  if (hasAudio) {
    const starts = scenes.map((s, i) => {
      if (!s.cue) return i === 0 ? 0 : null;
      const w = words.find((x) => clean(x.text).includes(clean(s.cue as string)));
      return w ? Math.round((w.fromMs / 1000) * fps) : null;
    });
    timeline = scenes
      .map((s, i) => ({scene: s, from: starts[i]}))
      .filter((s): s is {scene: CollageScene; from: number} => s.from !== null);
  } else {
    const per = durationInFrames / Math.max(scenes.length, 1);
    timeline = scenes.map((s, i) => ({scene: s, from: Math.round(i * per)}));
  }
  if (timeline.length === 0) timeline = [{scene: scenes[0] ?? {kind: 'title', cue: null}, from: 0}];

  const idx = timeline.reduce((best, s, i) => (frame >= s.from ? i : best), 0);
  const item = timeline[idx];
  const scene = item.scene;
  const end = timeline[idx + 1]?.from ?? durationInFrames;
  const f = frame - item.from;
  const len = Math.max(end - item.from, 1);

  // paper slide + settle on cut
  const slide = spring({frame: f, fps, config: {damping: 18, stiffness: 120}, durationInFrames: 12});
  const tx = interpolate(slide, [0, 1], [idx % 2 === 0 ? 70 : -70, 0]);
  const rot = interpolate(slide, [0, 1], [idx % 2 === 0 ? 2.2 : -2.2, 0]);
  // gentle drift zoom
  const zoom = 1.04 + (f / len) * 0.05;

  return (
    <AbsoluteFill style={{background: '#2a1d10', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translateX(${tx}px) rotate(${rot}deg) scale(${zoom})`,
          transformOrigin: '50% 52%',
          opacity: slide,
        }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <SceneArt key={scene.kind + idx} scene={scene} f={f} />
        </svg>
      </AbsoluteFill>
      {hasAudio ? <Caption words={words} keywords={keywords} /> : null}
    </AbsoluteFill>
  );
};
