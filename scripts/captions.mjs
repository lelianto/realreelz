// Word-level captions with whisper.cpp (open-source, runs offline).
// Reads public/voiceover.wav -> writes public/captions.json
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from '@remotion/install-whisper-cpp';
import {execSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WHISPER_DIR = path.join(ROOT, '.bin', 'whisper.cpp');
const WHISPER_VERSION = '1.7.4'; // has --dtw (token timestamps), builds with cmake
const MODEL = 'small'; // multilingual; 'base' faster, 'medium' more accurate
const SRC = path.join(ROOT, 'public', 'voiceover.wav');
const WAV16 = path.join(ROOT, '.bin', 'voiceover-16k.wav');
const OUT = path.join(ROOT, 'public', 'captions.json');
const CONTENT = path.join(ROOT, 'src', 'content.json');

function alignWithScript(captions, script) {
  const scriptWords = script.split(/\s+/).filter(Boolean);
  if (!scriptWords.length || !captions.length) return captions;

  const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Group sub-word tokens from whisper into whole-word whisper items first
  const whisperWords = [];
  for (const t of captions) {
    const c = clean(t.text);
    if (!c) continue;
    if (whisperWords.length === 0 || t.text.startsWith(' ')) {
      whisperWords.push({
        clean: c,
        startMs: t.startMs,
        endMs: t.endMs,
      });
    } else {
      const prev = whisperWords[whisperWords.length - 1];
      prev.clean += c;
      prev.endMs = t.endMs;
    }
  }

  const N = scriptWords.length;
  const M = whisperWords.length;
  if (M === 0) return captions;

  const sClean = scriptWords.map(clean);

  const sim = (a, b) => {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const minL = Math.min(a.length, b.length);
    const maxL = Math.max(a.length, b.length);
    if (a.startsWith(b) || b.startsWith(a)) {
      return minL / maxL;
    }
    let matches = 0;
    for (let i = 0; i < minL; i++) {
      if (a[i] === b[i]) matches++;
    }
    let tailMatches = 0;
    for (let i = 1; i <= minL; i++) {
      if (a[a.length - i] === b[b.length - i]) tailMatches++;
    }
    return Math.max(matches, tailMatches) / maxL;
  };

  // Global Dynamic Programming alignment (Needleman-Wunsch with 1-to-2 compound support
  // for Indonesian hyphenated reduplications like "bertanya-tanya", "terus-menerus")
  const INF = 1e9;
  const dp = new Float32Array((N + 1) * (M + 1)).fill(INF);
  // 1 = match (1,1), 2 = compound (1,2), 3 = skip script (1,0), 4 = skip whisper (0,1)
  const ptr = new Uint8Array((N + 1) * (M + 1));
  const idx = (i, j) => i * (M + 1) + j;

  dp[idx(0, 0)] = 0;
  const GAP_S = 0.85;
  const GAP_W = 0.85;

  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= M; j++) {
      const cur = dp[idx(i, j)];
      if (cur >= INF) continue;

      // 1-to-1 match/substitution
      if (i < N && j < M) {
        const cost = 1 - sim(sClean[i], whisperWords[j].clean);
        const next = cur + cost;
        const k = idx(i + 1, j + 1);
        if (next < dp[k]) {
          dp[k] = next;
          ptr[k] = 1;
        }
      }

      // 1-to-2 compound match (e.g., "bertanya-tanya" -> "bertanya" + "tanya")
      if (i < N && j + 1 < M) {
        const merged = whisperWords[j].clean + whisperWords[j + 1].clean;
        const cost = 1 - sim(sClean[i], merged) + 0.05;
        const next = cur + cost;
        const k = idx(i + 1, j + 2);
        if (next < dp[k]) {
          dp[k] = next;
          ptr[k] = 2;
        }
      }

      // Skip script word (whisper missed it)
      if (i < N) {
        const next = cur + GAP_S;
        const k = idx(i + 1, j);
        if (next < dp[k]) {
          dp[k] = next;
          ptr[k] = 3;
        }
      }

      // Skip whisper word (extra token in whisper)
      if (j < M) {
        const next = cur + GAP_W;
        const k = idx(i, j + 1);
        if (next < dp[k]) {
          dp[k] = next;
          ptr[k] = 4;
        }
      }
    }
  }

  // Backtrack from (N, M)
  const aligned = new Array(N);
  let i = N;
  let j = M;
  while (i > 0 || j > 0) {
    const op = ptr[idx(i, j)];
    if (op === 1) {
      aligned[i - 1] = {
        startMs: whisperWords[j - 1].startMs,
        endMs: whisperWords[j - 1].endMs,
      };
      i--;
      j--;
    } else if (op === 2) {
      aligned[i - 1] = {
        startMs: whisperWords[j - 2].startMs,
        endMs: whisperWords[j - 1].endMs,
      };
      i--;
      j -= 2;
    } else if (op === 3) {
      aligned[i - 1] = null; // interpolate after backtrack
      i--;
    } else {
      j--;
    }
  }

  // Fill any interpolated (null) slots smoothly between neighboring words
  const finalTokens = [];
  for (let s = 0; s < N; s++) {
    let slot = aligned[s];
    if (!slot) {
      const prevEnd = s > 0 && finalTokens[s - 1] ? finalTokens[s - 1].endMs : 0;
      let nextStart = prevEnd + 180;
      for (let k = s + 1; k < N; k++) {
        if (aligned[k]) {
          nextStart = aligned[k].startMs;
          break;
        }
      }
      const startMs = prevEnd;
      const endMs = Math.max(startMs + 80, Math.min(prevEnd + 220, nextStart));
      slot = {startMs, endMs};
    }
    const startMs = slot.startMs;
    const endMs = Math.max(startMs + 80, slot.endMs);
    const sw = scriptWords[s];
    finalTokens.push({
      text: s === 0 ? sw : ' ' + sw,
      startMs,
      endMs,
      timestampMs: Math.round((startMs + endMs) / 2),
      confidence: 0.99,
    });
  }

  return finalTokens;
}

