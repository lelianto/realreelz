// Local web app: submit a prompt -> generate script+scenes -> voiceover ->
// captions -> render -> download the MP4. Dependency-free (Node built-in http).
//
//   npm run web      then open http://localhost:4000
//
// Heavy work (render) runs server-side; API keys stay in .env, never the browser.
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {createReadStream, existsSync, readFileSync, statSync, mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import path from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 4000);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.join(ROOT, 'out');
mkdirSync(OUT_DIR, {recursive: true});

// ---- single job slot (render is heavy; one at a time) ----
/** @type {null | {id,prompt,state,step,steps,log,video,error,startedAt}} */
let current = null;

const STEPS = [
  {key: 'generate', label: 'Menulis naskah & adegan (LLM)'},
  {key: 'tts', label: 'Membuat suara (ElevenLabs)'},
  {key: 'captions', label: 'Membuat caption (whisper)'},
  {key: 'render', label: 'Render video'},
];

function run(cmd, args, job, stepKey) {
  return new Promise((resolve, reject) => {
    job.step = stepKey;
    const p = spawn(cmd, args, {cwd: ROOT, env: process.env});
    const push = (b) => {
      const s = b.toString();
      job.log += s;
      if (job.log.length > 20000) job.log = job.log.slice(-20000);
    };
    p.stdout.on('data', push);
    p.stderr.on('data', push);
    p.on('error', reject);
    p.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${stepKey} gagal (exit ${code})`)),
    );
  });
}

async function runJob(job) {
  try {
    if (!job.skipGenerate) {
      await run('node', ['scripts/generate-content.mjs', job.prompt], job, 'generate');
    }
    await run('node', ['scripts/tts-eleven.mjs'], job, 'tts');
    await run('node', ['scripts/captions.mjs'], job, 'captions');
    const outRel = path.join('out', `web-${job.id}.mp4`);
    await run(
      'npx',
      [
        'remotion',
        'render',
        'Reel',
        outRel,
        '--crf=18',
        `--browser-executable=${CHROME}`,
      ],
      job,
      'render',
    );
    job.video = outRel;
    job.state = 'done';
    job.step = 'done';
  } catch (e) {
    job.state = 'error';
    job.error = e.message;
  }
}

// ---- tiny http helpers ----
function json(res, code, obj) {
  const b = JSON.stringify(obj);
  res.writeHead(code, {'content-type': 'application/json', 'content-length': Buffer.byteLength(b)});
  res.end(b);
}
function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => resolve(d));
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // --- static: the single-page UI ---
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    const file = path.join(ROOT, 'web', 'index.html');
    const html = readFileSync(file);
    res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
    return res.end(html);
  }

  // --- start a job ---
  if (req.method === 'POST' && url.pathname === '/api/generate') {
    if (current && current.state === 'running') {
      return json(res, 409, {error: 'Masih ada video yang sedang dibuat. Tunggu dulu ya.'});
    }
    let body = {};
    try {
      body = JSON.parse((await readBody(req)) || '{}');
    } catch {}
    const prompt = (body.prompt || '').trim();
    if (!prompt && !body.skipGenerate) return json(res, 400, {error: 'Prompt kosong.'});
    if (body.voiceId) process.env.ELEVEN_VOICE_ID = String(body.voiceId);
    current = {
      id: randomUUID().slice(0, 8),
      prompt,
      skipGenerate: !!body.skipGenerate,
      state: 'running',
      step: STEPS[0].key,
      log: '',
      video: null,
      error: null,
      startedAt: Date.now(),
    };
    runJob(current); // fire and forget
    return json(res, 200, {id: current.id, steps: STEPS});
  }

  // --- poll status ---
  if (req.method === 'GET' && url.pathname === '/api/status') {
    if (!current) return json(res, 200, {state: 'idle', steps: STEPS});
    const stepIndex = STEPS.findIndex((s) => s.key === current.step);
    return json(res, 200, {
      id: current.id,
      state: current.state,
      step: current.step,
      stepIndex,
      steps: STEPS,
      error: current.error,
      log: current.log.slice(-4000),
      videoReady: current.state === 'done' && !!current.video,
      prompt: current.prompt,
    });
  }

  // --- serve the finished video ---
  if (req.method === 'GET' && url.pathname === '/api/video') {
    if (!current || !current.video || !existsSync(path.join(ROOT, current.video))) {
      return json(res, 404, {error: 'Video belum ada.'});
    }
    const file = path.join(ROOT, current.video);
    const size = statSync(file).size;
    const range = req.headers.range;
    if (range) {
      const [s, e] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(s, 10);
      const end = e ? parseInt(e, 10) : size - 1;
      res.writeHead(206, {
        'content-range': `bytes ${start}-${end}/${size}`,
        'accept-ranges': 'bytes',
        'content-length': end - start + 1,
        'content-type': 'video/mp4',
      });
      return createReadStream(file, {start, end}).pipe(res);
    }
    res.writeHead(200, {
      'content-type': 'video/mp4',
      'content-length': size,
      'content-disposition': `inline; filename="reel-${current.id}.mp4"`,
    });
    return createReadStream(file).pipe(res);
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, () => {
  const hasEleven = existsSync(path.join(ROOT, '.env')) &&
    /ELEVENLABS_API_KEY=\S/.test(readFileSync(path.join(ROOT, '.env'), 'utf8'));
  console.log(`\n  Reels web  →  http://localhost:${PORT}\n`);
  if (!hasEleven) console.log('  ⚠  .env belum punya ELEVENLABS_API_KEY — TTS akan gagal.');
  if (!existsSync(path.join(ROOT, 'public', 'music.mp3')))
    console.log('  ⚠  public/music.mp3 belum ada — musik latar kosong.');
  console.log('');
});
