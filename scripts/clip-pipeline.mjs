#!/usr/bin/env node
// End-to-end YouTube to Reels Clipper with Dynamic Captions
// Usage: npm run clip <youtube_url> [--start MM:SS] [--duration 15-60] [--title "TITLE"] [--out filename.mp4]

import {execSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const VENV_YTDLP = path.join(ROOT, '.venv', 'bin', 'yt-dlp');
const WHISPER_CLI = path.join(ROOT, '.bin', 'whisper.cpp', 'build', 'bin', 'whisper-cli');
const WHISPER_MODEL = path.join(ROOT, '.bin', 'whisper.cpp', 'ggml-small.bin');

const url = process.argv[2];
if (!url || url.startsWith('-')) {
  console.log(`
🎬 YouTube Reels Clipper
Usage:
  npm run clip <youtube_url> [options]

Options:
  --start <MM:SS or seconds>   (optional, auto-detects #1 most replayed peak if omitted)
  --duration <15-60>           (default: 55 seconds)
  --title <text>               (top headline hook overlay)
  --out <filename.mp4>         (output filename, default: out/clipped-reel.mp4)

Examples:
  npm run clip https://www.youtube.com/watch?v=c8yYBCQrvfc
  npm run clip https://www.youtube.com/watch?v=c8yYBCQrvfc --start 33:16 --duration 55 --title "BAGI-BAGI JABATAN POLITIK ITU SALAH?"
`);
  process.exit(1);
}

function getArg(flag, defaultValue) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : defaultValue;
}

const reqStart = getArg('--start', null);
const reqDuration = Math.min(60, Math.max(15, parseInt(getArg('--duration', '55'), 10)));
const customTitle = getArg('--title', null);
const customOut = getArg('--out', 'out/clipped-reel.mp4');

mkdirSync(path.join(ROOT, 'public'), {recursive: true});
mkdirSync(path.join(ROOT, 'out'), {recursive: true});
mkdirSync(path.join(ROOT, '.tmp'), {recursive: true});

console.log(`\n🔍 1. Fetching YouTube video metadata...`);
const metaRaw = execSync(
  `"${VENV_YTDLP}" --extractor-args "youtube:player_client=android,web" -j --skip-download "${url}" 2>/dev/null`,
  {encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024},
);
const meta = JSON.parse(metaRaw);
console.log(`   Title:   ${meta.title}`);
console.log(`   Channel: ${meta.channel || meta.uploader}`);

// Determine start timestamp
let startSec = 0;
if (reqStart) {
  if (reqStart.includes(':')) {
    const parts = reqStart.split(':').map(Number);
    startSec = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  } else {
    startSec = parseFloat(reqStart);
  }
} else {
  // Auto-detect highest heatmap peak
  const heatmap = meta.heatmap || [];
  if (heatmap.length > 0) {
    const peak = [...heatmap].sort((a, b) => (b.value || 0) - (a.value || 0))[0];
    startSec = Math.max(0, Math.floor(peak.start_time));
    console.log(`   🎯 Detected #1 Most Replayed Peak: ${Math.floor(startSec / 60)}:${String(startSec % 60).padStart(2, '0')}`);
  } else {
    startSec = 30; // fallback
  }
}

const endSec = startSec + reqDuration;
console.log(`   Timing:  ${startSec}s -> ${endSec}s (${reqDuration}s clip)`);

const clipPath = path.join(ROOT, 'public', 'clipped_video.mp4');
if (existsSync(clipPath)) unlinkSync(clipPath);
console.log(`\n📥 2. Downloading exact video clip...`);
execSync(
  `"${VENV_YTDLP}" --extractor-args "youtube:player_client=android,web" --force-overwrites --download-sections "*${startSec}-${endSec}" --force-keyframes-at-cuts -f "18/best" -o "${clipPath}" "${url}"`,
  {stdio: 'inherit'},
);

// Caption Extraction: Attempt YouTube VTT first (100% microsecond lip-sync), fallback to Whisper
console.log(`\n🎙️  3. Extracting word-level captions...`);
let captions = [];

function toSec(ts) {
  const parts = ts.trim().split(':');
  if (parts.length === 3) {
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
  }
  return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
}

function parseVttToCaptions(vttContent, clipStartSec, clipDurationSec) {
  const clipEndSec = clipStartSec + clipDurationSec;
  const blocks = vttContent.split(/\n\s*\n/);
  const rawTokens = [];

  for (const b of blocks) {
    const lines = b.split('\n').map((l) => l.trim()).filter(Boolean);
    const timingLine = lines.find((l) => l.includes('-->'));
    if (!timingLine) continue;

    const match = timingLine.match(/(\d+:\d+:\d+\.\d+)\s*-->\s*(\d+:\d+:\d+\.\d+)/);
    if (!match) continue;

    const bStart = toSec(match[1]);
    const bEnd = toSec(match[2]);

    if (bEnd - bStart < 0.05 || bEnd < clipStartSec || bStart > clipEndSec) continue;

    const activeLine = lines[lines.length - 1];
    const hasWordTags = /<\d+:\d+:\d+\.\d+>/.test(activeLine);

    if (hasWordTags) {
      const firstMatch = activeLine.match(/^([^<]+)/);
      if (firstMatch) {
        const w0 = firstMatch[1].trim();
        if (w0) rawTokens.push({start: bStart - clipStartSec, text: w0});
      }
      const re = /<(\d+:\d+:\d+\.\d+)>(?:<c>)?\s*([^<]+?)\s*(?:<\/c>)?(?=<|$)/g;
      let tagMatch;
      while ((tagMatch = re.exec(activeLine)) !== null) {
        const tm = tagMatch[1];
        const w = tagMatch[2].trim();
        if (w) rawTokens.push({start: toSec(tm) - clipStartSec, text: w});
      }
    } else {
      const cleanLine = activeLine.replace(/<[^>]+>/g, '').trim();
      const wordsInLine = cleanLine.split(/\s+/).filter(Boolean);
      if (wordsInLine.length > 0) {
        const span = bEnd - bStart;
        const step = span / wordsInLine.length;
        wordsInLine.forEach((w, wi) => {
          rawTokens.push({
            start: bStart + wi * step - clipStartSec,
            text: w,
          });
        });
      }
    }
  }

  const valid = rawTokens.filter(
    (t) =>
      t.start >= 0 &&
      t.start <= clipDurationSec &&
      !/^\[.*\]$/.test(t.text) &&
      !/^[\s\-–—]+$/.test(t.text),
  );

  return valid.map((w, idx) => {
    const startMs = Math.round(w.start * 1000);
    let endMs;
    if (idx < valid.length - 1) {
      endMs = Math.round(Math.min(valid[idx + 1].start * 1000, startMs + 1200));
    } else {
      endMs = startMs + 700;
    }
    if (endMs - startMs < 150) {
      endMs = startMs + 150;
    }
    return {
      text: ' ' + w.text,
      startMs,
      endMs,
      timestampMs: startMs,
      confidence: 1.0,
    };
  });
}

