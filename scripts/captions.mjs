// Word-level captions with whisper.cpp (open-source, runs offline).
// Reads public/voiceover.wav -> writes public/captions.json
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from '@remotion/install-whisper-cpp';
import {execSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WHISPER_DIR = path.join(ROOT, '.bin', 'whisper.cpp');
const WHISPER_VERSION = '1.7.4'; // has --dtw (token timestamps), builds with cmake
const MODEL = 'small'; // multilingual; 'base' faster, 'medium' more accurate
const SRC = path.join(ROOT, 'public', 'voiceover.wav');
const WAV16 = path.join(ROOT, '.bin', 'voiceover-16k.wav');
const OUT = path.join(ROOT, 'public', 'captions.json');

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
writeFileSync(OUT, JSON.stringify(captions, null, 2));
console.log(`✓ Wrote ${path.relative(ROOT, OUT)} (${captions.length} tokens)`);
