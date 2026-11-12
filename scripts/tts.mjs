// Text-to-speech with Piper (open-source, runs fully offline).
// Reads src/content.json -> writes public/voiceover.wav
//
// Piper is installed as a Python package (piper-tts) in ./.venv. The rhasspy
// prebuilt macOS binaries are broken (missing dylibs / wrong arch), and the
// Homebrew Python interpreters on this machine have a broken pyexpat, so we use
// the healthy Xcode CLT python (/usr/bin/python3, 3.9) to build the venv:
//   /usr/bin/python3 -m venv .venv && .venv/bin/pip install piper-tts
import {spawnSync, execSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync} from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BIN = path.join(ROOT, '.bin');
const PIPER = path.join(ROOT, '.venv', 'bin', 'piper');
const VOICE_DIR = path.join(BIN, 'voices');
const MODEL = path.join(VOICE_DIR, 'id_ID-news_tts-medium.onnx');
const CONFIG = `${MODEL}.json`;
const OUT = path.join(ROOT, 'public', 'voiceover.wav');

const VOICE_BASE =
  'https://huggingface.co/rhasspy/piper-voices/resolve/main/id/id_ID/news_tts/medium';

const sh = (cmd) => execSync(cmd, {stdio: 'inherit'});

if (!existsSync(PIPER)) {
  console.error(
    'Piper not installed. Run:\n' +
      '  /usr/bin/python3 -m venv .venv && .venv/bin/pip install piper-tts',
  );
  process.exit(1);
}

mkdirSync(VOICE_DIR, {recursive: true});
mkdirSync(path.join(ROOT, 'public'), {recursive: true});

// Indonesian voice model
if (!existsSync(MODEL)) {
  console.log('↓ Downloading Indonesian voice (id_ID-news_tts-medium)…');
  sh(`curl -L --fail -o "${MODEL}" "${VOICE_BASE}/id_ID-news_tts-medium.onnx"`);
  sh(`curl -L --fail -o "${CONFIG}" "${VOICE_BASE}/id_ID-news_tts-medium.onnx.json"`);
}

// Synthesize (text from stdin)
const {script, voicePitch = 0} = JSON.parse(
  readFileSync(path.join(ROOT, 'src', 'content.json'), 'utf8'),
);
const spokenScript = (script || '')
  .replace(/\bAI\b/g, 'Ei Ai')
  .replace(/\bA\.I\.\b/g, 'Ei Ai');

console.log('🔊 Synthesizing voiceover…');
const res = spawnSync(
  PIPER,
  ['-m', MODEL, '-c', CONFIG, '-f', OUT, '--sentence-silence', '0.35'],
  {input: spokenScript, stdio: ['pipe', 'inherit', 'inherit']},
);

if (res.status !== 0) {
  console.error('Piper failed', res.error ?? '');
  process.exit(1);
}

// Optional pitch shift (semitones). Negative = deeper/more "male".
// Keeps duration constant (asetrate lowers pitch+speed, atempo restores speed),
// so captions and scene timings stay in sync.
if (voicePitch !== 0) {
  const ratio = Math.pow(2, voicePitch / 12);
  const sr = 22050;
  const tmp = path.join(ROOT, 'public', 'voiceover.shift.wav');
  console.log(`🎚  Shifting pitch ${voicePitch} semitones…`);
  execSync(
    `ffmpeg -y -v error -i "${OUT}" -filter:a ` +
      `"asetrate=${sr}*${ratio},aresample=${sr},atempo=${(1 / ratio).toFixed(5)}" ` +
      `"${tmp}" && mv "${tmp}" "${OUT}"`,
    {stdio: 'inherit'},
  );
}

console.log(`✓ Wrote ${path.relative(ROOT, OUT)}`);