// Download subtitles from YouTube
const subPrefix = path.join(ROOT, '.tmp', 'yt_sub');
try {
  execSync(
    `"${VENV_YTDLP}" --extractor-args "youtube:player_client=android,web" --write-auto-sub --write-sub --sub-lang "id,id-orig,en" --sub-format vtt --skip-download -o "${subPrefix}.%(ext)s" "${url}" 2>/dev/null`,
  );
} catch {
  // subtitle download might exit with warning, continue checking files
}

// Find downloaded VTT file
const tmpFiles = existsSync(path.join(ROOT, '.tmp')) ? readdirSync(path.join(ROOT, '.tmp')) : [];
const vttFile = ['yt_sub.id.vtt', 'yt_sub.id-orig.vtt', 'yt_sub.en.vtt'].find((f) => tmpFiles.includes(f));

if (vttFile) {
  console.log(`   ✓ Found YouTube native subtitles: ${vttFile}`);
  const vttText = readFileSync(path.join(ROOT, '.tmp', vttFile), 'utf-8');
  captions = parseVttToCaptions(vttText, startSec, reqDuration);
  console.log(`   ✓ Parsed ${captions.length} word-level tokens from YouTube neural ASR`);
}

// Fallback to whisper.cpp if YouTube has no captions
if (!captions.length) {
  console.log(`   ⚠️  No YouTube captions found. Transcribing with whisper.cpp...`);
  const wav16 = path.join(ROOT, '.tmp', 'clip_16k.wav');
  execSync(`ffmpeg -y -i "${clipPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${wav16}"`, {stdio: 'ignore'});

  const jsonPrefix = path.join(ROOT, '.tmp', 'whisper_out');
  execSync(
    `"${WHISPER_CLI}" -m "${WHISPER_MODEL}" -f "${wav16}" -l id -oj -of "${jsonPrefix}" -ml 1`,
    {stdio: 'ignore'},
  );

  const whisperJson = JSON.parse(readFileSync(`${jsonPrefix}.json`, 'utf-8'));
  const tokens = whisperJson.transcription || [];

  function parseWhisperMs(ts) {
    const [h, m, sWithMs] = ts.split(':');
    const [s, ms] = sWithMs.split(',');
    return (parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseInt(s, 10)) * 1000 + parseInt(ms, 10);
  }

  let currWord = '';
  let wStart = 0;
  let wEnd = 0;
  for (const t of tokens) {
    const txt = t.text;
    const tStart = parseWhisperMs(t.timestamps.from);
    const tEnd = parseWhisperMs(t.timestamps.to);

    if (txt.startsWith(' ') || (!captions.length && !currWord)) {
      if (currWord.trim()) {
        captions.push({text: ' ' + currWord.trim(), startMs: wStart, endMs: wEnd, timestampMs: wStart, confidence: 1});
      }
      currWord = txt;
      wStart = tStart;
      wEnd = tEnd;
    } else {
      currWord += txt;
      wEnd = tEnd;
    }
  }
  if (currWord.trim()) {
    captions.push({text: ' ' + currWord.trim(), startMs: wStart, endMs: wEnd, timestampMs: wStart, confidence: 1});
  }
}

// Write captions and metadata
const captionsPath = path.join(ROOT, 'src', 'clipped_captions.json');
writeFileSync(captionsPath, JSON.stringify(captions, null, 2));
writeFileSync(path.join(ROOT, 'public', 'clipped_captions.json'), JSON.stringify(captions, null, 2));

const finalTitle = customTitle !== null ? customTitle : meta.title.slice(0, 48).toUpperCase();
const metadata = {
  title: finalTitle,
  durationSec: reqDuration,
  url,
  startSec,
  endSec,
};
writeFileSync(path.join(ROOT, 'src', 'clipped_metadata.json'), JSON.stringify(metadata, null, 2));
console.log(`   ✓ Wrote captions (${captions.length} words) and metadata to src/`);

console.log(`\n🎬 4. Rendering vertical 9:16 Reel with Remotion...`);
const outMp4 = path.isAbsolute(customOut) ? customOut : path.join(ROOT, customOut);
execSync(
  `npx remotion render ClippedReel "${outMp4}" --concurrency=4`,
  {stdio: 'inherit'},
);

console.log(`\n🎉 Selesai! Video Reel vertical tersimpan di:\n👉 ${outMp4}\n`);
