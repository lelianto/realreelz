// Text-to-speech with edge-tts (free Microsoft Edge neural voices, no API key).
// Reads src/content.json -> writes public/voiceover.wav
//
// edge-tts is installed in ./.venv (same venv as Piper):
//   /usr/bin/python3 -m venv .venv && .venv/bin/pip install edge-tts
//
// Usage:
//   node scripts/tts-edge.mjs          synthesize src/content.json
//   node scripts/tts-edge.mjs list     list Indonesian voices
//
// Voice: content.json "edgeVoiceId" (default id-ID-ArdiNeural ♂, or
// id-ID-GadisNeural ♀), overridable with EDGE_VOICE. Optional "edgeRate"
// (e.g. "-5%") and "edgePitch" (e.g. "-20Hz") tune speed/pitch.
import {spawnSync, execSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EDGE = path.join(ROOT, '.venv', 'bin', 'edge-tts');
const OUT = path.join(ROOT, 'public', 'voiceover.wav');
const BIN = path.join(ROOT, '.bin');

if (!existsSync(EDGE)) {
  console.error(
    'edge-tts not installed. Run:\n' +
      '  /usr/bin/python3 -m venv .venv && .venv/bin/pip install edge-tts',
  );
  process.exit(1);
}

// `list` — show Indonesian voices and exit
if (process.argv[2] === 'list') {
  const r = spawnSync(EDGE, ['--list-voices'], {encoding: 'utf8'});
  const rows = (r.stdout || '').split('\n').filter((l) => /id-ID/.test(l) || /^Name/.test(l));
  console.log(rows.join('\n') || r.stderr);
  process.exit(r.status ?? 0);
}

const content = JSON.parse(readFileSync(path.join(ROOT, 'src', 'content.json'), 'utf8'));
const script = (content.script || '').trim();
if (!script) {
  console.error('src/content.json has no "script".');
  process.exit(1);
}
const voice = process.env.EDGE_VOICE || content.edgeVoiceId || 'id-ID-ArdiNeural';
const rate = content.edgeRate; // e.g. "-5%"
const pitch = content.edgePitch; // e.g. "-20Hz"

mkdirSync(path.join(ROOT, 'public'), {recursive: true});
mkdirSync(BIN, {recursive: true});
const txt = path.join(BIN, 'edge-input.txt');
const mp3 = path.join(BIN, 'edge-out.mp3');
writeFileSync(txt, script);

console.log(`🔊 edge-tts — voice ${voice}${rate ? ` rate ${rate}` : ''}…`);
const args = ['--voice', voice, '--file', txt, '--write-media', mp3];
if (rate) args.push('--rate', rate);
if (pitch) args.push('--pitch', pitch);
const res = spawnSync(EDGE, args, {stdio: ['ignore', 'inherit', 'inherit']});
if (res.status !== 0) {
  console.error('edge-tts failed', res.error ?? '');
  process.exit(1);
}

// edge-tts writes MP3; convert to a plain WAV (captions.mjs resamples to 16k).
execSync(`ffmpeg -y -v error -i "${mp3}" -ac 1 -ar 24000 -c:a pcm_s16le "${OUT}"`, {
  stdio: 'inherit',
});
rmSync(txt, {force: true});
rmSync(mp3, {force: true});
console.log(`✓ Wrote ${path.relative(ROOT, OUT)}`);
