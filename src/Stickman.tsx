// Flat 2D stickman storytelling template: every character and background is
// drawn as SVG, scene cuts follow cue words in the narration.
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type StoryWord = {text: string; fromMs: number; toMs: number};
export type StoryScene = {
  kind: string;
  cue: string | null;
  // optional data read by the GENERIC (parameterized) scenes
  label?: string;
  bubbleL?: string;
  bubbleR?: string;
  mood?: 'neutral' | 'happy' | 'sad' | 'shock' | 'angry';
  prop?: string;
  hair?: string;
  coat?: string;
  moustache?: boolean;
  old?: boolean;
  // optional data read by the CONCEPT (c*) scenes
  bubble?: string; // a single thought/speech line
  optL?: string; // left option / path
  optR?: string; // right option / path
  term?: string; // the concept name revealed on cterm
  def?: string; // short definition under the term
  points?: string[]; // up to 3 short bullet lines on cwhy
  // optional data for ANIMAL characters / analogies
  char?: string; // 'frog' | 'sheep' | 'ant' | 'wolf' | 'fox' | 'mouse' | 'lion' (default: stickman)
  heat?: number; // 0..1 water temperature for the cpot (boiling-frog) scene
};

const INK = '#1b1a22';
const SKIN = '#f6dfb8';
const SUIT = '#2f3550';
const W = 1080;
const H = 1920;

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

// ---------------------------------------------------------------------------
// Character
// ---------------------------------------------------------------------------
type StickProps = {
  x: number;
  y: number; // ground level, under the shoes
  scale?: number;
  old?: boolean;
  look?: 'neutral' | 'happy' | 'sad' | 'shock' | 'angry';
  armL?: number; // degrees from straight down, positive lifts the arm outward
  armR?: number;
  talking?: boolean;
  walking?: boolean;
  hair?: string;
  coat?: string;
  moustache?: boolean;
  bowTie?: boolean;
  flip?: boolean;
};

const Limb: React.FC<{x: number; y: number; len: number; angle: number; hand?: boolean}> = ({
  x,
  y,
  len,
  angle,
  hand = true,
}) => {
  const a = (angle * Math.PI) / 180;
  const ex = x + Math.sin(a) * len;
  const ey = y + Math.cos(a) * len;
  return (
    <g>
      <line x1={x} y1={y} x2={ex} y2={ey} stroke={INK} strokeWidth={13} strokeLinecap="round" />
      {hand ? <circle cx={ex} cy={ey} r={13} fill={SKIN} stroke={INK} strokeWidth={6} /> : null}
    </g>
  );
};

const Stick: React.FC<StickProps> = ({
  x,
  y,
  scale = 1,
  old = false,
  look = 'neutral',
  armL = 12,
  armR = 12,
  talking = false,
  walking = false,
  hair,
  coat = SUIT,
  moustache,
  bowTie = false,
  flip = false,
}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 9) * 4;
  const swing = walking ? Math.sin(frame / 3.2) * 24 : 0;
  const mouthOpen = talking && Math.sin(frame / 2.1) > -0.1;
  const blink = frame % 83 < 4;
  const hairColor = hair ?? (old ? '#a9a9ad' : '#22202a');
  const eyeR = look === 'shock' ? 19 : 15;

  return (
    <g transform={`translate(${x} ${y + bob}) scale(${(flip ? -1 : 1) * scale} ${scale})`}>
      {/* legs + shoes (origin is the ground point) */}
      <Limb x={-22} y={-205} len={190} angle={swing} hand={false} />
      <Limb x={22} y={-205} len={190} angle={-swing} hand={false} />
      <ellipse cx={-30 + swing * 1.2} cy={-10} rx={36} ry={15} fill="#fff" stroke={INK} strokeWidth={6} />
      <ellipse cx={30 - swing * 1.2} cy={-10} rx={36} ry={15} fill="#fff" stroke={INK} strokeWidth={6} />
      {/* suit */}
      <rect x={-68} y={-400} width={136} height={205} rx={38} fill={coat} stroke={INK} strokeWidth={8} />
      <path d="M-26 -398 L0 -340 L26 -398 Z" fill="#fff" stroke={INK} strokeWidth={5} />
      {bowTie ? (
        <path d="M-24 -388 L0 -376 L24 -388 L24 -358 L0 -370 L-24 -358 Z" fill="#c9412f" stroke={INK} strokeWidth={4} />
      ) : (
        <path d="M-9 -384 L9 -384 L5 -335 L0 -326 L-5 -335 Z" fill="#c9412f" stroke={INK} strokeWidth={4} />
      )}
      {/* arms */}
      <Limb x={-64} y={-376} len={165} angle={-armL} />
      <Limb x={64} y={-376} len={165} angle={armR} />
      {/* head */}
      <circle cx={0} cy={-495} r={92} fill={SKIN} stroke={INK} strokeWidth={8} />
      {old ? (
        <path d="M-92 -505 C-90 -600 90 -600 92 -505 C60 -565 -60 -565 -92 -505 Z" fill={hairColor} stroke={INK} strokeWidth={6} />
      ) : (
        <path d="M-92 -500 C-100 -610 80 -625 92 -505 C50 -560 -10 -575 -52 -535 C-70 -530 -82 -515 -92 -500 Z" fill={hairColor} stroke={INK} strokeWidth={6} />
      )}
      {/* eyes */}
      {[-36, 36].map((ex) =>
        blink ? (
          <line key={ex} x1={ex - 14} y1={-500} x2={ex + 14} y2={-500} stroke={INK} strokeWidth={7} strokeLinecap="round" />
        ) : (
          <g key={ex}>
            <circle cx={ex} cy={-500} r={eyeR + 8} fill="#fff" stroke={INK} strokeWidth={6} />
            <circle cx={ex + 3} cy={look === 'sad' ? -494 : -500} r={look === 'shock' ? 7 : 10} fill={INK} />
          </g>
        ),
      )}
      {look === 'sad' ? (
        <>
          <line x1={-58} y1={-532} x2={-20} y2={-546} stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <line x1={58} y1={-532} x2={20} y2={-546} stroke={INK} strokeWidth={8} strokeLinecap="round" />
        </>
      ) : null}
      {look === 'angry' ? (
        <>
          <line x1={-60} y1={-546} x2={-16} y2={-528} stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <line x1={60} y1={-546} x2={16} y2={-528} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        </>
      ) : null}
      {/* moustache + mouth */}
      {(moustache ?? !hair) ? (
        <path d="M0 -462 C-14 -476 -40 -470 -48 -450 C-28 -456 -12 -452 0 -450 C12 -452 28 -456 48 -450 C40 -470 14 -476 0 -462 Z" fill={old ? '#8e8e93' : INK} />
      ) : null}
      {mouthOpen || look === 'shock' ? (
        <ellipse cx={0} cy={-430} rx={16} ry={look === 'shock' ? 20 : 12} fill="#59211f" stroke={INK} strokeWidth={4} />
      ) : look === 'sad' ? (
        <path d="M-20 -424 Q0 -442 20 -424" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      ) : (
        <path d="M-22 -436 Q0 -416 22 -436" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Animal characters — flat 2D in the same house style, chosen per scene via
// `char`. Each takes the ground point (x, y) and draws upward, honoring
// scale / flip / look / talking and an idle bob + blink, exactly like Stick.
// ---------------------------------------------------------------------------
type AnimalProps = StickProps; // animals ignore hair/coat/arm* but share the shape

const Eyes: React.FC<{cs: number[]; cy: number; r?: number; pr?: number; look?: string; blink: boolean}> = ({
  cs,
  cy,
  r = 26,
  pr = 11,
  look = 'neutral',
  blink,
}) => (
  <>
    {cs.map((cx) =>
      blink ? (
        <line key={cx} x1={cx - r * 0.6} y1={cy} x2={cx + r * 0.6} y2={cy} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      ) : (
        <g key={cx}>
          <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={INK} strokeWidth={5} />
          <circle cx={cx + (look === 'shock' ? 0 : 2)} cy={look === 'sad' ? cy - 6 : cy} r={look === 'shock' ? pr * 0.7 : pr} fill={INK} />
        </g>
      ),
    )}
  </>
);

const Frog: React.FC<AnimalProps> = ({x, y, scale = 1, look = 'neutral', talking = false, flip = false}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 10) * 3;
  const breathe = 1 + Math.sin(frame / 14) * 0.02;
  const blink = frame % 95 < 4;
  const open = talking && Math.sin(frame / 2.3) > 0;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${(flip ? -1 : 1) * scale} ${scale})`}>
      <ellipse cx={-122} cy={-10} rx={56} ry={22} fill="#5a9433" stroke={INK} strokeWidth={6} />
      <ellipse cx={122} cy={-10} rx={56} ry={22} fill="#5a9433" stroke={INK} strokeWidth={6} />
      <g transform={`translate(0 -150) scale(1 ${breathe})`}>
        <ellipse cx={0} cy={0} rx={160} ry={130} fill="#6fae3d" stroke={INK} strokeWidth={8} />
        <ellipse cx={0} cy={44} rx={98} ry={72} fill="#b7dd86" />
      </g>
      <ellipse cx={-74} cy={-34} rx={30} ry={15} fill="#5a9433" stroke={INK} strokeWidth={6} />
      <ellipse cx={74} cy={-34} rx={30} ry={15} fill="#5a9433" stroke={INK} strokeWidth={6} />
      <circle cx={-72} cy={-292} r={62} fill="#6fae3d" stroke={INK} strokeWidth={8} />
      <circle cx={72} cy={-292} r={62} fill="#6fae3d" stroke={INK} strokeWidth={8} />
      <Eyes cs={[-72, 72]} cy={-300} r={35} pr={15} look={look} blink={blink} />
      {look === 'angry' ? (
        <>
          <line x1={-106} y1={-352} x2={-44} y2={-332} stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <line x1={106} y1={-352} x2={44} y2={-332} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        </>
      ) : null}
      <circle cx={-18} cy={-208} r={5} fill={INK} />
      <circle cx={18} cy={-208} r={5} fill={INK} />
      {open || look === 'shock' ? (
        <ellipse cx={0} cy={-150} rx={60} ry={34} fill="#3f6b23" stroke={INK} strokeWidth={6} />
      ) : look === 'sad' ? (
        <path d="M-82 -150 Q0 -192 82 -150" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      ) : (
        <path d="M-92 -170 Q0 -118 92 -170" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      )}
    </g>
  );
};

const Sheep: React.FC<AnimalProps> = ({x, y, scale = 1, look = 'neutral', talking = false, flip = false}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 9) * 3;
  const blink = frame % 90 < 4;
  const open = talking && Math.sin(frame / 2.2) > 0;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${(flip ? -1 : 1) * scale} ${scale})`}>
      {[-78, -28, 28, 78].map((lx) => (
        <rect key={lx} x={lx - 9} y={-74} width={18} height={76} fill="#2a2320" stroke={INK} strokeWidth={4} />
      ))}
      {Array.from({length: 13}, (_, i) => {
        const a = (i / 13) * Math.PI * 2;
        return <circle key={i} cx={Math.cos(a) * 150} cy={-158 + Math.sin(a) * 112} r={50} fill="#f4f2ec" stroke={INK} strokeWidth={6} />;
      })}
      <ellipse cx={0} cy={-158} rx={150} ry={112} fill="#f4f2ec" />
      <ellipse cx={-118} cy={-300} rx={30} ry={46} fill="#2a2320" stroke={INK} strokeWidth={5} />
      <ellipse cx={118} cy={-300} rx={30} ry={46} fill="#2a2320" stroke={INK} strokeWidth={5} />
      <ellipse cx={0} cy={-318} rx={78} ry={86} fill="#efe9df" stroke={INK} strokeWidth={7} />
      <path d="M-78 -372 Q0 -352 78 -372" fill="#f4f2ec" stroke={INK} strokeWidth={6} />
      <Eyes cs={[-30, 30]} cy={-326} r={22} pr={10} look={look} blink={blink} />
      {open ? (
        <ellipse cx={0} cy={-280} rx={16} ry={12} fill="#59211f" stroke={INK} strokeWidth={4} />
      ) : look === 'sad' ? (
        <path d="M-18 -276 Q0 -292 18 -276" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      ) : (
        <path d="M-18 -286 Q0 -270 18 -286" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      )}
      <circle cx={0} cy={-298} r={6} fill={INK} />
    </g>
  );
};

const Ant: React.FC<AnimalProps> = ({x, y, scale = 1, look = 'neutral', talking = false, flip = false}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 8) * 3;
  const blink = frame % 86 < 4;
  const open = talking && Math.sin(frame / 2.1) > 0;
  const B = '#2a2320';
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${(flip ? -1 : 1) * scale} ${scale})`}>
      {/* legs */}
      {[[-60, 40], [-70, -10], [-60, -60]].map(([lx, dy], i) => (
        <g key={i}>
          <line x1={-40} y1={-120 - dy} x2={lx - 70} y2={-120 - dy + 30} stroke={B} strokeWidth={9} strokeLinecap="round" />
          <line x1={40} y1={-120 - dy} x2={-lx + 70} y2={-120 - dy + 30} stroke={B} strokeWidth={9} strokeLinecap="round" />
        </g>
      ))}
      <ellipse cx={0} cy={-110} rx={82} ry={104} fill={B} stroke={INK} strokeWidth={6} />
      <circle cx={0} cy={-232} r={54} fill={B} stroke={INK} strokeWidth={6} />
      <circle cx={0} cy={-328} r={62} fill={B} stroke={INK} strokeWidth={6} />
      {/* antennae */}
      <path d="M-26 -382 Q-54 -430 -40 -456" fill="none" stroke={B} strokeWidth={7} strokeLinecap="round" />
      <path d="M26 -382 Q54 -430 40 -456" fill="none" stroke={B} strokeWidth={7} strokeLinecap="round" />
      <circle cx={-40} cy={-460} r={9} fill={B} />
      <circle cx={40} cy={-460} r={9} fill={B} />
      <Eyes cs={[-26, 26]} cy={-336} r={22} pr={10} look={look} blink={blink} />
      {open ? (
        <ellipse cx={0} cy={-298} rx={14} ry={10} fill="#59211f" stroke={INK} strokeWidth={3} />
      ) : (
        <path d="M-16 -300 Q0 -286 16 -300" fill="none" stroke="#efe9df" strokeWidth={5} strokeLinecap="round" />
      )}
    </g>
  );
};

type CritterStyle = {
  fur: string;
  belly: string;
  snout?: string;
  nose?: string;
  ear: 'pointed' | 'round' | 'small';
  mane?: string;
  tail?: string;
  headR?: number;
};
const Critter: React.FC<AnimalProps & {s: CritterStyle}> = ({x, y, scale = 1, look = 'neutral', talking = false, flip = false, s}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 9) * 3.5;
  const blink = frame % 88 < 4;
  const open = talking && Math.sin(frame / 2.1) > -0.1;
  const headR = s.headR ?? 100;
  const hy = -300;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${(flip ? -1 : 1) * scale} ${scale})`}>
      <ellipse cx={-70} cy={-8} rx={44} ry={18} fill={s.fur} stroke={INK} strokeWidth={6} />
      <ellipse cx={70} cy={-8} rx={44} ry={18} fill={s.fur} stroke={INK} strokeWidth={6} />
      {s.tail ? <path d="M112 -120 Q236 -150 206 -8" fill={s.tail} stroke={INK} strokeWidth={8} strokeLinejoin="round" /> : null}
      <path d="M-120 -20 Q-150 -220 0 -250 Q150 -220 120 -20 Z" fill={s.fur} stroke={INK} strokeWidth={8} />
      <ellipse cx={0} cy={-84} rx={78} ry={112} fill={s.belly} />
      {s.mane
        ? Array.from({length: 16}, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return <circle key={i} cx={Math.cos(a) * (headR + 26)} cy={hy + Math.sin(a) * (headR + 26)} r={36} fill={s.mane} stroke={INK} strokeWidth={5} />;
          })
        : null}
      {s.ear === 'pointed' ? (
        <>
          <path d={`M${-headR + 24} ${hy - headR + 34} L${-headR - 16} ${hy - headR - 62} L${-headR + 74} ${hy - headR + 26} Z`} fill={s.fur} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <path d={`M${headR - 24} ${hy - headR + 34} L${headR + 16} ${hy - headR - 62} L${headR - 74} ${hy - headR + 26} Z`} fill={s.fur} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        </>
      ) : s.ear === 'round' ? (
        <>
          <circle cx={-headR + 8} cy={hy - headR + 4} r={50} fill={s.fur} stroke={INK} strokeWidth={7} />
          <circle cx={headR - 8} cy={hy - headR + 4} r={50} fill={s.fur} stroke={INK} strokeWidth={7} />
          <circle cx={-headR + 8} cy={hy - headR + 4} r={26} fill={s.belly} />
          <circle cx={headR - 8} cy={hy - headR + 4} r={26} fill={s.belly} />
        </>
      ) : (
        <>
          <circle cx={-headR + 34} cy={hy - headR + 24} r={28} fill={s.fur} stroke={INK} strokeWidth={6} />
          <circle cx={headR - 34} cy={hy - headR + 24} r={28} fill={s.fur} stroke={INK} strokeWidth={6} />
        </>
      )}
      <circle cx={0} cy={hy} r={headR} fill={s.fur} stroke={INK} strokeWidth={8} />
      <Eyes cs={[-38, 38]} cy={hy - 12} r={26} pr={12} look={look} blink={blink} />
      {look === 'angry' ? (
        <>
          <line x1={-68} y1={hy - 54} x2={-16} y2={hy - 34} stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <line x1={68} y1={hy - 54} x2={16} y2={hy - 34} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        </>
      ) : null}
      {s.snout ? <ellipse cx={0} cy={hy + 48} rx={54} ry={42} fill={s.snout} /> : null}
      <path d={`M-16 ${hy + 24} L16 ${hy + 24} L0 ${hy + 44} Z`} fill={s.nose ?? INK} />
      {open || look === 'shock' ? (
        <ellipse cx={0} cy={hy + 70} rx={20} ry={look === 'shock' ? 22 : 14} fill="#59211f" stroke={INK} strokeWidth={4} />
      ) : look === 'sad' ? (
        <path d={`M-22 ${hy + 76} Q0 ${hy + 58} 22 ${hy + 76}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      ) : (
        <path d={`M-22 ${hy + 64} Q0 ${hy + 84} 22 ${hy + 64}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      )}
      {s.snout ? (
        <>
          <line x1={18} y1={hy + 48} x2={114} y2={hy + 34} stroke={INK} strokeWidth={3} />
          <line x1={18} y1={hy + 56} x2={114} y2={hy + 62} stroke={INK} strokeWidth={3} />
          <line x1={-18} y1={hy + 48} x2={-114} y2={hy + 34} stroke={INK} strokeWidth={3} />
          <line x1={-18} y1={hy + 56} x2={-114} y2={hy + 62} stroke={INK} strokeWidth={3} />
        </>
      ) : null}
    </g>
  );
};
const Wolf: React.FC<AnimalProps> = (p) => <Critter {...p} s={{fur: '#8a8f98', belly: '#c7ccd2', snout: '#b9bec5', ear: 'pointed', tail: '#8a8f98'}} />;
const Fox: React.FC<AnimalProps> = (p) => <Critter {...p} s={{fur: '#e07a32', belly: '#f6ebda', snout: '#f7efe3', ear: 'pointed', tail: '#e07a32'}} />;
const Mouse: React.FC<AnimalProps> = (p) => <Critter {...p} s={{fur: '#9aa0a8', belly: '#d9dde2', snout: '#d9dde2', ear: 'round', tail: '#c7a9b0', headR: 92}} />;
const Lion: React.FC<AnimalProps> = (p) => <Critter {...p} s={{fur: '#e3a23c', belly: '#f1d59e', snout: '#f4e6ca', ear: 'small', mane: '#b06a22'}} />;

