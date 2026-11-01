// Generate comparison audio samples for several ElevenLabs voices.
//   node scripts/eleven-sample.mjs
// Writes out/samples/<name>.mp3 using the script in src/content.json.
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const env = {...process.env};
const ef = path.join(ROOT, '.env');
if (existsSync(ef)) {
  for (const l of readFileSync(ef, 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const KEY = env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error('Missing ELEVENLABS_API_KEY in .env');
  process.exit(1);
}

const {script} = JSON.parse(
  readFileSync(path.join(ROOT, 'src', 'content.json'), 'utf8'),
);
const OUT = path.join(ROOT, 'out', 'samples');
mkdirSync(OUT, {recursive: true});

// name -> voice_id
const voices = [
  ['Brian', 'nPczCjzI2devNBz1zQrb'],
  ['Liam', 'TX3LPaxmHKxFdv7VOQHJ'],
  ['Eric', 'cjVigY5qzO86Huf0OWal'],
];

for (const [name, id] of voices) {
  process.stdout.write(`→ ${name}… `);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {'xi-api-key': KEY, 'Content-Type': 'application/json', accept: 'audio/mpeg'},
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {stability: 0.5, similarity_boost: 0.8},
      }),
    },
  );
  if (!res.ok) {
    console.log('ERROR', res.status, await res.text());
    continue;
  }
  writeFileSync(path.join(OUT, `${name}.mp3`), Buffer.from(await res.arrayBuffer()));
  console.log('ok');
}
console.log('done ->', path.relative(ROOT, OUT));
