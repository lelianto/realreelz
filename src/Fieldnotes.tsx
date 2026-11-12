// "Fieldnotes" template: editorial "special edition" reels in the style of a
// torn-paper field journal / newspaper clipping. Everything is drawn as SVG on
// a kraft-cardboard background with a cream paper sheet, a serif masthead, red
// accent tags, a big stat / checklist / statement, and an "EDISI KHUSUS" footer.
// Scene cuts follow cue words in the narration, exactly like the chronicle
// and stickman templates.
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DEFAULT_HANDLE} from './brand';

export type FieldWord = {text: string; fromMs: number; toMs: number};
export type FieldScene = {
  kind: string; // cover | define | insight | checklist | statement | outro
  cue: string | null;
  kicker?: string; // small red label
  label?: string; // headline
  highlight?: string; // phrase inside label (or extra line) drawn with a red marker
  sub?: string; // supporting italic line
  def?: string; // definition paragraph
  note?: string; // paragraph
  items?: string[]; // checklist lines
  handle?: string; // outro handle
};

const W = 1080;
const H = 1920;

// editorial paper palette ----------------------------------------------------
const KRAFT_TOP = '#2b271f';
const KRAFT_BOT = '#1c1915';
const PAPER = '#ece5d2';
const PAPER_SH = '#ddd3ba';
const PAPER_EDGE = '#ccc0a2';
const INK = '#2a2622';
const INK_SOFT = '#6f665a';
const RED = '#b23a2e';
const RED_DK = '#8f2c22';
const RULE = '#cabf9f';
const MARGIN = '#cf9a8f';

const MAST = 'Georgia, "Times New Roman", serif';

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
// Shared defs: paper texture, kraft gradient, soft shadow
// ---------------------------------------------------------------------------
const Defs: React.FC = () => (
  <defs>
    <linearGradient id="kraft" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={KRAFT_TOP} />
      <stop offset="100%" stopColor={KRAFT_BOT} />
    </linearGradient>
    <linearGradient id="paperG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#f2ecdb" />
      <stop offset="60%" stopColor={PAPER} />
      <stop offset="100%" stopColor={PAPER_SH} />
    </linearGradient>
    <filter id="fiber">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="n" />
      <feColorMatrix in="n" type="saturate" values="0" />
    </filter>
    <filter id="grain2">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
      <feColorMatrix in="n" type="saturate" values="0" />
    </filter>
    <filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="20" floodColor="#000" floodOpacity="0.45" />
    </filter>
  </defs>
);

// kraft board background with faint corrugation
const Kraft: React.FC = () => (
  <>
    <rect x="0" y="0" width={W} height={H} fill="url(#kraft)" />
    <rect x="0" y="0" width={W} height={H} filter="url(#grain2)" opacity="0.06" />
    {[...Array(9)].map((_, i) => (
      <rect key={i} x="0" y={120 + i * 210} width={W} height="2" fill="#000" opacity="0.08" />
    ))}
  </>
);

// torn-edge paper sheet. x,y,w,h define the body; top edge is jagged.
const Paper: React.FC<{x: number; y: number; w: number; h: number; rot?: number}> = ({
  x,
  y,
  w,
  h,
  rot = -0.8,
}) => {
  const teeth = 26;
  const step = w / teeth;
  let d = `M ${x} ${y + 14}`;
  for (let i = 0; i <= teeth; i++) {
    const px = x + i * step;
    const py = y + (i % 2 === 0 ? 2 : 20) + (i % 3 === 0 ? 6 : 0);
    d += ` L ${px} ${py}`;
  }
  d += ` L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  return (
    <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`} filter="url(#drop)">
      <path d={d} fill="url(#paperG)" />
      <path d={d} fill="url(#fiber)" opacity="0.05" />
      <rect x={x} y={y + 24} width={w} height={h - 24} fill="none" stroke={PAPER_EDGE} strokeWidth="2" opacity="0.6" />
    </g>
  );
};

// masthead + footer chrome drawn on top of the paper
const Chrome: React.FC<{masthead: string; edition: string; dateTag?: string}> = ({
  masthead,
  edition,
  dateTag,
}) => (
  <g>
    {/* masthead */}
    <text x="110" y="250" fontFamily={MAST} fontWeight="700" fontSize="58" fill={INK} letterSpacing="1">
      {masthead}
    </text>
    <rect x="110" y="272" width={W - 220} height="4" fill={INK} />
    <rect x="110" y="282" width={W - 220} height="2" fill={INK} opacity="0.5" />
    {dateTag ? (
      <g transform="translate(110 316)">
        <rect x="0" y="-26" width={dateTag.length * 15 + 34} height="38" rx="4" fill={RED} />
        <text x="17" y="2" fontFamily={MAST} fontWeight="700" fontSize="24" fill="#f7efdc" letterSpacing="1">
          {dateTag}
        </text>
      </g>
    ) : null}
    {/* footer */}
    <rect x="110" y="1600" width={W - 220} height="2" fill={INK} opacity="0.4" />
    <text x={W / 2} y="1646" textAnchor="middle" fontFamily={MAST} fontWeight="700" fontSize="30"
      fill={INK_SOFT} letterSpacing="10">
      {edition}
    </text>
  </g>
);

