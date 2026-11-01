// Flat 2D stickman storytelling template: every character and background is
// drawn as SVG, scene cuts follow cue words in the narration.
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type StoryWord = {text: string; fromMs: number; toMs: number};
export type StoryScene = {kind: string; cue: string | null};

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
const SceneArt: React.FC<{kind: string; f: number; len: number}> = ({kind, f, len}) => {
  const {fps} = useVideoConfig();
  const seed = Math.floor(f / 3);
  const pop = spring({frame: f, fps, config: {damping: 12}, durationInFrames: 16});

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
}> = ({words, scenes, name, keywords, accent}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const starts = scenes.map((s) => {
    if (!s.cue) return 0;
    const w = words.find((x) => clean(x.text).includes(clean(s.cue as string)));
    return w ? Math.round((w.fromMs / 1000) * fps) : null;
  });
  const timeline = scenes
    .map((s, i) => ({kind: s.kind, from: starts[i]}))
    .filter((s): s is {kind: string; from: number} => s.from !== null);
  const idx = timeline.reduce((best, s, i) => (frame >= s.from ? i : best), 0);
  const scene = timeline[idx];
  const end = timeline[idx + 1]?.from ?? durationInFrames;
  const f = frame - scene.from;
  const len = end - scene.from;

  // each cut lands with a small punch-in, then the camera creeps forward
  const punch = spring({frame: f, fps, config: {damping: 14}, durationInFrames: 12});
  const zoom = interpolate(punch, [0, 1], [1.08, 1]) + (f / Math.max(len, 1)) * 0.05;

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 58%'}}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <SceneArt key={scene.kind} kind={scene.kind} f={f} len={len} />
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