const Actor: React.FC<StickProps & {char?: string}> = ({char, ...p}) => {
  switch (char) {
    case 'frog':
      return <Frog {...p} />;
    case 'sheep':
      return <Sheep {...p} />;
    case 'ant':
      return <Ant {...p} />;
    case 'wolf':
      return <Wolf {...p} />;
    case 'fox':
      return <Fox {...p} />;
    case 'mouse':
      return <Mouse {...p} />;
    case 'lion':
      return <Lion {...p} />;
    default:
      return <Stick {...p} />;
  }
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
const Bolt: React.FC<{from: [number, number]; to: [number, number]; seed: number; width?: number}> = ({
  from,
  to,
  seed,
  width = 8,
}) => {
  const n = 8;
  const pts = Array.from({length: n + 1}, (_, i) => {
    const t = i / n;
    const off = i === 0 || i === n ? 0 : (rand(seed + i) - 0.5) * 95;
    return `${from[0] + (to[0] - from[0]) * t + off},${from[1] + (to[1] - from[1]) * t + off * 0.45}`;
  }).join(' ');
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="round">
      <polyline points={pts} stroke="#7fd4ff" strokeWidth={width * 3} opacity={0.3} />
      <polyline points={pts} stroke="#ffffff" strokeWidth={width} />
    </g>
  );
};

const Bulb: React.FC<{x: number; y: number; on?: boolean; size?: number}> = ({x, y, on = true, size = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${size})`}>
    {on ? <circle r={90} fill="#ffe07a" opacity={0.28} /> : null}
    <circle r={42} fill={on ? '#fff3b0' : '#c9c6bb'} stroke={INK} strokeWidth={7} />
    <rect x={-17} y={36} width={34} height={28} rx={5} fill="#858896" stroke={INK} strokeWidth={6} />
  </g>
);

const Rain: React.FC<{area: [number, number, number, number]; count?: number}> = ({area, count = 34}) => {
  const frame = useCurrentFrame();
  const [x, y, w, h] = area;
  return (
    <g stroke="#a8c7e8" strokeWidth={5} strokeLinecap="round" opacity={0.75}>
      {Array.from({length: count}, (_, i) => {
        const px = x + rand(i) * w;
        const py = y + ((rand(i + 50) * h + frame * 26) % h);
        return <line key={i} x1={px} y1={py} x2={px - 8} y2={py + 34} />;
      })}
    </g>
  );
};

const Skyline: React.FC<{lit: number; base?: number}> = ({lit, base = 1490}) => {
  const buildings = [
    [0, 760, 210],
    [200, 980, 190],
    [380, 640, 230],
    [600, 880, 170],
    [760, 560, 200],
    [950, 840, 180],
  ];
  return (
    <g>
      {buildings.map(([x, height, width], b) => {
        const top = base - height;
        const windows = [];
        for (let row = 0; row * 92 + 50 < height - 40; row++) {
          for (let col = 0; col * 62 + 30 < width - 40; col++) {
            const on = rand(b * 31 + row * 7 + col) < lit;
            windows.push(
              <rect
                key={`${row}-${col}`}
                x={x + 30 + col * 62}
                y={top + 50 + row * 92}
                width={38}
                height={56}
                fill={on ? '#ffd76a' : '#1e2746'}
              />,
            );
          }
        }
        return (
          <g key={b}>
            <rect x={x} y={top} width={width} height={height} fill="#121a36" stroke={INK} strokeWidth={8} />
            {windows}
          </g>
        );
      })}
    </g>
  );
};

const LatticeTower: React.FC = () => (
  <g fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round">
    <path d="M395 1320 L470 540 M685 1320 L610 540" />
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const y1 = 1320 - i * 130;
      const y2 = y1 - 130;
      const inset = (Y: number) => ((1320 - Y) / 780) * 75;
      return (
        <g key={i}>
          <path d={`M${395 + inset(y1)} ${y1} L${685 - inset(y2)} ${y2} M${685 - inset(y1)} ${y1} L${395 + inset(y2)} ${y2}`} strokeWidth={8} />
          <path d={`M${395 + inset(y2)} ${y2} L${685 - inset(y2)} ${y2}`} strokeWidth={9} />
        </g>
      );
    })}
    <path d="M395 540 A145 145 0 0 1 685 540 Z" fill="#7cc8ee" strokeWidth={10} />
  </g>
);

const Room: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <g>
      <rect width={W} height={H} fill="#6e513a" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={i * 200 + 90} y1={0} x2={i * 200 + 90} y2={1450} stroke="#5f4532" strokeWidth={5} />
      ))}
      <rect y={1450} width={W} height={470} fill="#46301f" />
      <rect y={1442} width={W} height={12} fill={INK} />
      {/* window */}
      <rect x={640} y={120} width={380} height={480} fill="#14213f" stroke={INK} strokeWidth={14} />
      <Rain area={[655, 130, 350, 420]} count={16} />
      <path d="M830 120 V600 M640 350 H1020" stroke={INK} strokeWidth={11} />
      {/* lamp */}
      <circle cx={190} cy={300} r={210} fill="#ffc861" opacity={0.2 + Math.sin(frame / 7) * 0.03} />
      <path d="M130 210 H250 L280 370 H100 Z" fill="#b57f3d" stroke={INK} strokeWidth={8} />
      <circle cx={190} cy={300} r={24} fill="#ffe388" stroke={INK} strokeWidth={6} />
      {/* bed */}
      <rect x={60} y={1130} width={640} height={320} rx={18} fill="#7c5a43" stroke={INK} strokeWidth={9} />
      <rect x={60} y={1040} width={250} height={110} rx={40} fill="#efe6d3" stroke={INK} strokeWidth={8} />
      <rect x={270} y={1050} width={410} height={100} rx={40} fill="#4d70a7" stroke={INK} strokeWidth={8} />
    </g>
  );
};

const Dish: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g>
    <ellipse cx={x} cy={y} rx={r} ry={r * (r > 120 ? 1 : 0.34)} fill="#d7e2e8" stroke={INK} strokeWidth={7} />
    <ellipse cx={x} cy={y} rx={r * 0.84} ry={r * (r > 120 ? 0.84 : 0.26)} fill="#ecd98f" stroke={INK} strokeWidth={4} />
  </g>
);

const Mold: React.FC<{x: number; y: number; r: number; seed: number}> = ({x, y, r, seed}) => (
  <g>
    {Array.from({length: 9}, (_, i) => {
      const a = (i / 9) * Math.PI * 2;
      const d = r * (0.45 + rand(seed + i) * 0.3);
      return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d} r={r * 0.5} fill="#4f9a5a" stroke={INK} strokeWidth={5} />;
    })}
    <circle cx={x} cy={y} r={r * 0.66} fill="#4f9a5a" />
  </g>
);

const Flask: React.FC<{x: number; y: number; fill: string; level: number}> = ({x, y, fill, level}) => (
  <g transform={`translate(${x} ${y})`}>
    <clipPath id={`flask-${x}`}>
      <path d="M-22 -190 H22 V-120 L70 -18 Q76 0 56 0 H-56 Q-76 0 -70 -18 L-22 -120 Z" />
    </clipPath>
    <rect x={-80} y={-190 * level} width={160} height={190 * level} fill={fill} clipPath={`url(#flask-${x})`} />
    <path d="M-22 -190 H22 V-120 L70 -18 Q76 0 56 0 H-56 Q-76 0 -70 -18 L-22 -120 Z" fill="#ffffff30" stroke={INK} strokeWidth={8} />
  </g>
);

const Tag: React.FC<{x: number; y: number; text: string}> = ({x, y, text}) => (
  <g>
    <rect x={x - 130} y={y - 48} width={260} height={76} rx={14} fill="#17151e" stroke="#fff" strokeWidth={5} />
    <text x={x} y={y + 8} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff" fontFamily="Arial Black, Arial">{text}</text>
  </g>
);

const Bike: React.FC<{x: number; y: number; spin: number}> = ({x, y, spin}) => (
  <g transform={`translate(${x} ${y})`}>
    {[-150, 150].map((wx) => (
      <g key={wx} transform={`translate(${wx} 120) rotate(${spin})`}>
        <circle r={112} fill="none" stroke={INK} strokeWidth={14} />
        {[0, 45, 90, 135].map((a) => (
          <line key={a} x1={-108} y1={0} x2={108} y2={0} transform={`rotate(${a})`} stroke={INK} strokeWidth={5} />
        ))}
      </g>
    ))}
    <path d="M-150 120 L-50 -40 H110 L150 120 M-50 -40 L10 120 L110 -40 M-50 -40 L-75 -85 M110 -40 L95 -105" fill="none" stroke="#b5342a" strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M-120 -88 H-30 M60 -108 H130" stroke={INK} strokeWidth={18} strokeLinecap="round" />
  </g>
);

const Bird: React.FC<{x: number; y: number; seed: number; flip?: boolean}> = ({x, y, seed, flip}) => {
  const wing = Math.sin(seed / 3) * 45;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path d={`M-90 ${-wing} Q-40 ${-wing * 0.3} 0 0 Q40 ${-wing * 0.3} 90 ${-wing}`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <ellipse cx={0} cy={6} rx={34} ry={16} fill="#f5f3ea" stroke={INK} strokeWidth={6} />
    </g>
  );
};

const Flyer: React.FC<{x: number; y: number; s: number; prop?: number}> = ({x, y, s, prop = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeLinecap="round">
    {[-200, -110, 0, 110, 200].map((sx) => (
      <line key={sx} x1={sx} y1={-70} x2={sx} y2={70} strokeWidth={8} />
    ))}
    <rect x={-290} y={-88} width={580} height={32} rx={16} fill="#f2e6c8" strokeWidth={8} />
    <rect x={-290} y={58} width={580} height={32} rx={16} fill="#f2e6c8" strokeWidth={8} />
    <path d="M-290 0 H-410 M290 0 H380" strokeWidth={8} />
    <rect x={-455} y={-60} width={46} height={120} rx={8} fill="#f2e6c8" strokeWidth={7} />
    <rect x={375} y={-45} width={110} height={26} rx={12} fill="#f2e6c8" strokeWidth={7} />
    <rect x={375} y={22} width={110} height={26} rx={12} fill="#f2e6c8" strokeWidth={7} />
    <path d="M-250 90 L-230 150 H250" fill="none" strokeWidth={9} />
    <circle cx={-20} cy={22} r={30} fill={SKIN} strokeWidth={6} />
    <rect x={-110} y={-12} width={68} height={56} rx={8} fill="#7a7f8c" strokeWidth={6} />
    <ellipse cx={-302} cy={0} rx={13} ry={46 + Math.sin(prop * 2) * 26} fill="#ffffff90" strokeWidth={5} />
  </g>
);

// ---------------------------------------------------------------------------
// Scenes (`f` = frames since this scene started, `len` = its length)
// ---------------------------------------------------------------------------
// Small shared props used by the generic scenes.
const Card: React.FC<{y: number; text: string}> = ({y, text}) => (
  <g>
    <rect x={160} y={y - 82} width={760} height={164} rx={18} fill="#fff" stroke={INK} strokeWidth={10} />
    <text x={540} y={y + 22} textAnchor="middle" fontSize={62} fontWeight={900} fill="#c9412f" fontFamily="Arial Black, Arial">{text}</text>
  </g>
);

const Bubble: React.FC<{x: number; y: number; side: 'l' | 'r'; text: string}> = ({x, y, side, text}) => (
  <g>
    <rect x={x - 175} y={y - 95} width={350} height={150} rx={22} fill="#fff" stroke={INK} strokeWidth={8} />
    <path d={side === 'l' ? `M${x - 50} ${y + 48} L${x - 80} ${y + 120} L${x + 6} ${y + 52} Z` : `M${x + 50} ${y + 48} L${x + 80} ${y + 120} L${x - 6} ${y + 52} Z`} fill="#fff" stroke={INK} strokeWidth={8} />
    <text x={x} y={y - 2} textAnchor="middle" fontSize={44} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">{text}</text>
  </g>
);

const GProp: React.FC<{prop?: string; x: number; y: number; f: number}> = ({prop, x, y, f}) => {
  if (prop === 'flask') return <Flask x={x} y={y} fill="#8bd17c" level={0.5} />;
  if (prop === 'bulb') return <Bulb x={x} y={y - 130} />;
  if (prop === 'book')
    return (
      <g>
        <rect x={x - 80} y={y - 110} width={160} height={120} fill="#c0894b" stroke={INK} strokeWidth={7} />
        <rect x={x - 80} y={y - 110} width={160} height={120} fill="none" stroke={INK} strokeWidth={7} />
        <line x1={x} y1={y - 110} x2={x} y2={y + 10} stroke={INK} strokeWidth={6} />
      </g>
    );
  if (prop === 'gear')
    return (
      <g transform={`translate(${x} ${y - 80}) rotate(${f * 3})`}>
        {Array.from({length: 8}, (_, i) => (
          <rect key={i} x={-13} y={-72} width={26} height={30} fill="#9aa0ac" stroke={INK} strokeWidth={4} transform={`rotate(${i * 45})`} />
        ))}
        <circle r={46} fill="#c4c9d2" stroke={INK} strokeWidth={7} />
        <circle r={16} fill="#6b7280" />
      </g>
    );
  if (prop === 'scope')
    return (
      <g transform={`translate(${x} ${y - 40})`}>
        <rect x={-18} y={-230} width={120} height={46} rx={10} fill="#3a3f52" stroke={INK} strokeWidth={7} transform="rotate(-32)" />
        <line x1={0} y1={0} x2={0} y2={-120} stroke={INK} strokeWidth={10} />
        <path d="M-70 0 H70" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      </g>
    );
  return (
    <>
      <Dish x={x - 60} y={y} r={56} />
      <Dish x={x + 60} y={y - 10} r={56} />
    </>
  );
};

// Wrap a string into lines of at most `max` characters (word-safe).
const wrap = (s: string, max: number): string[] => {
  const lines: string[] = [];
  let cur = '';
  for (const w of (s || '').split(' ')) {
    if (cur && (cur + ' ' + w).length > max) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
};

// Small shared props used by the CONCEPT (c*) scenes.
const TopTag: React.FC<{text: string}> = ({text}) => {
  const w = Math.min(780, text.length * 24 + 90);
  return (
    <g>
      <rect x={540 - w / 2} y={170} width={w} height={84} rx={42} fill="#0e0f16" opacity={0.82} stroke="#ffffff40" strokeWidth={3} />
      <text x={540} y={226} textAnchor="middle" fontSize={44} fontWeight={800} fill="#fff" fontFamily="Arial, sans-serif">{text}</text>
    </g>
  );
};

const ThoughtCloud: React.FC<{x: number; y: number; text: string}> = ({x, y, text}) => {
  const lines = wrap(text, 16);
  const w = 640;
  const h = 70 + lines.length * 62;
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x - 110 + i * 34} cy={y + h / 2 + 52 + i * 46} r={13 + i * 7} fill="#fff" stroke={INK} strokeWidth={5} />
      ))}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={Math.min(h / 2, 150)} fill="#fff" stroke={INK} strokeWidth={8} />
      <text x={x} y={y - (lines.length - 1) * 31 + 16} textAnchor="middle" fontSize={50} fontWeight={800} fill={INK} fontFamily="Arial, sans-serif">
        {lines.map((l, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : 62}>{l}</tspan>
        ))}
      </text>
    </g>
  );
};

const Coins: React.FC<{f: number; label?: string}> = ({f, label}) => (
  <g>
    <ellipse cx={540} cy={1200} rx={220} ry={58} fill="#0a0b11" stroke={INK} strokeWidth={8} />
    {Array.from({length: 6}, (_, i) => {
      const t = ((f * 6 + i * 44) % 260) / 260;
      const cy = 640 + t * 560;
      const op = t > 0.86 ? (1 - t) / 0.14 : 1;
      return (
        <g key={i} opacity={op} transform={`translate(${540 + Math.sin(i * 2.1) * 130} ${cy})`}>
          <circle r={38} fill="#ffcf3f" stroke={INK} strokeWidth={6} />
          <circle r={20} fill="none" stroke={INK} strokeWidth={5} opacity={0.5} />
        </g>
      );
    })}
    {label ? (
      <g transform="translate(540 440)">
        <rect x={-280} y={-72} width={560} height={134} rx={16} fill="#c9412f" stroke={INK} strokeWidth={9} />
        <text y={20} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff" fontFamily="Arial Black, Arial">{label}</text>
      </g>
    ) : null}
  </g>
);