if (!existsSync(SRC)) {
  console.error('Missing public/voiceover.wav — run `npm run tts` first.');
  process.exit(1);
}

mkdirSync(path.dirname(WAV16), {recursive: true});

console.log('⚙  Installing whisper.cpp…');
await installWhisperCpp({to: WHISPER_DIR, version: WHISPER_VERSION});

console.log(`↓ Downloading whisper model: ${MODEL}…`);
await downloadWhisperModel({model: MODEL, folder: WHISPER_DIR});

// whisper.cpp needs 16 kHz mono wav
console.log('🎚  Converting audio to 16 kHz…');
execSync(`ffmpeg -y -i "${SRC}" -ar 16000 -ac 1 -c:a pcm_s16le "${WAV16}"`, {
  stdio: 'ignore',
});

console.log('✍  Transcribing (language: id)…');
const whisperCppOutput = await transcribe({
  inputPath: WAV16,
  whisperPath: WHISPER_DIR,
  whisperCppVersion: WHISPER_VERSION, // required by @remotion/install-whisper-cpp 4.x
  model: MODEL,
  tokenLevelTimestamps: true,
  language: 'id',
});

const {captions} = toCaptions({whisperCppOutput});

let outputCaptions = captions;
if (existsSync(CONTENT)) {
  try {
    const content = JSON.parse(readFileSync(CONTENT, 'utf8'));
    if (content.script) {
      console.log('🎯 Aligning captions with canonical script...');
      outputCaptions = alignWithScript(captions, content.script);
    }
  } catch (err) {
    console.warn('Could not read script for alignment:', err.message);
  }
}

writeFileSync(OUT, JSON.stringify(outputCaptions, null, 2));
console.log(`✓ Wrote ${path.relative(ROOT, OUT)} (${outputCaptions.length} tokens)`);
