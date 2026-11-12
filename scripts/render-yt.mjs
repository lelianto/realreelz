// Fast 16:9 Long-Form YouTube Renderer (Remotion Visuals + FFmpeg Audio Mastering)
// Renders YoutubeLong composition -> mixes voiceover-yt.wav + looped music.mp3 -> out/youtube-psych.mp4
import {execSync} from 'node:child_process';
import {existsSync, mkdirSync, rmSync} from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BIN = path.join(ROOT, '.bin');
const OUT_DIR = path.join(ROOT, 'out');
const TEMP_VIDEO = path.join(BIN, 'yt-video-only.mp4');
const FINAL_OUT = path.join(OUT_DIR, 'youtube-psych.mp4');
const VOICE = path.join(ROOT, 'public', 'voiceover-yt.wav');
const MUSIC = path.join(ROOT, 'public', 'music.mp3');

mkdirSync(BIN, {recursive: true});
mkdirSync(OUT_DIR, {recursive: true});

console.log('🎬 Step 1/2: Rendering 16:9 Full HD (1920x1080) visual frames via Remotion…');
execSync(
  `npx remotion render YoutubeLong "${TEMP_VIDEO}" --image-format=jpeg --jpeg-quality=92 --concurrency=8`,
  {stdio: 'inherit'},
);

console.log('🎚  Step 2/2: Mixing voiceover + looping background music via FFmpeg…');
const durRaw = execSync(
  `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${VOICE}"`,
  {encoding: 'utf8'},
).trim();
const durSec = Math.ceil(parseFloat(durRaw) || 404);
const fadeOutStart = Math.max(0, durSec - 3);

if (existsSync(MUSIC)) {
  execSync(
    `ffmpeg -y -v error -i "${TEMP_VIDEO}" -i "${VOICE}" -stream_loop -1 -i "${MUSIC}" ` +
      `-filter_complex "[1:a]volume=1.0[vo];[2:a]volume=0.08,afade=t=in:st=0:d=1.5,afade=t=out:st=${fadeOutStart}:d=2.5[bg];[vo][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]" ` +
      `-map 0:v:0 -map "[aout]" -c:v copy -c:a aac -b:a 192k -shortest "${FINAL_OUT}"`,
    {stdio: 'inherit'},
  );
} else {
  execSync(
    `ffmpeg -y -v error -i "${TEMP_VIDEO}" -i "${VOICE}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "${FINAL_OUT}"`,
    {stdio: 'inherit'},
  );
}

rmSync(TEMP_VIDEO, {force: true});
rmSync(path.join(OUT_DIR, 'yt-test.mp4'), {force: true});
console.log(`✓ Saved full YouTube video: ${path.relative(ROOT, FINAL_OUT)} (${durSec}s)`);