const Note: React.FC<{points?: string[]; label?: string}> = ({points, label}) => {
  const pts = (points ?? []).slice(0, 3);
  return (
    <g>
      <rect x={110} y={350} width={860} height={660} rx={22} fill="#f6f3e8" stroke={INK} strokeWidth={10} />
      {label ? <text x={540} y={470} textAnchor="middle" fontSize={60} fontWeight={900} fill="#c9412f" fontFamily="Arial Black, Arial">{label}</text> : null}
      {pts.map((p, i) => {
        const lines = wrap(p, 24);
        const baseY = (label ? 580 : 480) + i * 150;
        return (
          <g key={i}>
            <circle cx={180} cy={baseY - 15} r={13} fill={INK} />
            <text x={222} y={baseY} fontSize={46} fontWeight={700} fill={INK} fontFamily="Arial, sans-serif">
              {lines.map((l, j) => (
                <tspan key={j} x={222} dy={j === 0 ? 0 : 54}>{l}</tspan>
              ))}
            </text>
          </g>
        );
      })}
    </g>
  );
};

const SceneArt: React.FC<{scene: StoryScene; f: number; len: number; accent: string; hue?: number; baseHair?: string; baseMoustache?: boolean}> = ({scene, f, len, accent, hue = 0, baseHair, baseMoustache}) => {
  const kind = scene.kind;
  const hero = {
    hair: scene.hair ?? baseHair,
    coat: scene.coat,
    moustache: scene.moustache ?? baseMoustache,
    old: scene.old,
  };
  const {fps} = useVideoConfig();
  const seed = Math.floor(f / 3);
  const pop = spring({frame: f, fps, config: {damping: 12}, durationInFrames: 16});
  // Per-video background tint: the big scene backdrops are expressed as HSL and
  // rotated by `hue` so each video reads as a distinct colour family, while the
  // characters/props keep their natural colours.
  const bgc = (h: number, s: number, l: number) => `hsl(${((h + hue) % 360 + 360) % 360} ${s}% ${l}%)`;

  // ====== GENERIC reusable scenes — parameterized, work for any inventor ======
  if (kind === 'gintro') {
    return (
      <g>
        <rect width={W} height={H} fill={bgc(225, 20, 15)} />
        <path d="M360 0 L720 0 L905 1500 H175 Z" fill="#2c3340" opacity={0.55} />
        <rect y={1500} width={W} height={420} fill="#14161d" />
        <Stick x={540} y={1560} {...hero} look={scene.mood ?? 'sad'} scale={1.15} talking armL={10} armR={10} />
      </g>
    );
  }
  if (kind === 'gportrait') {
    return (
      <g>
        <rect width={W} height={H} fill={bgc(218, 31, 25)} />
        <rect y={1500} width={W} height={420} fill="#1b2435" />
        {scene.label ? <Card y={320} text={scene.label} /> : null}
        <Stick x={540} y={1560} {...hero} look="neutral" scale={1.2} />
      </g>
    );
  }
  if (kind === 'gidea') {
    const lit = interpolate(f, [6, 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <g>
        <rect width={W} height={H} fill={`hsl(${(((220 + hue) % 360) + 360) % 360} 28% ${12 + lit * 12}%)`} />
        <rect y={1500} width={W} height={420} fill="#14161d" />
        <circle cx={540} cy={790} r={200 * lit} fill="#ffe07a" opacity={0.26 * lit} />
        <Bulb x={540} y={840} on={lit > 0.4} size={1.7} />
        <Stick x={540} y={1600} {...hero} look="happy" scale={1.1} armL={120} />
      </g>
    );
  }
  if (kind === 'gwork') {
    return (
      <g>
        <rect width={W} height={H} fill={bgc(113, 10, 38)} />
        <rect y={1500} width={W} height={420} fill="#3a4538" />
        <rect x={470} y={1140} width={560} height={40} fill="#8a6a45" stroke={INK} strokeWidth={8} />
        <rect x={522} y={1180} width={28} height={320} fill="#6c5236" stroke={INK} strokeWidth={7} />
        <rect x={956} y={1180} width={28} height={320} fill="#6c5236" stroke={INK} strokeWidth={7} />
        <GProp prop={scene.prop} x={760} y={1140} f={f} />
        <Stick x={250} y={1540} {...hero} look="neutral" talking scale={1.05} armR={60} />
      </g>
    );
  }
  if (kind === 'gstruggle') {
    return (
      <g>
        <rect width={W} height={H} fill={bgc(0, 15, 37)} />
        <rect y={1500} width={W} height={420} fill="#3a2a2a" />
        <text x={760} y={780} textAnchor="middle" fontSize={230} fontWeight={900} fill="#c9412f" stroke={INK} strokeWidth={9} paintOrder="stroke" fontFamily="Arial Black, Arial">?</text>
        <Stick x={300} y={1540} {...hero} look="sad" scale={1.1} />
      </g>
    );
  }
  if (kind === 'grival') {
    return (
      <g>
        <rect width={W} height={H} fill={bgc(35, 56, 52)} />
        <rect y={1500} width={W} height={420} fill="#5e3f24" />
        {scene.bubbleL ? <Bubble x={300} y={600} side="l" text={scene.bubbleL} /> : null}
        {scene.bubbleR ? <Bubble x={790} y={600} side="r" text={scene.bubbleR} /> : null}
        <Stick x={300} y={1540} {...hero} look="angry" talking scale={1.05} armR={55} />
        <Stick x={790} y={1540} hair="#b7b0a4" coat="#46503a" look="angry" scale={1.05} flip />
      </g>
    );
  }
  if (kind === 'gbreakthrough') {
    return (
      <g>
        <rect width={W} height={H} fill={bgc(212, 67, 25)} />
        {Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2 + f / 55;
          return <line key={i} x1={540 + Math.cos(a) * 300} y1={740 + Math.sin(a) * 300} x2={540 + Math.cos(a) * 640} y2={740 + Math.sin(a) * 640} stroke={accent} strokeWidth={14} strokeLinecap="round" opacity={0.7} />;
        })}
        {scene.label ? (
          <g transform={`translate(540 720) scale(${pop})`}>
            <rect x={-320} y={-95} width={640} height={190} rx={18} fill={accent} stroke={INK} strokeWidth={10} />
            <text x={0} y={30} textAnchor="middle" fontSize={88} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">{scene.label}</text>
          </g>
        ) : null}
        <Stick x={540} y={1600} {...hero} look="happy" scale={1.1} armL={140} armR={140} />
      </g>
    );
  }
  if (kind === 'gimpact') {
    const lit = interpolate(f, [0, 70], [0.15, 0.85], {extrapolateRight: 'clamp'});
    return (
      <g>
        <rect width={W} height={H} fill={bgc(228, 60, 13)} />
        <Skyline lit={lit} />
        {f > 20 ? (
          <>
            <Bolt from={[0, 800]} to={[540, 930]} seed={seed} width={6} />
            <Bolt from={[540, 930]} to={[1080, 760]} seed={seed + 9} width={6} />
          </>
        ) : null}
        <rect y={1490} width={W} height={430} fill="#1a1423" />
        <Stick x={540} y={1640} {...hero} look="happy" scale={1.05} />
      </g>
    );
  }
  if (kind === 'gaward') {
    return (
      <g>
        <rect width={W} height={H} fill={bgc(350, 63, 22)} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={i * 160 - 20} width={80} height={1500} fill="#74202b" />
        ))}
        <path d="M250 0 L60 1500 H1020 L830 0 Z" fill="#ffe9a6" opacity={0.18} />
        {scene.label ? (
          <g transform={`translate(540 330) scale(${pop})`}>
            <rect x={-330} y={-95} width={660} height={190} rx={20} fill={accent} stroke={INK} strokeWidth={10} />
            <text x={0} y={32} textAnchor="middle" fontSize={84} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">{scene.label}</text>
          </g>
        ) : null}
        <rect y={1500} width={W} height={420} fill="#2d1a1e" />
        <Stick x={540} y={1560} {...hero} look="happy" scale={1.1} armL={150} />
        <circle cx={540} cy={1230} r={34} fill={accent} stroke={INK} strokeWidth={7} />
      </g>
    );
  }
  if (kind === 'gclose') {
    return (
      <g>
        <rect width={W} height={H} fill={bgc(230, 55, 17)} />
        {Array.from({length: 30}, (_, i) => (
          <circle key={i} cx={rand(i + 8) * W} cy={rand(i + 60) * 950} r={4} fill="#fff" />
        ))}
        <circle cx={760} cy={360} r={150} fill="#f2ecd3" stroke={INK} strokeWidth={9} />
        <path d="M0 1320 Q540 1190 1080 1320 V1920 H0 Z" fill="#223044" stroke={INK} strokeWidth={9} />
        <Stick x={540} y={1540} {...hero} look="happy" scale={1.05} armL={120} />
      </g>
    );
  }

  // ====== GENERIC human-interest scenes (added for the "lives" series) ======
  // All hue-aware, all keep a visible stickman, read `scene.label`/`mood`.
  if (kind === 'galone') {
    // a lone figure in a vast dark room, one faint shaft of light from a window
    const flick = 0.07 + Math.sin(f / 9) * 0.015;
    return (
      <g>
        <rect width={W} height={H} fill={bgc(225, 16, 9)} />
        <rect y={1520} width={W} height={400} fill={bgc(225, 14, 6)} />
        <rect y={1512} width={W} height={10} fill={INK} />
        <rect x={690} y={150} width={300} height={600} fill={bgc(210, 34, 20)} stroke={INK} strokeWidth={12} />
        <path d="M840 150 V750 M690 450 H990" stroke={INK} strokeWidth={9} />
        <path d="M690 750 L990 750 L900 1520 L560 1520 Z" fill="#ffe9b0" opacity={flick} />
        <Stick x={430} y={1560} {...hero} look={scene.mood ?? 'sad'} scale={1.12} />
      </g>
    );
  }
  if (kind === 'gbird') {
    return (
      <g>
        <rect width={W} height={H} fill={bgc(214, 30, 22)} />
        <circle cx={840} cy={400} r={150} fill="#f2ecd3" opacity={0.55} stroke={INK} strokeWidth={6} />
        <Bird x={720} y={520} seed={f} />
        <Bird x={910} y={610} seed={f + 7} />
        <Bird x={300} y={650} seed={f + 3} flip />
        <rect y={1500} width={W} height={420} fill={bgc(220, 32, 14)} />
        <Stick x={540} y={1570} {...hero} look="happy" scale={1.12} armL={46} armR={46} />
        <g transform="translate(540 1232)">
          <ellipse cx={0} cy={0} rx={48} ry={30} fill="#f5f3ea" stroke={INK} strokeWidth={6} />
          <circle cx={40} cy={-20} r={21} fill="#f5f3ea" stroke={INK} strokeWidth={6} />
          <path d="M58 -22 l24 7 l-24 9 Z" fill="#e2a33a" stroke={INK} strokeWidth={3} />
          <circle cx={44} cy={-24} r={4} fill={INK} />
        </g>
      </g>
    );
  }
  if (kind === 'gquote') {
    const lines = wrap(scene.label ?? '', 18);
    const startY = 720 - (lines.length - 1) * 46;
    return (
      <g>
        <rect width={W} height={H} fill={bgc(232, 22, 13)} />
        <text x={150} y={520} fontSize={300} fontWeight={900} fill={accent} opacity={0.4} fontFamily="Georgia, serif">&#8220;</text>
        <text x={540} y={startY} textAnchor="middle" fontSize={78} fontWeight={900} fill="#fff" fontFamily="Georgia, serif" fontStyle="italic">
          {lines.map((l, i) => (
            <tspan key={i} x={540} dy={i === 0 ? 0 : 92}>{l}</tspan>
          ))}
        </text>
        <Stick x={540} y={1620} {...hero} look={scene.mood ?? 'sad'} scale={0.86} />
      </g>
    );
  }
  if (kind === 'gnews') {
    const head = wrap(scene.label ?? '', 16);
    return (
      <g>
        <rect width={W} height={H} fill={bgc(28, 16, 26)} />
        <g transform="translate(540 700) rotate(-3)">
          <rect x={-430} y={-560} width={860} height={1120} fill="#efe9da" stroke={INK} strokeWidth={10} />
          <text x={0} y={-470} textAnchor="middle" fontSize={52} fontWeight={900} fill={INK} fontFamily="Georgia, serif" letterSpacing={4}>KABAR HARIAN</text>
          <line x1={-390} y1={-432} x2={390} y2={-432} stroke={INK} strokeWidth={5} />
          <text x={0} y={-330} textAnchor="middle" fontSize={76} fontWeight={900} fill="#9b1d1d" fontFamily="Arial Black, Arial">
            {head.map((l, i) => (
              <tspan key={i} x={0} dy={i === 0 ? 0 : 86}>{l}</tspan>
            ))}
          </text>
          {Array.from({length: 7}, (_, i) => (
            <line key={i} x1={-380} y1={-120 + i * 68} x2={380} y2={-120 + i * 68} stroke="#b9b3a3" strokeWidth={9} />
          ))}
          <rect x={-380} y={360} width={340} height={180} fill="#d9d3c3" stroke={INK} strokeWidth={5} />
        </g>
        <Stick x={250} y={1720} {...hero} look="shock" scale={0.72} />
      </g>
    );
  }
  if (kind === 'gship') {
    const sway = Math.sin(f / 22) * 10;
    return (
      <g>
        <rect width={W} height={H} fill={bgc(220, 46, 12)} />
        {Array.from({length: 40}, (_, i) => (
          <circle key={i} cx={rand(i + 4) * W} cy={rand(i + 40) * 900} r={3} fill="#fff" opacity={0.8} />
        ))}
        <circle cx={300} cy={330} r={120} fill="#f2ecd3" opacity={0.85} stroke={INK} strokeWidth={6} />
        <rect y={1180} width={W} height={740} fill={bgc(220, 52, 18)} />
        {Array.from({length: 6}, (_, i) => (
          <path key={i} d={`M0 ${1250 + i * 120} Q270 ${1230 + i * 120} 540 ${1250 + i * 120} T1080 ${1250 + i * 120}`} fill="none" stroke={bgc(220, 40, 30)} strokeWidth={8} opacity={0.7} />
        ))}
        <g transform={`translate(540 ${1130 + sway}) rotate(${sway * 0.15})`}>
          <path d="M-370 40 L370 40 L300 150 L-300 150 Z" fill="#141b2e" stroke={INK} strokeWidth={9} />
          <rect x={-300} y={-30} width={600} height={72} fill="#1d2740" stroke={INK} strokeWidth={8} />
          {[-180, -60, 60, 180].map((fx) => (
            <rect key={fx} x={fx - 28} y={-150} width={56} height={120} rx={8} fill="#3a2320" stroke={INK} strokeWidth={7} />
          ))}
          {[-250, -170, -90, -10, 70, 150, 230].map((px) => (
            <circle key={px} cx={px} cy={10} r={11} fill="#ffd76a" />
          ))}
          <Stick x={-20} y={-30} {...hero} look="neutral" scale={0.34} />
        </g>
      </g>
    );
  }
  if (kind === 'gxray') {
    const glow = 0.5 + Math.sin(f / 7) * 0.12;
    const fingers: [number, number][] = [
      [-120, -140],
      [-60, -170],
      [0, -180],
      [60, -170],
      [118, -150],
    ];
    return (
      <g>
        <rect width={W} height={H} fill={bgc(192, 42, 9)} />
        <g transform="translate(600 760)">
          <rect x={-240} y={-320} width={480} height={660} rx={22} fill={bgc(186, 60, 20)} stroke={accent} strokeWidth={10} opacity={0.92} />
          <circle r={260} fill="#bfe8ff" opacity={0.12 * (glow / 0.5)} />
          <g stroke="#eaf6ff" strokeWidth={13} strokeLinecap="round" fill="none" opacity={0.92}>
            <path d="M-70 300 L-50 150 M70 300 L50 150" />
            {fingers.map(([fx, fy], i) => (
              <g key={i}>
                <line x1={fx * 0.5} y1={140} x2={fx} y2={fy} />
                <line x1={fx} y1={fy} x2={fx * 1.25} y2={fy - 120} />
                <circle cx={fx} cy={fy} r={7} fill="#eaf6ff" />
              </g>
            ))}
            <path d="M-80 150 Q0 120 80 150" />
          </g>
          <circle cx={-60} cy={-50} r={16} fill="none" stroke="#ffd76a" strokeWidth={9} />
        </g>
        <Stick x={210} y={1660} {...hero} look="shock" scale={0.86} />
      </g>
    );
  }
  if (kind === 'gescape') {
    const step = interpolate(f, [0, Math.max(len, 1)], [0, 1], {extrapolateRight: 'clamp'});
    const gx = interpolate(step, [0, 1], [430, 700]);
    return (
      <g>
        <rect width={W} height={H} fill={bgc(265, 30, 9)} />
        {Array.from({length: 24}, (_, i) => (
          <circle key={i} cx={rand(i + 2) * W} cy={rand(i + 30) * 760} r={3} fill="#fff" opacity={0.7} />
        ))}
        <rect y={1500} width={W} height={420} fill={bgc(265, 22, 6)} />
        <rect x={650} y={360} width={360} height={1150} fill={bgc(265, 24, 14)} stroke={INK} strokeWidth={10} />
        <path d="M700 420 L980 420 L980 1500 L700 1500 Z" fill={bgc(45, 70, 36)} opacity={0.9} stroke={INK} strokeWidth={8} />
        <path d="M700 420 L820 470 L820 1500 L700 1500 Z" fill={bgc(45, 55, 24)} stroke={INK} strokeWidth={6} />
        <circle cx={1010} cy={320} r={110} fill="#f2ecd3" opacity={0.7} stroke={INK} strokeWidth={6} />
        <Stick x={gx} y={1560} {...hero} walking look="shock" scale={1.02} />
      </g>
    );
  }
  if (kind === 'gfield') {
    const vpx = 540;
    const vpy = 820;
    return (
      <g>
        <rect width={W} height={H} fill={bgc(96, 44, 58)} />
        <circle cx={820} cy={320} r={110} fill="#ffe08a" opacity={0.85} />
        <rect y={780} width={W} height={1140} fill={bgc(96, 42, 36)} />
        {Array.from({length: 11}, (_, i) => {
          const bx = (i / 10) * (W + 900) - 450;
          return <line key={`f${i}`} x1={bx} y1={1920} x2={vpx} y2={vpy} stroke={bgc(96, 46, 28)} strokeWidth={10} opacity={0.75} />;
        })}
        {Array.from({length: 4}, (_, i) => {
          const yy = vpy + 40 + i * i * 30;
          return <line key={`h${i}`} x1={0} y1={yy} x2={W} y2={yy} stroke={bgc(96, 40, 30)} strokeWidth={6} opacity={0.5} />;
        })}
        <Stick x={330} y={1700} {...hero} look="neutral" scale={1.04} />
      </g>
    );
  }
  if (kind === 'ggive') {
    const pulse = 0.22 + Math.sin(f / 8) * 0.06;
    return (
      <g>
        <rect width={W} height={H} fill={bgc(44, 44, 26)} />
        <rect y={1500} width={W} height={420} fill={bgc(40, 40, 16)} />
        {Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2 + f / 60;
          return <line key={i} x1={540 + Math.cos(a) * 130} y1={1150 + Math.sin(a) * 130} x2={540 + Math.cos(a) * 420} y2={1150 + Math.sin(a) * 420} stroke={accent} strokeWidth={10} strokeLinecap="round" opacity={0.5} />;
        })}
        <circle cx={540} cy={1150} r={210} fill={accent} opacity={pulse} />
        <Stick x={540} y={1620} {...hero} look="happy" scale={1.1} armL={58} armR={58} />
        <g transform="translate(540 1150)">
          <circle r={74} fill="#fff3b0" stroke={INK} strokeWidth={7} />
          <path d="M0 -34 C-30 -62 -74 -30 0 26 C74 -30 30 -62 0 -34 Z" fill="#e4572e" stroke={INK} strokeWidth={5} />
        </g>
      </g>
    );
  }
  if (kind === 'gjail') {
    return (
      <g>
        <rect width={W} height={H} fill={bgc(30, 12, 16)} />
        <rect y={1500} width={W} height={420} fill={bgc(30, 10, 9)} />
        <rect x={360} y={220} width={360} height={360} fill={bgc(220, 30, 18)} stroke={INK} strokeWidth={12} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={430 + i * 110} y={220} width={16} height={360} fill="#0d0e13" />
        ))}
        <circle cx={540} cy={360} r={70} fill="#f2ecd3" opacity={0.6} />
        <Stick x={540} y={1560} {...hero} look="sad" scale={1.1} />
        {Array.from({length: 7}, (_, i) => (
          <rect key={`b${i}`} x={i * 165 + 30} y={0} width={26} height={H} fill="#24242b" stroke={INK} strokeWidth={5} />
        ))}
      </g>
    );
  }
  if (kind === 'gkitchen') {
    return (
      <g>
        <rect width={W} height={H} fill={bgc(300, 26, 30)} />
        {Array.from({length: 7}, (_, i) => (
          <line key={`v${i}`} x1={i * 160} y1={0} x2={i * 160} y2={1180} stroke={bgc(300, 20, 24)} strokeWidth={4} />
        ))}
        <rect y={1140} width={W} height={60} fill="#b98a5a" stroke={INK} strokeWidth={8} />
        <rect y={1200} width={W} height={720} fill={bgc(300, 18, 20)} />
        <Dish x={760} y={1120} r={130} />
        <Dish x={760} y={1092} r={130} />
        <Dish x={760} y={1064} r={130} />
        <g transform="translate(470 1030)">
          <circle r={96} fill="#d7e2e8" stroke={INK} strokeWidth={7} />
          <circle r={60} fill="#ecd98f" stroke={INK} strokeWidth={4} />
          <path d="M70 -66 L96 -40 L62 -30 Z" fill={bgc(300, 26, 30)} stroke={INK} strokeWidth={4} />
        </g>
        <Stick x={250} y={1560} {...hero} look="neutral" talking scale={1.05} armR={52} />
      </g>
    );
  }

  // ====== CONCEPT scenes — story-first explainers (mental models etc.) ======
  if (kind === 'cpot') {
    // boiling-frog pot: a frog sits in water that heats up with `heat` (0..1)
    const heat = scene.heat ?? 0;
    const cx = 540;
    const potTop = 1150;
    const potBot = 1495;
    const htTop = 300; // half-width at pot top
    const htBot = 235; // half-width at pot bottom
    const hw = (yy: number) => htTop + (htBot - htTop) * ((yy - potTop) / (potBot - potTop));
    const waterY = 1248;
    const wTop = hw(waterY) - 14;
    const wBot = htBot - 14;
    const hue = interpolate(heat, [0, 1], [205, 8]);
    const bg = `hsl(${hue} ${interpolate(heat, [0, 1], [34, 66])}% ${interpolate(heat, [0, 1], [44, 34])}%)`;
    const waterFill = `hsl(${interpolate(heat, [0, 1], [205, 12])} ${interpolate(heat, [0, 1], [55, 72])}% 52%)`;
    const flame = 0.3 + heat * 0.7;
    const bubbleN = Math.round(heat * 9);
    return (
      <g>
        <rect width={W} height={H} fill={bg} />
        {/* steam wisps rising above the pot */}
        {Array.from({length: 6}, (_, i) => {
          const t = ((f / 2 + i * 32) % 170) / 170;
          const sx = cx - 140 + i * 56;
          return (
            <path
              key={i}
              d={`M${sx} ${potTop - 30 - t * 540} q 22 -44 0 -88 q -22 -44 0 -88`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={11}
              strokeLinecap="round"
              opacity={heat * (1 - t) * 0.6}
            />
          );
        })}
        {/* thermometer */}
        <g transform="translate(948 700)">
          <rect x={-18} y={0} width={36} height={360} rx={18} fill="#fff" stroke={INK} strokeWidth={7} />
          <circle cx={0} cy={404} r={46} fill="#c9412f" stroke={INK} strokeWidth={7} />
          <rect x={-10} y={interpolate(heat, [0, 1], [330, 18])} width={20} height={interpolate(heat, [0, 1], [86, 398])} rx={10} fill="#c9412f" />
        </g>
        {/* frog sits in the pot (lower half gets covered by water) */}
        <Frog x={cx} y={1372} scale={0.74} look={heat > 0.72 ? 'shock' : heat > 0.4 ? 'neutral' : 'happy'} talking={heat < 0.4} />
        {/* water in front of the frog */}
        <path
          d={`M${cx - wTop} ${waterY} Q${cx} ${waterY - 20} ${cx + wTop} ${waterY} L${cx + wBot} ${potBot - 6} Q${cx} ${potBot + 8} ${cx - wBot} ${potBot - 6} Z`}
          fill={waterFill}
          opacity={0.62}
          stroke="#ffffffaa"
          strokeWidth={5}
        />
        {Array.from({length: bubbleN}, (_, i) => {
          const t = ((f / 2 + i * 22) % 90) / 90;
          return <circle key={i} cx={cx - 150 + rand(i + 3) * 300} cy={potBot - 20 - t * 210} r={6 + rand(i + 9) * 8} fill="#ffffff" opacity={0.5 * (1 - t)} />;
        })}
        {/* pot: sides + base drawn in front so the water and frog read as inside it */}
        <path d={`M${cx - htTop} ${potTop} L${cx - htBot} ${potBot}`} stroke={INK} strokeWidth={10} fill="none" />
        <path d={`M${cx + htTop} ${potTop} L${cx + htBot} ${potBot}`} stroke={INK} strokeWidth={10} fill="none" />
        <path d={`M${cx - htBot} ${potBot} Q${cx - htBot} ${potBot + 42} ${cx - htBot + 42} ${potBot + 42} L${cx + htBot - 42} ${potBot + 42} Q${cx + htBot} ${potBot + 42} ${cx + htBot} ${potBot}`} stroke={INK} strokeWidth={10} fill="#474b54" />
        <ellipse cx={cx - htTop - 12} cy={potTop - 8} rx={30} ry={46} fill="none" stroke={INK} strokeWidth={12} />
        <ellipse cx={cx + htTop + 12} cy={potTop - 8} rx={30} ry={46} fill="none" stroke={INK} strokeWidth={12} />
        <rect x={cx - htTop - 26} y={potTop - 30} width={(htTop + 26) * 2} height={34} rx={14} fill="#5b616b" stroke={INK} strokeWidth={9} />
        {/* stove flames under the pot */}
        {Array.from({length: 7}, (_, i) => {
          const fx = cx - 150 + i * 50;
          const flick = (Math.sin(f / 4 + i) * 0.5 + 0.5) * 20;
          const h = 60 * flame + flick;
          return (
            <path
              key={i}
              d={`M${fx} ${potBot + 42} Q${fx - 22} ${potBot + 42 - h * 0.6} ${fx} ${potBot + 42 - h} Q${fx + 22} ${potBot + 42 - h * 0.6} ${fx} ${potBot + 42} Z`}
              fill={i % 2 ? '#ffb43d' : '#ff7a2f'}
              stroke={INK}
              strokeWidth={4}
            />
          );
        })}
        {scene.bubble ? <ThoughtCloud x={300} y={560} text={scene.bubble} /> : null}
        {scene.label ? <TopTag text={scene.label} /> : null}
      </g>
    );
  }
  if (kind === 'cstory') {
    return (
      <g>
        <rect width={W} height={H} fill="#3b4a63" />
        <rect y={1480} width={W} height={440} fill="#28334a" />
        <rect x={160} y={1300} width={760} height={56} rx={14} fill="#6b5236" stroke={INK} strokeWidth={8} />
        {scene.prop ? <GProp prop={scene.prop} x={820} y={1300} f={f} /> : null}
        {scene.bubble ? <ThoughtCloud x={700} y={650} text={scene.bubble} /> : null}
        <Actor char={scene.char} x={400} y={1540} {...hero} look={scene.mood ?? 'neutral'} talking scale={1.1} armR={40} />
        {scene.label ? <TopTag text={scene.label} /> : null}
      </g>
    );
  }
  if (kind === 'cthink') {
    return (
      <g>
        <rect width={W} height={H} fill="#2a2f3e" />
        <rect y={1500} width={W} height={420} fill="#191d28" />
        {scene.bubble ? <ThoughtCloud x={540} y={620} text={scene.bubble} /> : null}
        <Actor char={scene.char} x={540} y={1600} {...hero} look={scene.mood ?? 'sad'} scale={1.05} />
      </g>
    );
  }
  if (kind === 'cdilemma') {
    const opts: Array<[string | undefined, number, string]> = [
      [scene.optL, 290, '#c9412f'],
      [scene.optR, 790, '#2f7d4f'],
    ];
    return (
      <g>
        <rect width={W} height={H} fill="#38415a" />
        <rect y={1500} width={W} height={420} fill="#232a3d" />
        {opts.map(([text, x, color], k) =>
          text ? (
            <g key={k}>
              <line x1={540} y1={1180} x2={x} y2={560} stroke="#ffffff66" strokeWidth={10} strokeDasharray="4 20" strokeLinecap="round" />
              <g transform={`translate(${x} 470)`}>
                <rect x={-210} y={-82} width={420} height={164} rx={18} fill={color} stroke={INK} strokeWidth={9} />
                <text y={16} textAnchor="middle" fontSize={48} fontWeight={900} fill="#fff" fontFamily="Arial Black, Arial">
                  {wrap(text, 12).map((l, i, a) => (
                    <tspan key={i} x={0} dy={i === 0 ? (a.length > 1 ? -22 : 0) : 56}>{l}</tspan>
                  ))}
                </text>
              </g>
            </g>
          ) : null,
        )}
        <Actor char={scene.char} x={540} y={1560} {...hero} look="shock" scale={1.1} armL={60} armR={60} />
      </g>
    );
  }
  if (kind === 'cdrain') {
    return (
      <g>
        <rect width={W} height={H} fill="#5a4a2e" />
        <rect y={1480} width={W} height={440} fill="#3a2f1d" />
        <Coins f={f} label={scene.label} />
        <Actor char={scene.char} x={885} y={1540} {...hero} look="sad" scale={0.95} />
      </g>
    );
  }
  if (kind === 'cterm') {
    const defLines = scene.def ? wrap(scene.def, 26) : [];
    const termLines = wrap(scene.term ?? '', 16);
    return (
      <g>
        <rect width={W} height={H} fill="#12162a" />
        {Array.from({length: 16}, (_, i) => {
          const a = (i / 16) * Math.PI * 2 + f / 70;
          return <line key={i} x1={540 + Math.cos(a) * 180} y1={540 + Math.sin(a) * 180} x2={540 + Math.cos(a) * 720} y2={540 + Math.sin(a) * 720} stroke={accent} strokeWidth={10} opacity={0.5} />;
        })}
        <g transform={`translate(540 540) scale(${pop})`}>
          <rect x={-450} y={-150} width={900} height={300} rx={24} fill={accent} stroke={INK} strokeWidth={12} />
          <text x={0} y={termLines.length > 1 ? -16 : 28} textAnchor="middle" fontSize={termLines.length > 1 ? 70 : 90} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">
            {termLines.map((l, i) => (
              <tspan key={i} x={0} dy={i === 0 ? 0 : 82}>{l}</tspan>
            ))}
          </text>
        </g>
        {defLines.length ? (
          <text x={540} y={840} textAnchor="middle" fontSize={44} fontWeight={700} fill="#dfe3ee" fontFamily="Arial, sans-serif">
            {defLines.map((l, i) => (
              <tspan key={i} x={540} dy={i === 0 ? 0 : 54}>{l}</tspan>
            ))}
          </text>
        ) : null}
        <Actor char={scene.char} x={540} y={1620} {...hero} look="happy" scale={1.0} armL={120} />
      </g>
    );
  }
  if (kind === 'cwhy') {
    return (
      <g>
        <rect width={W} height={H} fill="#1f3a34" />
        <rect y={1500} width={W} height={420} fill="#14241f" />
        <Note points={scene.points} label={scene.label} />
        <Actor char={scene.char} x={540} y={1600} {...hero} look="neutral" talking scale={0.98} armR={55} />
      </g>
    );
  }
  if (kind === 'clesson') {
    return (
      <g>
        <rect width={W} height={H} fill="#14306b" />
        {scene.label ? (
          <g transform={`translate(540 600) scale(${pop})`}>
            <text x={0} y={0} textAnchor="middle" fontSize={76} fontWeight={900} fill="#fff" stroke={INK} strokeWidth={3} paintOrder="stroke" fontFamily="Arial Black, Arial">
              {wrap(scene.label, 16).map((l, i) => (
                <tspan key={i} x={0} dy={i === 0 ? 0 : 92}>{l}</tspan>
              ))}
            </text>
          </g>
        ) : null}
        <rect y={1500} width={W} height={420} fill="#0e1f47" />
        <Actor char={scene.char} x={540} y={1600} {...hero} look="happy" scale={1.1} armL={140} armR={140} />
      </g>
    );
  }
  if (kind === 'coutro') {
    return (
      <g>
        <rect width={W} height={H} fill="#141c44" />
        {Array.from({length: 26}, (_, i) => (
          <circle key={i} cx={rand(i + 8) * W} cy={rand(i + 60) * 950} r={4} fill="#fff" />
        ))}
        <circle cx={760} cy={340} r={140} fill="#f2ecd3" stroke={INK} strokeWidth={9} />
        <path d="M0 1320 Q540 1190 1080 1320 V1920 H0 Z" fill="#223044" stroke={INK} strokeWidth={9} />
        {scene.label ? <TopTag text={scene.label} /> : null}
        <Actor char={scene.char} x={540} y={1540} {...hero} look="happy" scale={1.05} armL={120} />
      </g>
    );
  }

  if (kind === 'room') {
    return (
      <g>
        <Room />
        <Stick x={430} y={1500} old look="sad" scale={1.15} talking armL={8} armR={8} />
      </g>
    );
  }

  if (kind === 'lab') {
    return (
      <g>
        <rect width={W} height={H} fill="#1e2b45" />
        <rect y={1500} width={W} height={420} fill="#392b24" />
        <rect y={1492} width={W} height={12} fill={INK} />
        {/* tesla coil */}
        <rect x={760} y={1100} width={240} height={400} fill="#8a6a45" stroke={INK} strokeWidth={9} />
        <rect x={800} y={620} width={160} height={490} fill="#c8783a" stroke={INK} strokeWidth={9} />
        {Array.from({length: 11}, (_, i) => (
          <line key={i} x1={800} y1={650 + i * 42} x2={960} y2={650 + i * 42} stroke="#7d4620" strokeWidth={7} />
        ))}
        <ellipse cx={880} cy={590} rx={165} ry={58} fill="#c9d3dc" stroke={INK} strokeWidth={9} />
        <Bolt from={[780, 580]} to={[440, 250]} seed={seed} />
        <Bolt from={[880, 545]} to={[930, 180]} seed={seed + 20} />
        <Stick x={380} y={1540} look="shock" scale={1.25} armR={160} armL={14} />
        <Bulb x={530} y={800} />
      </g>
    );
  }

  if (kind === 'rival') {
    const leave = interpolate(f, [len * 0.55, len], [0, 620], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <g>
        <rect width={W} height={H} fill="#d98f3f" />
        <rect y={1500} width={W} height={420} fill="#6e3f24" />
        <rect y={1492} width={W} height={12} fill={INK} />
        <g opacity={interpolate(f, [8, 16], [0, 1], {extrapolateRight: 'clamp'})}>
          <path d="M60 470 H400 V690 H250 L180 780 V690 H60 Z" fill="#fff" stroke={INK} strokeWidth={9} />
          <text x={230} y={620} textAnchor="middle" fontSize={130} fontWeight={900} fill="#c9412f" fontFamily="Arial Black, Arial">DC</text>
        </g>
        <g opacity={interpolate(f, [22, 30], [0, 1], {extrapolateRight: 'clamp'}) * interpolate(leave, [0, 200], [1, 0], {extrapolateRight: 'clamp'})}>
          <path d="M680 470 H1020 V690 H900 V780 L830 690 H680 Z" fill="#fff" stroke={INK} strokeWidth={9} />
          <text x={850} y={620} textAnchor="middle" fontSize={130} fontWeight={900} fill="#1d78b8" fontFamily="Arial Black, Arial">AC</text>
        </g>
        <Stick x={270} y={1540} look="angry" hair="#d5d5d8" bowTie scale={1.1} armR={60} talking={leave === 0} />
        <Stick x={800 + leave} y={1540} look="angry" scale={1.1} flip={leave === 0} walking={leave > 0} />
      </g>
    );
  }

  if (kind === 'wave') {
    const pts = Array.from({length: 112}, (_, i) => {
      const x = i * 10;
      return `${x},${760 + Math.sin(i / 8 - f / 5) * 165}`;
    }).join(' ');
    const lit = interpolate(f, [15, len - 10], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
    return (
      <g>
        <rect width={W} height={H} fill="#10264d" />
        <text x={540} y={420} textAnchor="middle" fontSize={190} fontWeight={900} fill="#ffd23f" stroke={INK} strokeWidth={10} paintOrder="stroke" fontFamily="Arial Black, Arial">AC</text>
        <polyline points={pts} fill="none" stroke="#7fd4ff" strokeWidth={30} opacity={0.3} />
        <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth={12} strokeLinejoin="round" />
        <rect y={1500} width={W} height={420} fill="#22452f" />
        <rect y={1492} width={W} height={12} fill={INK} />
        {[0, 1, 2, 3].map((i) => {
          const x = 620 + i * 145;
          return (
            <g key={i} transform={`translate(${x - 70} 0)`}>
              <path d="M0 1500 V1385 L70 1320 L140 1385 V1500 Z" fill={rand(i + 3) * 0.8 + 0.1 < lit ? '#ffd76a' : '#8b7a68'} stroke={INK} strokeWidth={8} />
            </g>
          );
        })}
        <Stick x={290} y={1540} look="happy" scale={1.1} armR={125} talking />
      </g>
    );
  }

  if (kind === 'fair') {
    const lit = interpolate(f, [0, len * 0.7], [0, 1], {extrapolateRight: 'clamp'});
    return (
      <g>
        <rect width={W} height={H} fill="#141a3c" />
        <path d="M60 960 H1020 V1500 H60 Z" fill="#ece3cf" stroke={INK} strokeWidth={10} />
        <path d="M270 960 C280 680 800 680 810 960 Z" fill="#f7efdf" stroke={INK} strokeWidth={10} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={110 + i * 165} y={1030} width={70} height={470} fill="#cfc2a6" stroke={INK} strokeWidth={7} />
        ))}
        <rect y={1500} width={W} height={420} fill="#30263a" />
        <rect y={1492} width={W} height={12} fill={INK} />
        {Array.from({length: 54}, (_, i) => {
          const row = i % 3;
          const col = Math.floor(i / 3);
          const on = rand(i + 9) < lit;
          return (
            <g key={i}>
              {on ? <circle cx={75 + col * 56} cy={940 + row * 34} r={22} fill="#ffdf73" opacity={0.35} /> : null}
              <circle cx={75 + col * 56} cy={940 + row * 34} r={10} fill={on ? '#fff4b8' : '#6d6a68'} />
            </g>
          );
        })}
        <Stick x={540} y={1540} look="happy" scale={1.15} armL={150} armR={150} />
      </g>
    );
  }

  if (kind === 'contract') {
    const tear = interpolate(f, [len * 0.3, len * 0.55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <g>
        <rect width={W} height={H} fill="#7d3f3a" />
        <rect y={1500} width={W} height={420} fill="#40221f" />
        <rect y={1492} width={W} height={12} fill={INK} />
        <g transform={`translate(${-tear * 190} ${tear * 70}) rotate(${-tear * 13} 540 620)`}>
          <path d="M270 300 H540 L500 460 L560 620 L505 780 L540 930 H270 Z" fill="#f8efd8" stroke={INK} strokeWidth={9} />
          <text x={300} y={410} fontSize={58} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">ROYA</text>
          {[510, 590, 670, 750].map((y) => (
            <line key={y} x1={315} y1={y} x2={470} y2={y} stroke="#857b67" strokeWidth={12} />
          ))}
        </g>
        <g transform={`translate(${tear * 190} ${tear * 70}) rotate(${tear * 13} 540 620)`}>
          <path d="M540 300 H810 V930 H540 L505 780 L560 620 L500 460 Z" fill="#f8efd8" stroke={INK} strokeWidth={9} />
          <text x={555} y={410} fontSize={58} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">LTI</text>
          {[510, 590, 670, 750].map((y) => (
            <line key={y} x1={600} y1={y} x2={765} y2={y} stroke="#857b67" strokeWidth={12} />
          ))}
        </g>
        <Stick x={540} y={1560} look="neutral" scale={1.05} armL={72} armR={72} />
      </g>
    );
  }

  if (kind === 'tower') {
    const ring = (i: number) => ((f + i * 22) % 66) / 66;
    return (
      <g>
        <defs>
          <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#101b4a" />
            <stop offset="1" stopColor="#8e4aa3" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#dusk)" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={540} cy={470} r={120 + ring(i) * 800} fill="none" stroke="#9fe0ff" strokeWidth={10} opacity={(1 - ring(i)) * 0.75} />
        ))}
        <path d="M0 1400 Q540 1180 1080 1400 V1920 H0 Z" fill="#1f3c2a" stroke={INK} strokeWidth={9} />
        <LatticeTower />
        <Stick x={540} y={1540} look="happy" scale={1.05} armL={135} armR={135} />
        <Bulb x={346} y={950} />
        <Bulb x={734} y={950} />
      </g>
    );
  }

  if (kind === 'fall') {
    const fall = interpolate(f, [len * 0.3, len * 0.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const eased = fall * fall;
    return (
      <g>
        <rect width={W} height={H} fill="#3e4656" />
        <Rain area={[0, 0, W, 1450]} />
        <path d="M0 1400 Q540 1180 1080 1400 V1920 H0 Z" fill="#26342c" stroke={INK} strokeWidth={9} />
        <g transform={`rotate(${eased * 78} 685 1320)`} opacity={interpolate(fall, [0.85, 1], [1, 0.45])}>
          <LatticeTower />
        </g>
        {fall > 0.8
          ? Array.from({length: 12}, (_, i) => (
              <circle key={i} cx={760 + rand(i) * 300} cy={1270 + rand(i + 7) * 120} r={45 + rand(i + 3) * 55} fill="#a59e92" opacity={0.55} />
            ))
          : null}
        <Stick x={230} y={1540} look="sad" scale={0.95} />
      </g>
    );
  }

  const doctor = {hair: '#8f8d92', bowTie: true, coat: '#f3f0e6'};
  const labWall = (
    <g>
      <rect width={W} height={H} fill="#9dbfae" />
      <rect y={1500} width={W} height={420} fill="#51604f" />
      <rect y={1492} width={W} height={12} fill={INK} />
    </g>
  );
  const bench = (
    <g>
      <rect x={470} y={1140} width={600} height={40} fill="#8a6a45" stroke={INK} strokeWidth={8} />
      <rect x={510} y={1180} width={30} height={320} fill="#6c5236" stroke={INK} strokeWidth={7} />
      <rect x={1000} y={1180} width={30} height={320} fill="#6c5236" stroke={INK} strokeWidth={7} />
    </g>
  );

  if (kind === 'messyLab') {
    return (
      <g>
        {labWall}
        {[[120, 240, -7], [420, 170, 5], [720, 300, -4]].map(([x, y, r], i) => (
          <g key={i} transform={`rotate(${r} ${x} ${y})`}>
            <rect x={x} y={y} width={230} height={290} fill="#f6f0dc" stroke={INK} strokeWidth={7} />
            {[0, 1, 2, 3].map((l) => (
              <line key={l} x1={x + 28} y1={y + 60 + l * 58} x2={x + 200} y2={y + 60 + l * 58} stroke="#8c8675" strokeWidth={10} />
            ))}
          </g>
        ))}
        <g transform="rotate(4 900 720)">
          <rect x={790} y={650} width={210} height={150} fill="#fff" stroke={INK} strokeWidth={7} />
          <text x={895} y={752} textAnchor="middle" fontSize={66} fontWeight={900} fill="#c9412f" fontFamily="Arial Black, Arial">1928</text>
        </g>
        {bench}
        {[0, 1, 2].map((c) =>
          Array.from({length: 2 + ((c * 3) % 4)}, (_, i) => (
            <Dish key={`${c}-${i}`} x={570 + c * 130 + (i % 2) * 12} y={1118 - i * 34} r={58} />
          )),
        )}
        <Flask x={950} y={1140} fill="#8bd17c" level={0.5} />
        <Stick x={270} y={1540} {...doctor} scale={1.1} talking armR={65} />
      </g>
    );
  }

  if (kind === 'holiday') {
    const walk = interpolate(f, [len * 0.2, len * 0.9], [320, 1240], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <g>
        {labWall}
        <rect x={750} y={760} width={330} height={740} fill="#fff1b0" stroke={INK} strokeWidth={10} />
        <circle cx={930} cy={930} r={85} fill="#ffc83d" stroke={INK} strokeWidth={8} />
        <rect x={60} y={1140} width={480} height={40} fill="#8a6a45" stroke={INK} strokeWidth={8} />
        <rect x={100} y={1180} width={30} height={320} fill="#6c5236" stroke={INK} strokeWidth={7} />
        <rect x={470} y={1180} width={30} height={320} fill="#6c5236" stroke={INK} strokeWidth={7} />
        <Dish x={300} y={1118} r={70} />
        <Stick x={walk} y={1540} {...doctor} look="happy" scale={1.1} walking />
        <rect x={walk + 62} y={1230} width={150} height={110} rx={12} fill="#8d5a33" stroke={INK} strokeWidth={8} />
      </g>
    );
  }

  if (kind === 'discover') {
    const grow = interpolate(f, [8, len - 8], [0.15, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <g>
        {labWall}
        <Stick x={310} y={1540} {...doctor} look="shock" scale={1.15} armR={95} />
        <Dish x={700} y={1000} r={190} />
        <Mold x={700} y={1000} r={100 * grow} seed={1} />
      </g>
    );
  }

  if (kind === 'petri') {
    const clear = interpolate(f, [12, len - 15], [130, 340], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <g>
        <rect width={W} height={H} fill="#17213a" />
        <circle cx={540} cy={820} r={500} fill="#c8d6e0" stroke={INK} strokeWidth={12} />
        <circle cx={540} cy={820} r={465} fill="#ecd98f" stroke={INK} strokeWidth={8} />
        {Array.from({length: 90}, (_, i) => {
          const a = rand(i) * Math.PI * 2;
          const d = 150 + rand(i + 200) * 300;
          const gone = d < clear;
          return gone ? null : (
            <circle key={i} cx={540 + Math.cos(a) * d} cy={820 + Math.sin(a) * d} r={15} fill="#d3513f" stroke={INK} strokeWidth={5} />
          );
        })}
        <circle cx={540} cy={820} r={clear} fill="none" stroke="#fff" strokeWidth={6} strokeDasharray="20 18" />
        <Mold x={540} y={820} r={115} seed={1} />
      </g>
    );
  }

  if (kind === 'bottle') {
    return (
      <g>
        <rect width={W} height={H} fill="#1e5f8c" />
        {Array.from({length: 12}, (_, i) => {
          const a = (i / 12) * Math.PI * 2 + f / 60;
          return <line key={i} x1={540 + Math.cos(a) * 430} y1={800 + Math.sin(a) * 430} x2={540 + Math.cos(a) * 540} y2={800 + Math.sin(a) * 540} stroke="#ffd23f" strokeWidth={16} strokeLinecap="round" />;
        })}
        <g transform={`translate(540 800) scale(${pop}) translate(-540 -800)`}>
          <rect x={470} y={330} width={140} height={90} fill="#c9412f" stroke={INK} strokeWidth={10} />
          <path d="M490 420 H590 V490 C700 520 730 590 730 660 V1180 C730 1230 700 1260 650 1260 H430 C380 1260 350 1230 350 1180 V660 C350 590 380 520 490 490 Z" fill="#ffd77c" stroke={INK} strokeWidth={11} />
          <rect x={350} y={760} width={380} height={230} fill="#fffaf0" stroke={INK} strokeWidth={9} />
          <text x={540} y={895} textAnchor="middle" fontSize={54} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">PENISILIN</text>
        </g>
      </g>
    );
  }

  if (kind === 'struggle') {
    return (
      <g>
        {labWall}
        {bench}
        {[0, 1, 2, 3].map((i) => (
          <Flask key={i} x={570 + i * 120} y={1140} fill="#ffd77c" level={0.06} />
        ))}
        <text x={760} y={760} textAnchor="middle" fontSize={210} fontWeight={900} fill="#c9412f" stroke={INK} strokeWidth={8} paintOrder="stroke" fontFamily="Arial Black, Arial">?</text>
        <Stick x={270} y={1540} {...doctor} look="sad" scale={1.1} />
      </g>
    );
  }

  if (kind === 'team') {
    const level = interpolate(f, [5, len - 5], [0.1, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <g>
        <rect width={W} height={H} fill="#3f7f77" />
        <rect y={1500} width={W} height={420} fill="#28423f" />
        <rect y={1492} width={W} height={12} fill={INK} />
        <g transform="translate(540 900) scale(3.1) translate(-540 -1140)">
          <Flask x={540} y={1140} fill="#ffc83d" level={level} />
        </g>
        <Stick x={190} y={1540} hair="#6a4a31" coat="#f3f0e6" look="happy" scale={1} armR={70} talking />
        <Stick x={890} y={1540} hair="#22202a" moustache coat="#f3f0e6" look="happy" scale={1} armR={70} flip />
        <Tag x={190} y={830} text="FLOREY" />
        <Tag x={890} y={830} text="CHAIN" />
      </g>
    );
  }

  if (kind === 'factory') {
    const showSoldier = f > len * 0.45;
    return (
      <g>
        <rect width={W} height={H} fill="#46566b" />
        <rect y={1500} width={W} height={420} fill="#2e2c30" />
        <rect y={1492} width={W} height={12} fill={INK} />
        <rect x={-20} y={820} width={1120} height={46} fill="#23252c" stroke={INK} strokeWidth={8} />
        {Array.from({length: 12}, (_, i) => (
          <circle key={i} cx={40 + i * 95} cy={843} r={15} fill="#8d929c" stroke={INK} strokeWidth={5} />
        ))}
        {Array.from({length: 8}, (_, i) => {
          const x = ((i * 190 + f * 9) % 1520) - 220;
          return (
            <g key={i} transform={`translate(${x} 620)`}>
              <rect x={45} width={50} height={36} fill="#c9412f" stroke={INK} strokeWidth={7} />
              <rect y={36} width={140} height={164} rx={26} fill="#ffd77c" stroke={INK} strokeWidth={8} />
              <rect y={92} width={140} height={58} fill="#fffaf0" stroke={INK} strokeWidth={6} />
            </g>
          );
        })}
        {showSoldier ? (
          <g>
            <Stick x={540} y={1540} hair="#3a2c20" coat="#5c6b3c" look="happy" scale={1} armL={140} armR={140} />
            <path d="M440 1010 C440 880 640 880 640 1010 Z" fill="#4c5a30" stroke={INK} strokeWidth={8} />
          </g>
        ) : null}
      </g>
    );
  }

  if (kind === 'nobel') {
    return (
      <g>
        <rect width={W} height={H} fill="#5b1420" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={i * 160 - 20} width={80} height={1500} fill="#74202b" />
        ))}
        <path d="M250 0 L60 1500 H1020 L830 0 Z" fill="#ffe9a6" opacity={0.18} />
        <rect x={190} y={230} width={700} height={190} rx={20} fill="#ffd23f" stroke={INK} strokeWidth={10} />
        <text x={540} y={362} textAnchor="middle" fontSize={84} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">NOBEL 1945</text>
        <rect y={1500} width={W} height={420} fill="#2d1a1e" />
        <rect y={1492} width={W} height={12} fill={INK} />
        <Stick x={190} y={1540} hair="#6a4a31" look="happy" scale={0.85} />
        <Stick x={890} y={1540} hair="#22202a" moustache look="happy" scale={0.85} />
        <Stick x={540} y={1540} hair="#8f8d92" bowTie look="happy" scale={1.05} armL={150} />
        {[[190, 0.85], [890, 0.85], [540, 1.05]].map(([x, s], i) => (
          <circle key={i} cx={x} cy={1540 - 300 * s} r={30} fill="#ffd23f" stroke={INK} strokeWidth={7} />
        ))}
      </g>
    );
  }

  if (kind === 'lastDish') {
    return (
      <g>
        <rect width={W} height={H} fill="#343a50" />
        <path d="M640 0 L1040 1500 H360 Z" fill="#ffe9a6" opacity={0.16} />
        <rect y={1500} width={W} height={420} fill="#22242e" />
        <rect y={1492} width={W} height={12} fill={INK} />
        <rect x={500} y={1180} width={400} height={36} fill="#8a6a45" stroke={INK} strokeWidth={8} />
        <rect x={680} y={1216} width={40} height={284} fill="#6c5236" stroke={INK} strokeWidth={7} />
        <Dish x={700} y={1150} r={82} />
        <Mold x={700} y={1140} r={30} seed={1} />
        <Stick x={270} y={1540} {...doctor} look="happy" scale={1.1} armR={38} />
      </g>
    );
  }

  const orville = {hair: '#3a2c20', moustache: true, coat: '#5a4634'};
  const wilbur = {hair: '#22202a', moustache: false, coat: '#3e4a5e'};
  const sky = (color: string, ground: string) => (
    <g>
      <rect width={W} height={H} fill={color} />
      <rect y={1500} width={W} height={420} fill={ground} />
      <rect y={1492} width={W} height={12} fill={INK} />
    </g>
  );

  if (kind === 'bikeShop') {
    return (
      <g>
        {sky('#e0a458', '#6e4a2c')}
        <rect x={140} y={230} width={800} height={190} rx={18} fill="#7a2f22" stroke={INK} strokeWidth={10} />
        <text x={540} y={362} textAnchor="middle" fontSize={92} fontWeight={900} fill="#ffe9a6" fontFamily="Arial Black, Arial">TOKO SEPEDA</text>
        <Bike x={540} y={1250} spin={f * 7} />
        <Stick x={170} y={1540} {...orville} look="happy" scale={1} talking />
        <Stick x={910} y={1540} {...wilbur} look="happy" scale={1} />
      </g>
    );
  }

  if (kind === 'dream') {
    return (
      <g>
        {sky('#7cc7e8', '#5c9a58')}
        <Bird x={interpolate(f, [0, len], [-100, 1180])} y={380} seed={f} />
        <circle cx={400} cy={1010} r={20} fill="#fff" stroke={INK} strokeWidth={6} />
        <circle cx={460} cy={940} r={32} fill="#fff" stroke={INK} strokeWidth={6} />
        <ellipse cx={600} cy={700} rx={420} ry={210} fill="#fff" stroke={INK} strokeWidth={9} />
        <Flyer x={600} y={700} s={0.95} prop={f} />
        <Stick x={240} y={1540} {...orville} look="happy" scale={0.95} armR={140} />
        <Stick x={800} y={1540} {...wilbur} look="happy" scale={0.95} />
      </g>
    );
  }

  if (kind === 'doubt') {
    return (
      <g>
        {sky('#b5493b', '#4d2620')}
        <g transform={`translate(540 640) rotate(-7) scale(${interpolate(pop, [0, 1], [1.6, 1])})`} opacity={pop}>
          <rect x={-420} y={-120} width={840} height={230} rx={18} fill="#fff4dc" stroke={INK} strokeWidth={12} />
          <text x={0} y={36} textAnchor="middle" fontSize={124} fontWeight={900} fill="#c9412f" fontFamily="Arial Black, Arial">MUSTAHIL</text>
        </g>
        <Stick x={240} y={1540} hair="#776552" coat="#30303a" look="happy" talking armR={75} scale={0.95} />
        <Stick x={840} y={1540} hair="#b7b0a4" coat="#46503a" moustache look="happy" talking armR={75} flip scale={0.95} />
      </g>
    );
  }

  if (kind === 'tunnel') {
    return (
      <g>
        {sky('#c79a63', '#5d432b')}
        <Bird x={interpolate(f, [0, len], [1160, -100])} y={250} seed={f} flip />
        <rect x={70} y={480} width={940} height={410} rx={12} fill="#b8dbe6" stroke={INK} strokeWidth={11} />
        {[0, 1, 2, 3, 4].map((i) =>
          [0, 1, 2].map((c) => {
            const x = 90 + ((c * 260 + i * 60 + f * 13) % 780);
            return <line key={`${i}-${c}`} x1={x} y1={540 + i * 72} x2={x + 110} y2={540 + i * 72} stroke="#fff" strokeWidth={10} strokeLinecap="round" />;
          }),
        )}
        <path d="M360 700 C440 620 650 625 760 690 C640 680 470 690 360 700 Z" fill="#f4ead2" stroke={INK} strokeWidth={8} />
        <line x1={560} y1={665} x2={560} y2={890} stroke={INK} strokeWidth={12} />
        <Stick x={290} y={1540} {...orville} look="neutral" scale={0.95} armR={115} />
        <Stick x={780} y={1540} {...wilbur} look="shock" scale={0.95} armL={115} flip />
      </g>
    );
  }

  if (kind === 'crash') {
    const t = (f % 42) / 42;
    return (
      <g>
        {sky('#8ea9bd', '#d7bd86')}
        <g transform={`translate(${260 + t * 560} ${420 + t * t * 880}) rotate(${t * 42}) scale(-1 1)`}>
          <Flyer x={0} y={0} s={0.72} />
        </g>
        {t > 0.82
          ? Array.from({length: 9}, (_, i) => (
              <circle key={i} cx={720 + rand(i) * 240} cy={1370 + rand(i + 5) * 110} r={34 + rand(i + 3) * 48} fill="#efe0ba" stroke={INK} strokeWidth={5} />
            ))
          : null}
        <Stick x={210} y={1540} {...wilbur} look="sad" scale={0.95} />
      </g>
    );
  }

  if (kind === 'beach') {
    return (
      <g>
        {sky('#a9bfd0', '#dcc48e')}
        <rect y={1330} width={W} height={165} fill="#4f83a3" />
        <rect x={200} y={220} width={680} height={210} rx={20} fill="#fff" stroke={INK} strokeWidth={10} />
        <text x={540} y={355} textAnchor="middle" fontSize={88} fontWeight={900} fill="#c9412f" fontFamily="Arial Black, Arial">17 DES 1903</text>
        <Flyer x={660} y={1190} s={0.8} prop={f} />
        <Stick x={170} y={1540} {...wilbur} look="neutral" scale={0.9} armR={20} />
      </g>
    );
  }

  if (kind === 'liftoff') {
    const rise = interpolate(f, [5, len], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
    const secs = Math.min(12, Math.floor(rise * 13));
    return (
      <g>
        {sky('#92cdea', '#dcc48e')}
        <rect x={240} y={260} width={600} height={180} rx={20} fill="#17151e" stroke="#fff" strokeWidth={8} />
        <text x={540} y={382} textAnchor="middle" fontSize={88} fontWeight={900} fill="#ffd23f" fontFamily="Arial Black, Arial">{`${secs} DETIK`}</text>
        <g transform={`translate(0 ${-rise * 470}) rotate(${7 * rise} 590 1190)`}>
          <Flyer x={590} y={1190} s={0.9} prop={f} />
        </g>
        <Stick x={interpolate(rise, [0, 1], [160, 420])} y={1540} {...wilbur} look="shock" scale={0.9} walking armL={140} armR={140} />
      </g>
    );
  }

  if (kind === 'worldSky') {
    return (
      <g>
        <rect width={W} height={H} fill="#111b45" />
        <circle cx={540} cy={860} r={385} fill="#2b7cc0" stroke={INK} strokeWidth={11} />
        <path d="M250 700 C340 560 500 590 540 690 C590 790 430 830 390 930 C310 980 210 830 250 700 Z M640 900 C740 800 900 860 880 980 C850 1120 700 1160 650 1060 Z" fill="#54a86a" stroke={INK} strokeWidth={8} />
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2 + f / 22;
          const x = 540 + Math.cos(a) * 455;
          const y = 860 + Math.sin(a) * 455;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI + 90})`}>
              <path d="M72 0 Q60 -13 20 -13 L-16 -68 H-40 L-22 -13 H-56 L-74 -34 H-88 L-78 0 L-88 34 H-74 L-56 13 H-22 L-40 68 H-16 L20 13 Q60 13 72 0 Z" fill="#fff" stroke={INK} strokeWidth={6} />
            </g>
          );
        })}
      </g>
    );
  }

  if (kind === 'moon') {
    return (
      <g>
        <rect width={W} height={H} fill="#050712" />
        {Array.from({length: 45}, (_, i) => (
          <circle key={i} cx={rand(i) * W} cy={rand(i + 90) * 1250} r={3 + rand(i + 4) * 4} fill="#fff" />
        ))}
        <circle cx={860} cy={260} r={95} fill="#2b7cc0" stroke="#fff" strokeWidth={5} />
        <path d="M0 1450 Q540 1370 1080 1450 V1920 H0 Z" fill="#a7a7ad" stroke={INK} strokeWidth={9} />
        {[[160, 1840, 90], [850, 1830, 120], [860, 1500, 60]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.32} fill="#88888f" stroke={INK} strokeWidth={6} />
        ))}
        <rect x={120} y={240} width={330} height={150} rx={18} fill="#17151e" stroke="#fff" strokeWidth={7} />
        <text x={285} y={345} textAnchor="middle" fontSize={84} fontWeight={900} fill="#ffd23f" fontFamily="Arial Black, Arial">1969</text>
        <Stick x={430} y={1540} hair="#eef0f2" coat="#eef0f2" look="happy" scale={1.05} armR={105} />
        <circle cx={430} cy={1020} r={124} fill="#bfe5ff" opacity={0.28} stroke={INK} strokeWidth={9} />
        <g transform={`translate(685 1155) rotate(${Math.sin(f / 12) * 5})`}>
          <rect x={-85} y={-120} width={170} height={120} fill="#e8dcc0" stroke={INK} strokeWidth={8} />
          <path d="M-85 -82 L-45 -58 L-62 -30 M40 -120 L80 -68" fill="none" stroke="#a6946d" strokeWidth={6} />
        </g>
      </g>
    );
  }

  if (kind === 'dreamEnd') {
    return (
      <g>
        <rect width={W} height={H} fill="#141c44" />
        {Array.from({length: 30}, (_, i) => (
          <circle key={i} cx={rand(i + 8) * W} cy={rand(i + 60) * 950} r={4} fill="#fff" />
        ))}
        <circle cx={760} cy={380} r={160} fill="#f2ecd3" stroke={INK} strokeWidth={9} />
        <path d="M0 1320 Q540 1190 1080 1320 V1920 H0 Z" fill="#284029" stroke={INK} strokeWidth={9} />
        <Stick x={380} y={1540} {...orville} look="happy" scale={1} armR={140} />
        <Stick x={700} y={1540} {...wilbur} look="happy" scale={1} />
      </g>
    );
  }

  const galileo = {hair: '#543d2b', moustache: true, coat: '#3a2e2b'};
  const oldGalileo = {hair: '#cfcbc4', moustache: true, coat: '#2e2624'};
  const inquisitor = {hair: '#1b1a22', moustache: false, coat: '#801818'};
  const assistant = {hair: '#2c3540', moustache: false, coat: '#414e63'};

  if (kind === 'galileoCell') {
    return (
      <g>
        <rect width={W} height={H} fill="#14161f" />
        {[0, 1, 2, 3, 4, 5, 6].map((row) => (
          <line key={row} x1={0} y1={row * 220 + 60} x2={W} y2={row * 220 + 60} stroke="#212433" strokeWidth={5} />
        ))}
        <rect y={1500} width={W} height={420} fill="#0d0e14" />
        <rect y={1492} width={W} height={12} fill={INK} />

        <path d="M720 180 L1040 180 L1080 1500 L440 1500 Z" fill="#fff5d0" opacity={0.12} />
        <rect x={720} y={160} width={280} height={340} rx={14} fill="#26344d" stroke={INK} strokeWidth={12} />
        <line x1={790} y1={160} x2={790} y2={500} stroke={INK} strokeWidth={10} />
        <line x1={860} y1={160} x2={860} y2={500} stroke={INK} strokeWidth={10} />
        <line x1={930} y1={160} x2={930} y2={500} stroke={INK} strokeWidth={10} />
        <line x1={720} y1={330} x2={1000} y2={330} stroke={INK} strokeWidth={10} />

        <path d="M220 300 Q200 480 230 680" fill="none" stroke="#606675" strokeWidth={12} strokeDasharray="18 10" />
        <circle cx={230} cy={690} r={28} fill="none" stroke="#606675" strokeWidth={12} />

        <g transform={`translate(540 330) scale(${pop}) translate(-540 -330)`}>
          <rect x={160} y={240} width={760} height={180} rx={20} fill="#7a1f1d" stroke={INK} strokeWidth={10} />
          <text x={540} y={360} textAnchor="middle" fontSize={80} fontWeight={900} fill="#ffd23f" fontFamily="Arial Black, Arial">
            DITUDUH SESAT
          </text>
        </g>

        <Stick x={460} y={1540} {...oldGalileo} look="sad" scale={1.12} talking armR={28} armL={18} />
      </g>
    );
  }

  if (kind === 'galileoPisa') {
    const drop = interpolate(f, [14, len - 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const dropY = drop * drop * 820;
    const hitGround = drop >= 0.98;

    return (
      <g>
        {sky('#7ec8f0', '#4a823b')}

        <ellipse cx={820} cy={220} rx={160} ry={50} fill="#ffffffd0" />
        <ellipse cx={750} cy={200} rx={100} ry={60} fill="#ffffffd0" />

        <g transform="rotate(5.5 360 1500)">
          <rect x={180} y={1340} width={340} height={160} rx={8} fill="#f4eedb" stroke={INK} strokeWidth={9} />
          {[0, 1, 2, 3, 4, 5].map((tier) => {
            const ty = 1340 - (tier + 1) * 115;
            return (
              <g key={tier}>
                <rect x={195} y={ty} width={310} height={115} fill="#ede3c7" stroke={INK} strokeWidth={8} />
                {[0, 1, 2, 3, 4, 5].map((c) => (
                  <line key={c} x1={215 + c * 52} y1={ty} x2={215 + c * 52} y2={ty + 115} stroke="#8c7d67" strokeWidth={8} />
                ))}
                <rect x={185} y={ty + 105} width={330} height={14} fill="#d9cdb0" stroke={INK} strokeWidth={6} />
              </g>
            );
          })}
          <rect x={220} y={570} width={260} height={80} rx={12} fill="#e5d8b8" stroke={INK} strokeWidth={8} />
          <path d="M220 570 L350 490 L480 570 Z" fill="#b8513b" stroke={INK} strokeWidth={8} />
          <Stick x={395} y={640} {...galileo} look="happy" scale={0.52} armR={115} />
        </g>

        <circle cx={430} cy={640 + dropY} r={28} fill="#2a2d34" stroke={INK} strokeWidth={6} />
        <circle cx={495} cy={640 + dropY} r={14} fill="#5d6370" stroke={INK} strokeWidth={5} />

        {hitGround
          ? Array.from({length: 8}, (_, i) => (
              <circle
                key={i}
                cx={460 + (rand(i) - 0.5) * 120}
                cy={1480 - rand(i + 4) * 35}
                r={16 + rand(i + 2) * 20}
                fill="#d8c59d"
                opacity={0.65}
              />
            ))
          : null}

        <Stick x={820} y={1540} {...assistant} look="shock" scale={0.95} armL={85} armR={85} />

        <g transform={`translate(540 250) scale(${pop}) translate(-540 -250)`}>
          <rect x={180} y={190} width={720} height={120} rx={18} fill="#17151e" stroke="#fff" strokeWidth={7} />
          <text x={540} y={272} textAnchor="middle" fontSize={58} fontWeight={900} fill="#ffd23f" fontFamily="Arial Black, Arial">
            KECEPATAN SAMA
          </text>
        </g>
      </g>
    );
  }

  if (kind === 'galileoTelescope') {
    return (
      <g>
        {sky('#131a33', '#402a1f')}

        {Array.from({length: 28}, (_, i) => (
          <circle
            key={i}
            cx={rand(i * 13) * W}
            cy={rand(i * 29 + 1) * 850}
            r={3 + rand(i) * 4}
            fill="#fff"
            opacity={0.4 + Math.sin(f / 4 + i) * 0.35}
          />
        ))}

        <circle cx={880} cy={260} r={75} fill="#fcedaa" stroke={INK} strokeWidth={7} />
        <circle cx={850} cy={240} r={65} fill="#131a33" />

        <path d="M0 1100 Q540 880 1080 1100" fill="none" stroke="#25324d" strokeWidth={24} />
        <rect x={60} y={1350} width={960} height={150} rx={6} fill="#543c2c" stroke={INK} strokeWidth={9} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={110 + i * 135} y={1200} width={50} height={150} rx={12} fill="#6e503b" stroke={INK} strokeWidth={7} />
        ))}

        <line x1={600} y1={1080} x2={490} y2={1500} stroke="#3b2518" strokeWidth={14} strokeLinecap="round" />
        <line x1={600} y1={1080} x2={600} y2={1500} stroke="#4a301f" strokeWidth={14} strokeLinecap="round" />
        <line x1={600} y1={1080} x2={720} y2={1500} stroke="#3b2518" strokeWidth={14} strokeLinecap="round" />
        <circle cx={600} cy={1080} r={24} fill="#c8963e" stroke={INK} strokeWidth={7} />

        <g transform="translate(600 1080) rotate(-32) translate(-600 -1080)">
          <rect x={420} y={1062} width={130} height={36} rx={6} fill="#b08130" stroke={INK} strokeWidth={7} />
          <rect x={550} y={1050} width={380} height={60} rx={8} fill="#e5b85c" stroke={INK} strokeWidth={8} />
          <rect x={590} y={1046} width={24} height={68} rx={4} fill="#c8963e" stroke={INK} strokeWidth={6} />
          <rect x={860} y={1046} width={24} height={68} rx={4} fill="#c8963e" stroke={INK} strokeWidth={6} />
          <rect x={930} y={1040} width={45} height={80} rx={6} fill="#ffd23f" stroke={INK} strokeWidth={8} />
          <polygon points="975,1040 1300,850 1300,1270 975,1120" fill="#ffeaa7" opacity={0.16} />
        </g>

        <Stick x={340} y={1540} {...galileo} look="happy" scale={1.08} armR={118} armL={58} talking />
      </g>
    );
  }

  if (kind === 'galileoMoons') {
    return (
      <g>
        <rect width={W} height={H} fill="#090d1f" />

        <circle cx={540} cy={820} r={460} fill="#0d142d" stroke="#36456b" strokeWidth={12} />
        <line x1={540} y1={360} x2={540} y2={1280} stroke="#2a3654" strokeWidth={4} strokeDasharray="16 12" />
        <line x1={80} y1={820} x2={1000} y2={820} stroke="#2a3654" strokeWidth={4} strokeDasharray="16 12" />

        <g transform="translate(320 620)">
          <circle r={155} fill="#e8e4d3" stroke={INK} strokeWidth={9} />
          {[
            [-45, -35, 30],
            [25, -60, 22],
            [45, 35, 38],
            [-35, 55, 26],
            [10, 0, 18],
          ].map(([cx, cy, cr], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={cr} fill="#bfbba8" stroke={INK} strokeWidth={5} />
              <circle cx={cx + cr * 0.2} cy={cy + cr * 0.2} r={cr * 0.65} fill="#9c9784" />
            </g>
          ))}
          <rect x={-140} y={180} width={280} height={50} rx={12} fill="#141c30" stroke="#fff" strokeWidth={4} />
          <text x={0} y={217} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff" fontFamily="Arial Black, Arial">
            KAWAH BULAN
          </text>
        </g>

        <g transform="translate(730 840)">
          <circle r={135} fill="#d99962" stroke={INK} strokeWidth={9} />
          <clipPath id="jup-clip">
            <circle r={135} />
          </clipPath>
          <g clipPath="url(#jup-clip)">
            <rect x={-150} y={-80} width={300} height={38} fill="#b0693a" />
            <rect x={-150} y={-20} width={300} height={44} fill="#f0c294" />
            <rect x={-150} y={40} width={300} height={38} fill="#964b28" />
            <ellipse cx={50} cy={55} rx={34} ry={22} fill="#bd3e28" stroke={INK} strokeWidth={5} />
          </g>
          <circle r={135} fill="none" stroke={INK} strokeWidth={9} />
          <rect x={-100} y={160} width={200} height={50} rx={12} fill="#141c30" stroke="#fff" strokeWidth={4} />
          <text x={0} y={197} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff" fontFamily="Arial Black, Arial">
            JUPITER
          </text>

          {[-250, -170, 170, 250].map((baseX, i) => {
            const orbitX = baseX + Math.sin(f / 8 + i * 1.6) * 36;
            return (
              <g key={i}>
                <circle cx={orbitX} cy={0} r={14} fill="#ffe699" stroke={INK} strokeWidth={4} />
                <line x1={orbitX - 18} y1={-25} x2={orbitX + 18} y2={-25} stroke="#ffd23f" strokeWidth={3} />
              </g>
            );
          })}
        </g>

        <g transform={`translate(540 230) scale(${pop}) translate(-540 -230)`}>
          <rect x={220} y={170} width={640} height={110} rx={18} fill="#17151e" stroke="#fff" strokeWidth={6} />
          <text x={540} y={246} textAnchor="middle" fontSize={54} fontWeight={900} fill="#ffd23f" fontFamily="Arial Black, Arial">
            4 BULAN JUPITER
          </text>
        </g>

        <rect y={1500} width={W} height={420} fill="#1a1c29" />
        <rect y={1492} width={W} height={12} fill={INK} />
        <Stick x={240} y={1540} {...galileo} look="shock" scale={0.95} armL={125} armR={125} />
      </g>
    );
  }

  if (kind === 'galileoOrbit') {
    const angle = (f / len) * Math.PI * 1.5 + 0.4;
    const rx = 370;
    const ry = 190;
    const earthX = 540 + Math.cos(angle) * rx;
    const earthY = 800 + Math.sin(angle) * ry;

    return (
      <g>
        <rect width={W} height={H} fill="#070a17" />

        {Array.from({length: 40}, (_, i) => (
          <circle key={i} cx={rand(i * 17) * W} cy={rand(i * 41) * 1400} r={3 + rand(i) * 3} fill="#fff" opacity={0.5} />
        ))}

        <ellipse cx={540} cy={800} rx={rx} ry={ry} fill="none" stroke="#48608f" strokeWidth={6} strokeDasharray="18 14" />

        <circle cx={540} cy={800} r={180} fill="#ffaa00" opacity={0.2} />
        <circle cx={540} cy={800} r={130} fill="#ffc83d" stroke={INK} strokeWidth={9} />
        {Array.from({length: 12}, (_, i) => {
          const a = (i / 12) * Math.PI * 2 + f / 24;
          return (
            <line
              key={i}
              x1={540 + Math.cos(a) * 135}
              y1={800 + Math.sin(a) * 135}
              x2={540 + Math.cos(a) * 175}
              y2={800 + Math.sin(a) * 175}
              stroke="#ff8800"
              strokeWidth={10}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={540} cy={800} r={105} fill="#ffe676" />
        <text x={540} y={815} textAnchor="middle" fontSize={46} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">
          MATAHARI
        </text>

        <g transform={`translate(${earthX} ${earthY})`}>
          <circle r={54} fill="#2979ff" stroke={INK} strokeWidth={7} />
          <ellipse cx={-12} cy={-10} rx={22} ry={16} fill="#4caf50" />
          <ellipse cx={16} cy={12} rx={18} ry={14} fill="#4caf50" />
          <circle cx={Math.cos(f / 4) * 85} cy={Math.sin(f / 4) * 45} r={14} fill="#e0e0e0" stroke={INK} strokeWidth={4} />
          <rect x={-60} y={-95} width={120} height={42} rx={10} fill="#0d142d" stroke="#fff" strokeWidth={3} />
          <text x={0} y={-66} textAnchor="middle" fontSize={28} fontWeight={900} fill="#fff" fontFamily="Arial Black, Arial">
            BUMI
          </text>
        </g>

        <g transform={`translate(540 250) scale(${pop}) translate(-540 -250)`}>
          <rect x={130} y={190} width={820} height={120} rx={18} fill="#ffd23f" stroke={INK} strokeWidth={9} />
          <text
            x={540}
            y={250}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={44}
            fontWeight={900}
            fill={INK}
            fontFamily="Arial Black, Arial"
          >
            BUMI MENGELILINGI MATAHARI
          </text>
        </g>

        <rect y={1500} width={W} height={420} fill="#141724" />
        <rect y={1492} width={W} height={12} fill={INK} />
        <Stick x={240} y={1540} {...galileo} look="happy" scale={1.05} armR={135} armL={30} talking />
      </g>
    );
  }

  if (kind === 'galileoTrial') {
    return (
      <g>
        <rect width={W} height={H} fill="#421319" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={60 + i * 280} y={0} width={120} height={1500} fill="#2f0d11" stroke={INK} strokeWidth={7} />
        ))}
        <path d="M0 450 Q540 600 1080 450 V0 H0 Z" fill="#691d25" stroke={INK} strokeWidth={8} />

        <rect x={140} y={880} width={800} height={200} rx={14} fill="#54382b" stroke={INK} strokeWidth={10} />
        <rect x={180} y={930} width={720} height={40} fill="#3b261d" stroke={INK} strokeWidth={6} />

        <Stick x={320} y={890} {...inquisitor} look="angry" scale={0.78} armR={40} />
        <Stick x={540} y={880} coat="#5c1015" hair="#111" look="angry" scale={0.85} armR={125} armL={35} talking />
        <Stick x={760} y={890} {...inquisitor} look="angry" scale={0.78} armL={40} flip />

        <g transform={`translate(540 220) scale(${pop}) translate(-540 -220)`}>
          <rect x={340} y={150} width={400} height={140} rx={18} fill="#fff" stroke={INK} strokeWidth={9} />
          <text x={540} y={252} textAnchor="middle" fontSize={80} fontWeight={900} fill="#c9412f" fontFamily="Arial Black, Arial">
            1633
          </text>
        </g>

        <rect y={1500} width={W} height={420} fill="#2b1a1c" />
        <rect y={1492} width={W} height={12} fill={INK} />

        <Stick x={540} y={1540} {...oldGalileo} look="sad" scale={1.08} armL={14} armR={14} />
        <rect x={480} y={1490} width={120} height={45} rx={6} fill="#f5eedc" stroke={INK} strokeWidth={5} />
      </g>
    );
  }

  if (kind === 'galileoHouseArrest') {
    return (
      <g>
        <rect width={W} height={H} fill="#3d2c25" />
        <rect y={1500} width={W} height={420} fill="#241a15" />
        <rect y={1492} width={W} height={12} fill={INK} />

        <rect x={660} y={280} width={360} height={520} fill="#0c1326" stroke={INK} strokeWidth={12} />
        {Array.from({length: 12}, (_, i) => (
          <circle key={i} cx={680 + rand(i * 11) * 320} cy={300 + rand(i * 23) * 480} r={3 + rand(i) * 3} fill="#fff" />
        ))}
        <line x1={780} y1={280} x2={780} y2={800} stroke={INK} strokeWidth={10} />
        <line x1={900} y1={280} x2={900} y2={800} stroke={INK} strokeWidth={10} />
        <line x1={660} y1={540} x2={1020} y2={540} stroke={INK} strokeWidth={10} />

        <rect x={360} y={1180} width={380} height={40} fill="#69462f" stroke={INK} strokeWidth={8} />
        <rect x={400} y={1220} width={35} height={280} fill="#4d3221" stroke={INK} strokeWidth={7} />
        <rect x={670} y={1220} width={35} height={280} fill="#4d3221" stroke={INK} strokeWidth={7} />

        <rect x={450} y={1110} width={24} height={70} fill="#ede5d1" stroke={INK} strokeWidth={5} />
        <ellipse cx={462} cy={1095} rx={10} ry={16} fill="#ffaa00" />
        <circle cx={462} cy={1095} r={36} fill="#ffe680" opacity={0.25} />

        <rect x={510} y={1140} width={160} height={40} rx={4} fill="#eee4cc" stroke={INK} strokeWidth={6} />

        <Stick x={260} y={1540} {...oldGalileo} look="neutral" scale={1.08} talking armR={55} />

        <g transform={`translate(540 460) scale(${pop}) translate(-540 -460)`}>
          <path d="M220 340 H860 V560 H540 L480 640 L490 560 H220 Z" fill="#ffffff" stroke={INK} strokeWidth={10} />
          <text x={540} y={435} textAnchor="middle" fontSize={60} fontWeight={900} fill="#c9412f" fontFamily="Arial Black, Arial">
            "EPPUR SI MUOVE"
          </text>
          <text x={540} y={510} textAnchor="middle" fontSize={38} fontWeight={900} fill="#2f3550" fontFamily="Arial Black, Arial">
            (Namun ia tetap bergerak)
          </text>
        </g>
      </g>
    );
  }

  if (kind === 'galileoEnd') {
    return (
      <g>
        <rect width={W} height={H} fill="#060914" />

        {Array.from({length: 48}, (_, i) => (
          <circle
            key={i}
            cx={rand(i * 19) * W}
            cy={rand(i * 37) * 1200}
            r={3 + rand(i) * 5}
            fill="#fff"
            opacity={0.35 + Math.sin(f / 5 + i) * 0.45}
          />
        ))}

        <circle cx={850} cy={340} r={110} fill="#ffecb3" stroke={INK} strokeWidth={8} />
        <circle cx={850} cy={340} r={145} fill="#ffeaa7" opacity={0.22} />

        <g transform="translate(240 420)">
          <ellipse rx={70} ry={18} fill="none" stroke="#d4b483" strokeWidth={8} transform="rotate(-18)" />
          <circle r={36} fill="#e8c792" stroke={INK} strokeWidth={6} />
          <ellipse rx={70} ry={18} fill="none" stroke="#d4b483" strokeWidth={8} strokeDasharray="50 60" transform="rotate(-18)" />
        </g>

        <g transform="translate(540 380)">
          <circle r={58} fill="#3a86ff" stroke={INK} strokeWidth={6} />
          <ellipse cx={-14} cy={-10} rx={22} ry={15} fill="#52b788" />
          <ellipse cx={16} cy={12} rx={16} ry={12} fill="#52b788" />
          <circle r={75} fill="#64b5f6" opacity={0.2} />
        </g>

        <path d="M0 1340 Q540 1180 1080 1340 V1920 H0 Z" fill="#1b2e22" stroke={INK} strokeWidth={10} />

        <Stick x={540} y={1540} {...oldGalileo} look="happy" scale={1.15} armL={135} armR={135} />
      </g>
    );
  }

  const marie = {hair: '#453023', coat: '#242331', moustache: false};
  const pierre = {hair: '#2c221a', coat: '#3a4454', moustache: true};
  const soldier = {hair: '#2c221a', coat: '#4c5a30', moustache: false};

  if (kind === 'curieHook') {
    return (
      <g>
        {sky('#4a5568', '#2d3748')}

        <rect x={60} y={280} width={140} height={1220} rx={10} fill="#718096" stroke={INK} strokeWidth={9} />
        <rect x={880} y={280} width={140} height={1220} rx={10} fill="#718096" stroke={INK} strokeWidth={9} />
        <rect x={40} y={250} width={180} height={50} rx={6} fill="#4a5568" stroke={INK} strokeWidth={7} />
        <rect x={860} y={250} width={180} height={50} rx={6} fill="#4a5568" stroke={INK} strokeWidth={7} />

        <rect x={200} y={350} width={680} height={1150} fill="none" stroke="#1a202c" strokeWidth={12} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line key={i} x1={240 + i * 85} y1={350} x2={240 + i * 85} y2={1500} stroke="#1a202c" strokeWidth={10} />
        ))}
        <path d="M200 650 Q540 450 880 650" fill="none" stroke="#1a202c" strokeWidth={10} />
        <path d="M200 950 Q540 750 880 950" fill="none" stroke="#1a202c" strokeWidth={10} />

        <circle cx={540} cy={820} r={55} fill="#4a5568" stroke={INK} strokeWidth={8} />
        <rect x={515} y={800} width={50} height={60} rx={6} fill="#ffd23f" stroke={INK} strokeWidth={6} />
        <path d="M525 800 V775 Q540 760 555 775 V800" fill="none" stroke={INK} strokeWidth={6} />

        <rect x={360} y={640} width={360} height={100} rx={14} fill="#801818" stroke={INK} strokeWidth={8} />
        <text x={540} y={705} textAnchor="middle" fontSize={42} fontWeight={900} fill="#fff" fontFamily="Arial Black, Arial">
          HANYA PRIA
        </text>

        <g transform={`translate(540 275) scale(${pop}) translate(-540 -275)`}>
          <rect x={180} y={215} width={720} height={120} rx={18} fill="#7a1f1d" stroke={INK} strokeWidth={8} />
          <text
            x={540}
            y={275}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={56}
            fontWeight={900}
            fill="#ffd23f"
            fontFamily="Arial Black, Arial"
          >
            DILARANG KULIAH
          </text>
        </g>

        <Stick x={340} y={1540} {...marie} look="sad" scale={1.08} armR={25} armL={15} talking />
        <circle cx={340} cy={1540 - 590 * 1.08} r={28} fill="#453023" stroke={INK} strokeWidth={6} />
      </g>
    );
  }

  if (kind === 'curieSecretClass') {
    return (
      <g>
        <rect width={W} height={H} fill="#26211e" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={0} y1={i * 240 + 80} x2={W} y2={i * 240 + 80} stroke="#1b1715" strokeWidth={5} />
        ))}
        <rect y={1500} width={W} height={420} fill="#181412" />
        <rect y={1492} width={W} height={12} fill={INK} />

        <rect x={160} y={440} width={760} height={420} rx={14} fill="#183024" stroke="#63452f" strokeWidth={14} />
        <text x={200} y={520} fontSize={44} fontWeight={900} fill="#e2f5ea" fontFamily="Arial Black, Arial">
          E = mc²
        </text>
        <text x={420} y={520} fontSize={40} fontWeight={900} fill="#9fe6b8" fontFamily="Arial Black, Arial">
          ATOM: U-92
        </text>
        <circle cx={260} cy={640} r={26} fill="none" stroke="#fff" strokeWidth={5} />
        <circle cx={360} cy={600} r={18} fill="none" stroke="#fff" strokeWidth={4} />
        <line x1={286} y1={630} x2={342} y2={606} stroke="#fff" strokeWidth={5} />
        <circle cx={380} cy={700} r={22} fill="none" stroke="#fff" strokeWidth={4} />
        <line x1={284} y1={650} x2={360} y2={690} stroke="#fff" strokeWidth={5} />
        <text x={520} y={660} fontSize={38} fontWeight={900} fill="#ffd23f" fontFamily="Arial Black, Arial">
          RADIOAKTIF?
        </text>
        <text x={200} y={790} fontSize={36} fontWeight={700} fill="#d1e7dd" fontFamily="monospace">
          λ = h / p  (WARSAWA 1890)
        </text>

        <rect x={760} y={1180} width={180} height={32} fill="#69462f" stroke={INK} strokeWidth={7} />
        <rect x={830} y={1212} width={30} height={288} fill="#4d3221" stroke={INK} strokeWidth={6} />
        <rect x={835} y={1120} width={20} height={60} fill="#ede5d1" stroke={INK} strokeWidth={4} />
        <ellipse cx={845} cy={1105} rx={9} ry={15} fill="#ffaa00" />
        <circle cx={845} cy={1105} r={38} fill="#ffe680" opacity={0.25} />

        <g transform={`translate(540 275) scale(${pop}) translate(-540 -275)`}>
          <rect x={200} y={215} width={680} height={120} rx={18} fill="#17151e" stroke="#fff" strokeWidth={7} />
          <text
            x={540}
            y={275}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={54}
            fontWeight={900}
            fill="#ffd23f"
            fontFamily="Arial Black, Arial"
          >
            KAMPUS RAHASIA
          </text>
        </g>

        <Stick x={360} y={1540} {...marie} look="neutral" scale={1.05} armR={65} armL={20} talking />
        <circle cx={360} cy={1540 - 590 * 1.05} r={28} fill="#453023" stroke={INK} strokeWidth={6} />

        <Stick x={820} y={1540} hair="#6b5b4d" coat="#3a404a" look="happy" scale={0.95} armL={110} flip />
      </g>
    );
  }

  if (kind === 'curieParisAttic') {
    return (
      <g>
        <rect width={W} height={H} fill="#232634" />
        <path d="M0 180 L1080 720 V1500 H0 Z" fill="#1b1c27" />
        <line x1={0} y1={180} x2={1080} y2={720} stroke="#3b3749" strokeWidth={24} />

        <rect x={600} y={320} width={340} height={380} fill="#10192e" stroke={INK} strokeWidth={11} />
        <line x1={770} y1={320} x2={770} y2={700} stroke={INK} strokeWidth={8} />
        <line x1={600} y1={510} x2={940} y2={510} stroke={INK} strokeWidth={8} />
        <Rain area={[610, 330, 320, 360]} count={16} />

        <rect x={240} y={1160} width={520} height={42} fill="#694832" stroke={INK} strokeWidth={8} />
        <rect x={280} y={1202} width={35} height={298} fill="#4d3221" stroke={INK} strokeWidth={7} />
        <rect x={680} y={1202} width={35} height={298} fill="#4d3221" stroke={INK} strokeWidth={7} />

        <ellipse cx={420} cy={1145} rx={38} ry={20} fill="#9c633a" stroke={INK} strokeWidth={6} />
        <path d="M520 1135 H565 V1155 Q565 1162 542 1162 Q520 1162 520 1155 Z" fill="#e8e8ed" stroke={INK} strokeWidth={5} />
        <path d="M535 1130 Q530 1110 538 1095" fill="none" stroke="#fff" opacity={0.6} strokeWidth={4} strokeLinecap="round" />

        <rect x={610} y={1110} width={110} height={24} rx={3} fill="#a83232" stroke={INK} strokeWidth={5} />
        <rect x={605} y={1134} width={120} height={26} rx={3} fill="#2f5a8a" stroke={INK} strokeWidth={5} />

        <g transform={`translate(540 275) scale(${pop}) translate(-540 -275)`}>
          <rect x={180} y={215} width={720} height={120} rx={18} fill="#1e3250" stroke="#fff" strokeWidth={7} />
          <text
            x={540}
            y={275}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={52}
            fontWeight={900}
            fill="#ffd23f"
            fontFamily="Arial Black, Arial"
          >
            LOTENG DINGIN PARIS
          </text>
        </g>

        <rect y={1500} width={W} height={420} fill="#14141d" />
        <rect y={1492} width={W} height={12} fill={INK} />

        <Stick x={310} y={1540} {...marie} look="neutral" scale={1.05} armR={50} talking />
        <circle cx={310} cy={1540 - 590 * 1.05} r={28} fill="#453023" stroke={INK} strokeWidth={6} />
      </g>
    );
  }

  if (kind === 'curieShedLab') {
    const dripY = (f * 18) % 650;
    return (
      <g>
        <rect width={W} height={H} fill="#3b2b20" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={i * 220 + 80} y1={0} x2={i * 220 + 80} y2={1500} stroke="#2a1e16" strokeWidth={6} />
        ))}
        <rect y={1500} width={W} height={420} fill="#221711" />
        <rect y={1492} width={W} height={12} fill={INK} />

        <line x1={840} y1={350 + dripY} x2={840} y2={380 + dripY} stroke="#7cc8ee" strokeWidth={7} strokeLinecap="round" />
        <rect x={810} y={1410} width={60} height={90} rx={6} fill="#697485" stroke={INK} strokeWidth={7} />

        <rect x={420} y={1200} width={240} height={300} rx={8} fill="#803828" stroke={INK} strokeWidth={9} />
        <rect x={480} y={1320} width={120} height={120} rx={30} fill="#ff4800" stroke={INK} strokeWidth={7} />
        <ellipse cx={540} cy={1380} rx={35} ry={45} fill="#ffcc00" />

        <ellipse cx={540} cy={1150} rx={170} ry={110} fill="#2a282f" stroke={INK} strokeWidth={11} />
        <ellipse cx={540} cy={1100} rx={160} ry={50} fill="#47433f" stroke={INK} strokeWidth={8} />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={450 + i * 60 + Math.sin(f / 3 + i) * 15} cy={1095 + (i % 2) * 10} r={12} fill="#706a65" />
        ))}
        {Array.from({length: 4}, (_, i) => {
          const sy = ((f * 6 + i * 90) % 360);
          return (
            <ellipse
              key={i}
              cx={500 + i * 30 + Math.sin(f / 8 + i) * 20}
              cy={1030 - sy}
              rx={25 + i * 8}
              ry={18 + i * 5}
              fill="#ffffff35"
            />
          );
        })}

        <line x1={360} y1={1220} x2={520} y2={1080} stroke="#1b1a22" strokeWidth={14} strokeLinecap="round" />

        <g transform={`translate(540 275) scale(${pop}) translate(-540 -275)`}>
          <rect x={160} y={215} width={760} height={120} rx={18} fill="#17151e" stroke="#fff" strokeWidth={7} />
          <text
            x={540}
            y={275}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={52}
            fontWeight={900}
            fill="#ffd23f"
            fontFamily="Arial Black, Arial"
          >
            GUDANG BIJIH MINERAL
          </text>
        </g>

        <Stick x={260} y={1540} {...marie} look="neutral" scale={1.04} armR={115} armL={40} talking />
        <circle cx={260} cy={1540 - 590 * 1.04} r={28} fill="#453023" stroke={INK} strokeWidth={6} />

        <rect x={880} y={1350} width={120} height={150} rx={22} fill="#8c775a" stroke={INK} strokeWidth={8} />
        <text x={940} y={1440} textAnchor="middle" fontSize={30} fontWeight={900} fill="#fff" fontFamily="Arial Black, Arial">
          BIJIH
        </text>
        <Stick x={820} y={1540} {...pierre} look="happy" scale={1.04} armL={85} armR={35} flip />
      </g>
    );
  }

  if (kind === 'curieRadiumGlow') {
    return (
      <g>
        <rect width={W} height={H} fill="#060e09" />

        <circle cx={660} cy={760} r={280 + Math.sin(f / 6) * 20} fill="#52ff88" opacity={0.16} />
        <circle cx={660} cy={760} r={180 + Math.sin(f / 6) * 12} fill="#52ff88" opacity={0.3} />
        <circle cx={660} cy={760} r={90} fill="#b8ffce" opacity={0.5} />

        {Array.from({length: 12}, (_, i) => {
          const a = (i / 12) * Math.PI * 2 + f / 28;
          return (
            <line
              key={i}
              x1={660 + Math.cos(a) * 90}
              y1={760 + Math.sin(a) * 90}
              x2={660 + Math.cos(a) * 310}
              y2={760 + Math.sin(a) * 310}
              stroke="#52ff88"
              strokeWidth={10}
              strokeLinecap="round"
              opacity={0.6}
            />
          );
        })}

        <rect x={280} y={980} width={560} height={36} fill="#14241b" stroke={INK} strokeWidth={8} />
        <rect x={340} y={1016} width={30} height={484} fill="#0d1711" stroke={INK} strokeWidth={7} />
        <rect x={770} y={1016} width={30} height={484} fill="#0d1711" stroke={INK} strokeWidth={7} />

        <g transform="translate(420 980)">
          <Flask x={0} y={0} fill="#38ef7d" level={0.55} />
          <rect x={-90} y={-240} width={180} height={44} rx={10} fill="#0d2818" stroke="#38ef7d" strokeWidth={3} />
          <text x={0} y={-210} textAnchor="middle" fontSize={26} fontWeight={900} fill="#fff" fontFamily="Arial Black, Arial">
            POLONIUM
          </text>
        </g>

        <g transform="translate(660 980) scale(1.15) translate(-660 -980)">
          <Flask x={660} y={980} fill="#00ff66" level={0.75} />
          <rect x={570} y={740} width={180} height={44} rx={10} fill="#0d2818" stroke="#52ff88" strokeWidth={4} />
          <text x={660} y={770} textAnchor="middle" fontSize={28} fontWeight={900} fill="#52ff88" fontFamily="Arial Black, Arial">
            RADIUM
          </text>
        </g>

        <g transform={`translate(540 275) scale(${pop}) translate(-540 -275)`}>
          <rect x={140} y={215} width={800} height={120} rx={18} fill="#092113" stroke="#52ff88" strokeWidth={7} />
          <text
            x={540}
            y={275}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={48}
            fontWeight={900}
            fill="#52ff88"
            fontFamily="Arial Black, Arial"
          >
            BERCAHAYA DI KEGELAPAN
          </text>
        </g>

        <rect y={1500} width={W} height={420} fill="#0a120c" />
        <rect y={1492} width={W} height={12} fill={INK} />

        <Stick x={220} y={1540} {...marie} look="shock" scale={1.08} armR={130} armL={45} />
        <circle cx={220} cy={1540 - 590 * 1.08} r={28} fill="#453023" stroke={INK} strokeWidth={6} />

        <Stick x={880} y={1540} {...pierre} look="happy" scale={1.05} armL={120} armR={40} flip />
      </g>
    );
  }

  if (kind === 'curieDoubleNobel') {
    return (
      <g>
        <rect width={W} height={H} fill="#4a121c" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={i * 240 + 40} width={120} height={1500} fill="#360c14" />
        ))}
        <path d="M370 0 L150 1500 H590 Z" fill="#ffeaa7" opacity={0.16} />
        <path d="M710 0 L490 1500 H930 Z" fill="#ffeaa7" opacity={0.16} />

        <g transform="translate(370 720)">
          <circle r={140} fill="#ffd23f" stroke={INK} strokeWidth={9} />
          <circle r={120} fill="#ffc107" stroke="#b38600" strokeWidth={5} />
          <text x={0} y={-30} textAnchor="middle" fontSize={42} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">
            NOBEL
          </text>
          <text x={0} y={20} textAnchor="middle" fontSize={34} fontWeight={900} fill="#802000" fontFamily="Arial Black, Arial">
            FISIKA
          </text>
          <text x={0} y={75} textAnchor="middle" fontSize={44} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">
            1903
          </text>
        </g>

        <g transform="translate(710 720)">
          <circle r={140} fill="#ffd23f" stroke={INK} strokeWidth={9} />
          <circle r={120} fill="#ffc107" stroke="#b38600" strokeWidth={5} />
          <text x={0} y={-30} textAnchor="middle" fontSize={42} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">
            NOBEL
          </text>
          <text x={0} y={20} textAnchor="middle" fontSize={34} fontWeight={900} fill="#802000" fontFamily="Arial Black, Arial">
            KIMIA
          </text>
          <text x={0} y={75} textAnchor="middle" fontSize={44} fontWeight={900} fill={INK} fontFamily="Arial Black, Arial">
            1911
          </text>
        </g>

        <g transform={`translate(540 275) scale(${pop}) translate(-540 -275)`}>
          <rect x={180} y={215} width={720} height={120} rx={18} fill="#ffd23f" stroke={INK} strokeWidth={8} />
          <text
            x={540}
            y={275}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={56}
            fontWeight={900}
            fill={INK}
            fontFamily="Arial Black, Arial"
          >
            2 HADIAH NOBEL
          </text>
        </g>

        <rect y={1500} width={W} height={420} fill="#24080e" />
        <rect y={1492} width={W} height={12} fill={INK} />

        <Stick x={540} y={1540} {...marie} look="happy" scale={1.12} armL={135} armR={135} talking />
        <circle cx={540} cy={1540 - 590 * 1.12} r={28} fill="#453023" stroke={INK} strokeWidth={6} />
      </g>
    );
  }

  if (kind === 'curieAmbulance') {
    return (
      <g>
        {sky('#556270', '#3b3126')}

        <line x1={0} y1={1200} x2={W} y2={1200} stroke="#2c2825" strokeWidth={5} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} d={`M${i * 140} 1180 L${i * 140 + 20} 1220 M${i * 140 + 20} 1180 L${i * 140} 1220`} stroke="#2c2825" strokeWidth={4} />
        ))}

        <g transform="translate(140 850)">
          <rect x={0} y={120} width={480} height={280} rx={16} fill="#4a5840" stroke={INK} strokeWidth={9} />
          <path d="M0 240 L-90 280 V400 H0 Z" fill="#3d4934" stroke={INK} strokeWidth={8} />
          <rect x={-70} y={260} width={60} height={70} fill="#94c4d9" stroke={INK} strokeWidth={6} />
          <g transform="translate(-30 400)">
            <circle r={60} fill="#252427" stroke={INK} strokeWidth={8} />
            <circle r={25} fill="#706d6b" stroke={INK} strokeWidth={6} />
          </g>
          <g transform="translate(390 400)">
            <circle r={60} fill="#252427" stroke={INK} strokeWidth={8} />
            <circle r={25} fill="#706d6b" stroke={INK} strokeWidth={6} />
          </g>

          <circle cx={240} cy={230} r={65} fill="#fff" stroke={INK} strokeWidth={6} />
          <rect x={223} y={185} width={34} height={90} rx={4} fill="#d32f2f" />
          <rect x={195} y={213} width={90} height={34} rx={4} fill="#d32f2f" />

          <rect x={90} y={325} width={300} height={50} rx={8} fill="#1d2419" stroke="#fff" strokeWidth={4} />
          <text x={240} y={360} textAnchor="middle" fontSize={30} fontWeight={900} fill="#fff" fontFamily="Arial Black, Arial">
            PETITE CURIE
          </text>
        </g>

        <g transform="translate(740 880)">
          <rect x={0} y={0} width={260} height={320} rx={14} fill="#0d2430" stroke="#48cae4" strokeWidth={8} />
          <path d="M130 50 V270" stroke="#caf0f8" strokeWidth={34} strokeLinecap="round" />
          <circle cx={110} cy={50} r={18} fill="#caf0f8" />
          <circle cx={150} cy={50} r={18} fill="#caf0f8" />
          <circle cx={110} cy={270} r={18} fill="#caf0f8" />
          <circle cx={150} cy={270} r={18} fill="#caf0f8" />
          <circle cx={145} cy={160} r={12} fill="#ff3333" stroke="#fff" strokeWidth={4} />
          <text x={130} y={305} textAnchor="middle" fontSize={26} fontWeight={900} fill="#48cae4" fontFamily="Arial Black, Arial">
            RONTGEN X-RAY
          </text>
        </g>

        <g transform={`translate(540 275) scale(${pop}) translate(-540 -275)`}>
          <rect x={160} y={215} width={760} height={120} rx={18} fill="#17151e" stroke="#fff" strokeWidth={7} />
          <text
            x={540}
            y={275}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={50}
            fontWeight={900}
            fill="#ffd23f"
            fontFamily="Arial Black, Arial"
          >
            MOBIL RONTGEN KELILING
          </text>
        </g>

        <Stick x={210} y={1540} {...marie} look="happy" scale={1.05} armR={95} armL={30} talking />
        <circle cx={210} cy={1540 - 590 * 1.05} r={28} fill="#453023" stroke={INK} strokeWidth={6} />

        <Stick x={900} y={1540} {...soldier} look="happy" scale={0.92} armL={45} flip />
        <rect x={870} y={1540 - 530 * 0.92} width={65} height={26} rx={6} fill="#fff" stroke={INK} strokeWidth={5} />
      </g>
    );
  }

  if (kind === 'curieEnd') {
    return (
      <g>
        <rect width={W} height={H} fill="#050a12" />

        {Array.from({length: 44}, (_, i) => (
          <circle
            key={i}
            cx={rand(i * 17) * W}
            cy={rand(i * 31) * 1250}
            r={3 + rand(i) * 5}
            fill="#fff"
            opacity={0.35 + Math.sin(f / 5 + i) * 0.45}
          />
        ))}

        <path d="M0 650 Q270 450 540 650 T1080 650" fill="none" stroke="#52ff88" opacity={0.22} strokeWidth={80} />
        <path d="M0 750 Q270 550 540 750 T1080 750" fill="none" stroke="#48cae4" opacity={0.18} strokeWidth={70} />

        <ellipse
          cx={540}
          cy={680}
          rx={340}
          ry={140}
          fill="none"
          stroke="#52ff88"
          strokeWidth={7}
          strokeDasharray="18 14"
          transform="rotate(-30 540 680)"
        />
        <ellipse
          cx={540}
          cy={680}
          rx={340}
          ry={140}
          fill="none"
          stroke="#7fd4ff"
          strokeWidth={7}
          strokeDasharray="18 14"
          transform="rotate(30 540 680)"
        />
        <ellipse
          cx={540}
          cy={680}
          rx={340}
          ry={140}
          fill="none"
          stroke="#ffd23f"
          strokeWidth={7}
          strokeDasharray="18 14"
          transform="rotate(90 540 680)"
        />

        <circle cx={540} cy={680} r={46} fill="#ffd23f" stroke={INK} strokeWidth={7} />
        <circle cx={540} cy={680} r={80} fill="#ffd23f" opacity={0.25} />

        <path d="M0 1340 Q540 1180 1080 1340 V1920 H0 Z" fill="#152b1b" stroke={INK} strokeWidth={10} />

        <Stick x={540} y={1540} {...marie} look="happy" scale={1.15} armL={140} armR={140} />
        <circle cx={540} cy={1540 - 590 * 1.15} r={30} fill="#453023" stroke={INK} strokeWidth={6} />
      </g>
    );
  }

  // city: closing scene
  const lit = interpolate(f, [0, 70], [0.15, 0.85], {extrapolateRight: 'clamp'});
  return (
    <g>
      <rect width={W} height={H} fill="#0d1534" />
      <Skyline lit={lit} />
      {f > 20 ? (
        <>
          <Bolt from={[0, 800]} to={[540, 930]} seed={seed} width={6} />
          <Bolt from={[540, 930]} to={[1080, 760]} seed={seed + 9} width={6} />
        </>
      ) : null}
      <rect y={1490} width={W} height={430} fill="#1a1423" />
      <Stick x={540} y={1540} old look="happy" scale={1.05} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Subtitles: 3-word groups, broken early at punctuation, keywords in yellow
// ---------------------------------------------------------------------------
const groupWords = (words: StoryWord[]) => {
  const groups: StoryWord[][] = [];
  let cur: StoryWord[] = [];
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

const Subtitle: React.FC<{words: StoryWord[]; keywords: string[]; accent: string}> = ({
  words,
  keywords,
  accent,
}) => {
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
        left: 50,
        right: 50,
        top: 1590,
        textAlign: 'center',
        fontFamily: '"Arial Black", Arial, sans-serif',
        fontWeight: 900,
        fontSize: 76,
        lineHeight: 1.18,
        color: '#fff',
        WebkitTextStroke: '14px #15131c',
        paintOrder: 'stroke fill',
        transform: `scale(${interpolate(pop, [0, 1], [0.86, 1])})`,
      }}
    >
      {group.map((w, i) => (
        <span key={i} style={{color: keys.some((k) => clean(w.text).includes(k)) ? accent : '#fff'}}>
          {w.text.replace(/[.,:]$/, '')}{' '}
        </span>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
export const StickmanStory: React.FC<{
  words: StoryWord[];
  scenes: StoryScene[];
  name: string;
  keywords: string[];
  accent: string;
  hue?: number; // per-video background hue offset (deg); 0 = original palette
  baseHair?: string; // per-video default hair colour (scene.hair overrides)
  baseMoustache?: boolean; // per-video default moustache (scene.moustache overrides)
}> = ({words, scenes, name, keywords, accent, hue = 0, baseHair, baseMoustache}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const starts = scenes.map((s) => {
    if (!s.cue) return 0;
    const w = words.find((x) => clean(x.text).includes(clean(s.cue as string)));
    return w ? Math.round((w.fromMs / 1000) * fps) : null;
  });
  const timeline = scenes
    .map((s, i) => ({scene: s, from: starts[i]}))
    .filter((s): s is {scene: StoryScene; from: number} => s.from !== null);
  const idx = timeline.reduce((best, s, i) => (frame >= s.from ? i : best), 0);
  const item = timeline[idx];
  const scene = item.scene;
  const end = timeline[idx + 1]?.from ?? durationInFrames;
  const f = frame - item.from;
  const len = end - item.from;

  // each cut lands with a small punch-in, then the camera creeps forward
  const punch = spring({frame: f, fps, config: {damping: 14}, durationInFrames: 12});
  const zoom = interpolate(punch, [0, 1], [1.08, 1]) + (f / Math.max(len, 1)) * 0.05;

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 58%'}}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <SceneArt key={scene.kind + idx} scene={scene} f={f} len={len} accent={accent} hue={hue} baseHair={baseHair} baseMoustache={baseMoustache} />
        </svg>
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 74,
          left: 54,
          padding: '12px 24px',
          borderRadius: 14,
          background: '#17151e',
          border: '4px solid #fff',
          color: '#fff',
          fontFamily: '"Arial Black", Arial, sans-serif',
          fontWeight: 900,
          fontSize: 34,
        }}
      >
        {name}
      </div>
      <Subtitle words={words} keywords={keywords} accent={accent} />
    </AbsoluteFill>
  );
};
