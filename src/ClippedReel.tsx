import {useMemo} from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import rawCaptions from './clipped_captions.json';
import rawMetadata from './clipped_metadata.json';

interface CaptionToken {
  text: string;
  startMs: number;
  endMs: number;
}

interface CaptionPage {
  text: string;
  tokens: {text: string; fromMs: number; toMs: number}[];
  startMs: number;
  endMs: number;
}

interface ClippedReelProps {
  videoSrc?: string;
  title?: string;
}

const captions = rawCaptions as CaptionToken[];

// Balanced phrase grouping: continuous without flickering/gaps
function groupCaptionsIntoPages(
  caps: CaptionToken[],
  targetWords = 3,
  maxWords = 8,
): CaptionPage[] {
  const pages: CaptionPage[] = [];
  let curr: CaptionToken[] = [];

  for (let i = 0; i < caps.length; i++) {
    const c = caps[i];
    curr.push(c);

    const count = curr.length;
    const nextGap = i < caps.length - 1 ? caps[i + 1].startMs - c.endMs : 0;
    const hasPunct = /[.?!,]$/.test(c.text.trim());

    // Split at natural breaks or max words
    const shouldSplit =
      count >= maxWords ||
      (count >= targetWords && (hasPunct || nextGap > 500)) ||
      i === caps.length - 1;

    if (shouldSplit) {
      pages.push({
        text: curr.map((x) => x.text.trim()).join(' '),
        tokens: curr.map((x) => ({
          text: x.text.trim(),
          fromMs: x.startMs,
          toMs: x.endMs,
        })),
        startMs: curr[0].startMs,
        endMs: curr[curr.length - 1].endMs,
      });
      curr = [];
    }
  }

  // Seamless continuity: bridge pauses so text doesn't flicker or blink away
  for (let i = 0; i < pages.length; i++) {
    const nextStart = pages[i + 1]
      ? pages[i + 1].startMs
      : pages[i].endMs + 1000;
    const gap = nextStart - pages[i].endMs;
    if (gap > 0 && gap < 1600) {
      pages[i].endMs = nextStart; // extend page until next speaker starts
    } else if (gap >= 1600) {
      pages[i].endMs += 700; // gentle hang time on long silence
    }
  }
  return pages;
}

export const ClippedReel: React.FC<ClippedReelProps> = ({
  videoSrc = 'clipped_video.mp4',
  title = (rawMetadata as {title?: string}).title || '',
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  // Grouped pages with zero gaps
  const pages = useMemo(() => groupCaptionsIntoPages(captions), []);

  // Find active caption page
  const activePage = pages.find(
    (p) => currentMs >= p.startMs && currentMs < p.endMs,
  );

  // Video progress bar (0 -> 100%)
  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#0a0a0f', overflow: 'hidden'}}>
      {/* 1. Background: Blurred atmospheric video */}
      <AbsoluteFill
        style={{transform: 'scale(1.25)', filter: 'blur(45px) brightness(0.35)'}}
      >
        <OffthreadVideo
          src={staticFile(videoSrc)}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>

      {/* Subtle vignette gradient */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* 2. Top Headline Hook (Clean without badge) */}
      {title ? (
        <div
          style={{
            position: 'absolute',
            top: 180,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 60px',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: 'Arial Black, Impact, sans-serif',
              fontSize: 50,
              lineHeight: 1.25,
              fontWeight: 900,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              textShadow:
                '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000, 0 6px 25px rgba(0,0,0,0.95)',
            }}
          >
            {title}
          </h1>
        </div>
      ) : null}

      {/* 3. Foreground Video (16:9 podcast frame in center) */}
      <div
        style={{
          position: 'absolute',
          top: 490,
          left: 40,
          width: 1000,
          height: 562.5, // 16:9
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow:
            '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 0 2px rgba(255,255,255,0.15)',
          zIndex: 5,
        }}
      >
        <OffthreadVideo
          src={staticFile(videoSrc)}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </div>

      {/* 4. Clipper Style Dynamic Floating Captions (No black background, continuous words) */}
      <div
        style={{
          position: 'absolute',
          top: 1140,
          left: 40,
          right: 40,
          minHeight: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {activePage ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px 26px',
              maxWidth: 960,
              textAlign: 'center',
            }}
          >
            {activePage.tokens.map((token, i) => {
              const isCurrent =
                currentMs >= token.fromMs && currentMs < token.toMs;

              // Pop spring for current active word
              const pop = isCurrent
                ? spring({
                    frame: Math.max(
                      0,
                      frame - Math.floor((token.fromMs / 1000) * fps),
                    ),
                    fps,
                    config: {damping: 12, stiffness: 220},
                  })
                : 0;
              const scale = isCurrent ? 1 + pop * 0.14 : 1;

              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    margin: '6px 14px',
                    fontFamily: 'Arial Black, Impact, sans-serif',
                    fontSize: 54,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    color: isCurrent
                      ? '#FFE600' // Active word: Electric Yellow
                      : '#FFFFFF', // Inactive words: Pure White
                    textShadow: isCurrent
                      ? '0 0 25px rgba(255, 230, 0, 0.7), -4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0 8px 20px rgba(0,0,0,0.95)'
                      : '-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0 8px 18px rgba(0,0,0,0.95)',
                    transition: 'color 0.06s ease',
                  }}
                >
                  {token.text}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* 5. Bottom Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          zIndex: 20,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #ff334b, #ffe600)',
            boxShadow: '0 0 12px rgba(255, 51, 75, 0.8)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
