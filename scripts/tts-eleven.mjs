// Text-to-speech with ElevenLabs (natural voices, incl. male Indonesian).
// Reads src/content.json + .env -> writes public/voiceover.wav
//
// Setup: copy .env.example to .env and put your key:
//   ELEVENLABS_API_KEY=sk_...
// Pick a voice:  node scripts/tts-eleven.mjs list
// Synthesize:    node scripts/tts-eleven.mjs
import {execSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'voiceover.wav');
const TMP_MP3 = path.join(ROOT, 'public', 'voiceover.src.mp3');

// --- load .env (simple parser) + process.env ---
const env = {...process.env};
const envFile = path.join(ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const API_KEY = env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error(
    'Missing ELEVENLABS_API_KEY.\n' +
      'Create a .env file (copy .env.example) with:\n' +
      '  ELEVENLABS_API_KEY=sk_your_key_here',
  );
  process.exit(1);
}

const headers = {'xi-api-key': API_KEY};

// --- `list` mode: show available voices so you can pick an id ---
if (process.argv[2] === 'list') {
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {headers});
  if (!res.ok) {
    console.error('ElevenLabs error', res.status, await res.text());
    process.exit(1);
  }
  const {voices} = await res.json();
  for (const v of voices) {
    const labels = Object.values(v.labels ?? {}).join(', ');
    console.log(`${v.voice_id}  ${v.name.padEnd(18)} ${labels}`);
  }
  console.log(
    `\n${voices.length} voices. Set one in src/content.json:  "elevenVoiceId": "<id>"`,
  );
  process.exit(0);
}

// --- synthesize ---
const content = JSON.parse(
  readFileSync(path.join(ROOT, 'src', 'content.json'), 'utf8'),
);
const text = content.script;
// default: "Adam" (deep male). Override via content.json "elevenVoiceId".
const voiceId = env.ELEVEN_VOICE_ID || content.elevenVoiceId || 'pNInz6obpgDQGcFmaJgB';
const modelId = content.elevenModel || 'eleven_multilingual_v2';

mkdirSync(path.join(ROOT, 'public'), {recursive: true});
console.log(`🔊 ElevenLabs: voice ${voiceId}, model ${modelId}…`);

const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
  {
    method: 'POST',
    headers: {...headers, 'Content-Type': 'application/json', accept: 'audio/mpeg'},
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: content.elevenStability ?? 0.5,
        similarity_boost: content.elevenSimilarity ?? 0.8,
        style: content.elevenStyle ?? 0.0,
      },
    }),
  },
);

if (!res.ok) {
  console.error('ElevenLabs error', res.status, await res.text());
  process.exit(1);
}

writeFileSync(TMP_MP3, Buffer.from(await res.arrayBuffer()));
// convert to 22.05kHz mono wav for the pipeline
execSync(`ffmpeg -y -v error -i "${TMP_MP3}" -ar 22050 -ac 1 "${OUT}"`, {
  stdio: 'inherit',
});
execSync(`rm -f "${TMP_MP3}"`);
console.log(`✓ Wrote ${path.relative(ROOT, OUT)}`);