// a red "marker" highlight behind a run of text that wipes in
const markerRect = (x: number, y: number, w: number, h: number, p: number) => (
  <rect x={x} y={y} width={w * p} height={h} rx="5" fill={RED} opacity="0.92" />
);

// red check mark in a box
const Check: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="0" y="-34" width="44" height="44" rx="7" fill="none" stroke={RED} strokeWidth="4" />
    <path d="M 8 -12 L 19 -2 L 38 -28" fill="none" stroke={RED} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const Kicker: React.FC<{text: string; y?: number}> = ({text, y = 400}) => (
  <g transform={`translate(110 ${y})`}>
    <rect x="0" y="-30" width={text.length * 19 + 34} height="42" rx="5" fill={INK} />
    <text x="16" y="0" fontFamily={MAST} fontWeight="700" fontSize="24" fill={PAPER} letterSpacing="2">
      {text}
    </text>
  </g>
);

// ---------------------------------------------------------------------------
// Headline that reveals, with an optional red-marker highlighted phrase.
// Draws paragraph-style, left aligned.
// ---------------------------------------------------------------------------
const Headline: React.FC<{
  text: string;
  y: number;
  size: number;
  f: number;
  max?: number;
  highlight?: string;
}> = ({text, y, size, f, max = 15, highlight}) => {
  const {fps} = useVideoConfig();
  const p = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 14});
  const lines = wrap(text, max);
  const lh = size + 16;
  const charW = size * 0.56;
  return (
    <g opacity={p} transform={`translate(0 ${interpolate(p, [0, 1], [24, 0])})`}>
      {lines.map((ln, i) => {
        const ly = y + i * lh;
        const hl = highlight && ln.toLowerCase().includes(highlight.toLowerCase());
        let markX = 0;
        let markW = 0;
        if (hl) {
          const idx = ln.toLowerCase().indexOf(highlight.toLowerCase());
          markX = 110 + idx * charW - 6;
          markW = highlight.length * charW + 12;
        }
        const mp = spring({frame: f - 6, fps, config: {damping: 200}, durationInFrames: 12});
        return (
          <g key={i}>
            {hl ? markerRect(markX, ly - size + 10, markW, size + 6, mp) : null}
            <text x="110" y={ly} fontFamily={MAST} fontWeight="700" fontSize={size}
              fill={hl ? '#f7efdc' : INK}>
              {ln}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// One scene (full 1080x1920 SVG body, excluding chrome)
// ---------------------------------------------------------------------------
const SceneBody: React.FC<{scene: FieldScene; f: number; accent: string}> = ({scene, f}) => {
  const {fps} = useVideoConfig();
  const k = scene.kind;
  const p = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 16});

  if (k === 'cover') {
    return (
      <g>
        {/* big ticket-stub motif */}
        <g transform="translate(540 760)" opacity={p}>
          <g transform="rotate(-6)">
            <rect x="-300" y="-120" width="600" height="240" rx="14" fill="#f4eeda" stroke={INK} strokeWidth="4" />
            <line x1="150" y1="-120" x2="150" y2="120" stroke={INK} strokeWidth="3" strokeDasharray="10 12" />
            <circle cx="150" cy="-120" r="16" fill={KRAFT_TOP} />
            <circle cx="150" cy="120" r="16" fill={KRAFT_TOP} />
            <text x="-270" y="-50" fontFamily={MAST} fontWeight="700" fontSize="30" fill={INK_SOFT} letterSpacing="4">TIKET</text>
            <text x="-270" y="30" fontFamily={MAST} fontWeight="700" fontSize="84" fill={INK}>Rp ??.???</text>
            <text x="-270" y="86" fontFamily={MAST} fontSize="26" fill={RED} fontStyle="italic">sudah dibayar &#8226; tidak kembali</text>
            <g transform="translate(228 0) rotate(-16)">
              <rect x="-70" y="-34" width="150" height="66" rx="6" fill="none" stroke={RED} strokeWidth="5" />
              <text x="5" y="12" textAnchor="middle" fontFamily={MAST} fontWeight="700" fontSize="34" fill={RED}>HANGUS</text>
            </g>
          </g>
        </g>
        <Headline text={scene.label ?? ''} y={1020} size={116} f={f} max={11} highlight={scene.highlight} />
        {scene.sub ? (
          <g opacity={p}>
            {wrap(scene.sub, 34).map((ln, i) => (
              <text key={i} x="110" y={1300 + i * 50} fontFamily={MAST} fontStyle="italic" fontSize="40" fill={INK_SOFT}>
                {ln}
              </text>
            ))}
          </g>
        ) : null}
      </g>
    );
  }

  if (k === 'define') {
    return (
      <g>
        {scene.kicker ? <Kicker text={scene.kicker} y={430} /> : null}
        <Headline text={scene.label ?? ''} y={560} size={74} f={f} max={18} />
        {scene.sub ? (
          <text x="110" y={640} fontFamily={MAST} fontStyle="italic" fontSize="46" fill={RED} opacity={p}>
            {scene.sub}
          </text>
        ) : null}
        {/* definition note card */}
        <g opacity={p} transform={`translate(0 ${interpolate(p, [0, 1], [20, 0])})`}>
          <rect x="110" y="720" width={W - 220} height="380" rx="10" fill="#f6f0dd" stroke={PAPER_EDGE} strokeWidth="2" />
          <rect x="110" y="720" width="10" height="380" fill={RED} />
          {wrap(scene.def ?? '', 28).map((ln, i) => (
            <text key={i} x="160" y={810 + i * 64} fontFamily={MAST} fontSize="46" fill={INK}>
              {ln}
            </text>
          ))}
        </g>
      </g>
    );
  }

  if (k === 'insight') {
    // diagram: a bar split into "sudah keluar (hilang)" and "ke depan"
    return (
      <g>
        {scene.kicker ? <Kicker text={scene.kicker} y={430} /> : null}
        <Headline text={scene.label ?? ''} y={560} size={86} f={f} max={14} highlight={scene.highlight} />
        <g opacity={p} transform={`translate(0 ${interpolate(p, [0, 1], [20, 0])})`}>
          <text x="110" y="760" fontFamily={MAST} fontWeight="700" fontSize="30" fill={INK_SOFT} letterSpacing="2">
            GARIS WAKTU KEPUTUSAN
          </text>
          {/* the bar */}
          <rect x="110" y="800" width={520} height="120" fill="#ddd2b6" />
          <rect x="630" y="800" width={340} height="120" fill={RED} />
          <text x="370" y="876" textAnchor="middle" fontFamily={MAST} fontWeight="700" fontSize="40" fill={INK_SOFT}>
            SUDAH HILANG
          </text>
          <text x="800" y="876" textAnchor="middle" fontFamily={MAST} fontWeight="700" fontSize="40" fill="#f7efdc">
            KE DEPAN
          </text>
          {/* arrow pointing to "ke depan" */}
          <text x="800" y="990" textAnchor="middle" fontFamily={MAST} fontStyle="italic" fontSize="32" fill={RED}>
            &#9650; fokus di sini
          </text>
          <line x1="630" y1="790" x2="630" y2="930" stroke={INK} strokeWidth="3" strokeDasharray="6 8" />
          <text x="630" y="770" textAnchor="middle" fontFamily={MAST} fontSize="28" fill={INK}>sekarang</text>
          {/* note */}
          {wrap(scene.note ?? '', 32).map((ln, i) => (
            <text key={i} x="110" y={1120 + i * 58} fontFamily={MAST} fontSize="44" fill={INK}>
              {ln}
            </text>
          ))}
        </g>
      </g>
    );
  }

  if (k === 'checklist') {
    const items = scene.items ?? [];
    return (
      <g>
        {scene.kicker ? <Kicker text={scene.kicker} y={430} /> : null}
        <Headline text={scene.label ?? ''} y={560} size={80} f={f} max={16} />
        <g>
          {items.map((it, i) => {
            const ip = spring({frame: f - 8 - i * 7, fps, config: {damping: 200}, durationInFrames: 12});
            const y = 760 + i * 190;
            return (
              <g key={i} opacity={ip} transform={`translate(${interpolate(ip, [0, 1], [-20, 0])} 0)`}>
                <rect x="110" y={y} width={W - 220} height="150" rx="10" fill="#f6f0dd" stroke={PAPER_EDGE} strokeWidth="2" />
                <Check x={150} y={y + 95} />
                {wrap(it, 26).map((ln, j) => (
                  <text key={j} x="225" y={y + 70 + j * 52} fontFamily={MAST} fontSize="42" fill={INK}>
                    {ln}
                  </text>
                ))}
              </g>
            );
          })}
        </g>
      </g>
    );
  }

  if (k === 'statement') {
    return (
      <g>
        <g opacity={p}>
          <text x="110" y="440" fontFamily={MAST} fontSize="200" fill={RED} opacity="0.3">&#8220;</text>
        </g>
        <Headline text={scene.label ?? ''} y={720} size={88} f={f} max={16} />
        {scene.highlight ? (
          <Headline text={scene.highlight} y={720 + wrap(scene.label ?? '', 16).length * 104 + 40} size={96} f={f - 6} max={16} highlight={scene.highlight} />
        ) : null}
        {scene.sub ? (
          <g opacity={spring({frame: f - 16, fps, config: {damping: 200}, durationInFrames: 14})}>
            <text x="110" y="1360" fontFamily={MAST} fontStyle="italic" fontSize="46" fill={INK_SOFT}>
              {scene.sub}
            </text>
          </g>
        ) : null}
      </g>
    );
  }

  // outro
  return (
    <g>
      {scene.kicker ? <Kicker text={scene.kicker} y={430} /> : null}
      <Headline text={scene.label ?? ''} y={560} size={74} f={f} max={18} />
      <g opacity={spring({frame: f - 12, fps, config: {damping: 200}, durationInFrames: 14})}>
        {scene.note
          ? wrap(scene.note, 32).map((ln, i) => (
              <text key={i} x="110" y={1200 + i * 54} fontFamily={MAST} fontStyle="italic" fontSize="42" fill={RED}>
                {ln}
              </text>
            ))
          : null}
        <g transform="translate(110 1360)">
          <rect x="0" y="-52" width={(scene.handle ?? DEFAULT_HANDLE).length * 24 + 60} height="86" rx="43" fill={INK} />
          <text x="30" y="6" fontFamily={MAST} fontWeight="700" fontSize="44" fill={PAPER}>
            {scene.handle ?? DEFAULT_HANDLE}
          </text>
        </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Subtitle (ink serif on a translucent paper pill, red keywords)
// ---------------------------------------------------------------------------
const groupWords = (words: FieldWord[]) => {
  const groups: FieldWord[][] = [];
  let cur: FieldWord[] = [];
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

const Subtitle: React.FC<{words: FieldWord[]; keywords: string[]}> = ({words, keywords}) => {
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
        left: 90,
        right: 90,
        top: 1430,
        textAlign: 'center',
        transform: `scale(${interpolate(pop, [0, 1], [0.9, 1])})`,
      }}
    >
      <span
        style={{
          display: 'inline',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.45,
          color: INK,
          background: 'rgba(236,229,210,0.86)',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          padding: '6px 14px',
          borderRadius: 6,
        }}
      >
        {group.map((w, i) => (
          <span key={i} style={{color: keys.some((kk) => clean(w.text).includes(kk) && kk.length > 2) ? RED : INK}}>
            {w.text.replace(/[.,:]$/, '')}
            {i < group.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root: cue-driven timeline + gentle paper "settle" move
// ---------------------------------------------------------------------------
export const FieldnotesStory: React.FC<{
  words: FieldWord[];
  scenes: FieldScene[];
  keywords: string[];
  masthead: string;
  edition: string;
  dateTag?: string;
  accent: string;
}> = ({words, scenes, keywords, masthead, edition, dateTag, accent}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const starts = scenes.map((s) => {
    if (!s.cue) return 0;
    const w = words.find((x) => clean(x.text).includes(clean(s.cue as string)));
    return w ? Math.round((w.fromMs / 1000) * fps) : null;
  });
  const timeline = scenes
    .map((s, i) => ({scene: s, from: starts[i]}))
    .filter((s): s is {scene: FieldScene; from: number} => s.from !== null);
  const idx = timeline.reduce((best, s, i) => (frame >= s.from ? i : best), 0);
  const item = timeline[idx] ?? {scene: scenes[0], from: 0};
  const scene = item.scene;
  const from = item.from;
  const end = timeline[idx + 1]?.from ?? durationInFrames;
  const f = frame - from;
  const len = Math.max(end - from, 1);

  // gentle settle: tiny scale/rotate punch on cut, then rest
  const punch = spring({frame: f, fps, config: {damping: 18}, durationInFrames: 16});
  const scale = interpolate(punch, [0, 1], [1.05, 1]) + (f / len) * 0.015;
  const rot = interpolate(punch, [0, 1], [(idx % 2 === 0 ? 1 : -1) * 1.1, 0]);

  return (
    <AbsoluteFill style={{background: KRAFT_BOT, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${scale}) rotate(${rot}deg)`, transformOrigin: '50% 50%'}}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs />
          <Kraft />
          <Paper x={60} y={150} w={W - 120} h={H - 300} rot={-0.6} />
          <g key={scene.kind + idx}>
            <SceneBody scene={scene} f={f} accent={accent} />
          </g>
          <Chrome masthead={masthead} edition={edition} dateTag={dateTag} />
        </svg>
      </AbsoluteFill>
      <Subtitle words={words} keywords={keywords} />
    </AbsoluteFill>
  );
};
