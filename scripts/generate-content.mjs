// Prompt -> src/content.json (template "stickman", generic scenes).
// Uses the Anthropic API to turn a free-form prompt (a figure/topic) into a
// script + scene list. Only the GENERIC scene kinds are used, so no new code
// is ever needed per topic.
//
//   node scripts/generate-content.mjs "Marie Curie"
//   node scripts/generate-content.mjs            (reads prompt from stdin)
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// --- load .env ---
const env = {...process.env};
const envFile = path.join(ROOT, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const API_KEY = env.ANTHROPIC_API_KEY;
const MODEL = env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
if (!API_KEY) {
  console.error(
    'Missing ANTHROPIC_API_KEY in .env.\n' +
      'Add:  ANTHROPIC_API_KEY=sk-ant-...\n' +
      '(needed to turn a prompt into a script + scenes)',
  );
  process.exit(1);
}

const prompt = (process.argv.slice(2).join(' ') || readFileSync(0, 'utf8')).trim();
if (!prompt) {
  console.error('Beri topik/tokoh. Contoh: node scripts/generate-content.mjs "Marie Curie"');
  process.exit(1);
}

const SYSTEM = `Kamu penulis naskah video reels edukatif Bahasa Indonesia bergaya stickman.
Dari topik yang diberikan user (biasanya seorang penemu/ilmuwan/tokoh), buat SATU
video berdurasi ~45-55 detik. Keluarkan HANYA JSON valid (tanpa teks lain, tanpa
code fence) dengan bentuk PERSIS:

{
  "name": "<NAMA TOKOH HURUF BESAR, utk badge>",
  "title": "<Nama lengkap>",
  "accent": "#ffd23f",
  "script": "<naskah Bahasa Indonesia 110-140 kata>",
  "keywords": ["kata","kata"],
  "storyScenes": [ {"kind":"...", "cue":..., ...params}, ... ]
}

ATURAN NASKAH:
- Kalimat pertama = HOOK kuat (pola "Pria/Wanita ini ... tapi ...").
- Alur: awal/masalah -> perjuangan/keraguan -> terobosan -> dampak besar -> penutup inspiratif.
- Tulis SEMUA angka/tahun dalam huruf ("seribu sembilan ratus tiga"), JANGAN angka.
- Bahasa alami untuk dibacakan TTS.

ATURAN keywords: 6-10 kata penting dari naskah; akan disorot kuning di subtitle.

ATURAN storyScenes (8-10 adegan): HANYA pakai "kind" dari daftar ini:
- "gintro"        pembuka/hook.            params: mood ("sad"|"neutral"|"shock")
- "gportrait"     kenalkan tokoh.          params: label (mis "1867 · POLANDIA", <=18 huruf)
- "gwork"         bekerja/meneliti.        params: prop ("flask"|"bulb"|"gear"|"book"|"scope")
- "gstruggle"     kegagalan/keraguan.      (tanpa param)
- "grival"        konflik/diragukan.       params: bubbleL, bubbleR (<=10 huruf tiap bubble)
- "gbreakthrough" momen terobosan.         params: label (nama temuan HURUF BESAR, <=12 huruf)
- "gimpact"       dampak ke dunia.         (tanpa param)
- "gaward"        penghargaan.             params: label (mis "NOBEL 1903", <=14 huruf)
- "gclose"        penutup inspiratif.      (tanpa param)
Urutan bebas asal masuk akal. Adegan PERTAMA selalu {"kind":"gintro","cue":null,...}.

ATURAN cue (SANGAT PENTING): "cue" tiap adegan (kecuali yang pertama = null) adalah
SATU kata yang MUNCUL PERSIS di naskah dan menjadi pemicu pergantian adegan saat
kata itu diucapkan. Pilih kata yang:
- umum & jelas (hindari angka, nama asing, singkatan — sering salah dengar TTS),
- muncul sekali & posisinya runtut (cue adegan ke-n harus muncul setelah cue ke-(n-1)),
- jaraknya berjauhan (idealnya tiap adegan dapat >=3 detik).

Konsistenkan penampilan tokoh di SEMUA adegan: tambahkan di tiap scene object
"hair" (kode warna, mis "#3a2c20") dan "moustache" (true/false). Untuk tokoh
perempuan set "moustache": false.`;

const body = {
  model: MODEL,
  max_tokens: 2000,
  system: SYSTEM,
  messages: [{role: 'user', content: `Topik: ${prompt}`}],
};

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
  body: JSON.stringify(body),
});
if (!res.ok) {
  console.error('Anthropic error', res.status, await res.text());
  process.exit(1);
}
const data = await res.json();
let text = (data.content ?? []).map((b) => b.text || '').join('').trim();
text = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();

let gen;
try {
  gen = JSON.parse(text);
} catch (e) {
  console.error('Gagal parse JSON dari model:\n', text);
  process.exit(1);
}

// merge with fixed pipeline defaults
const content = {
  template: 'stickman',
  name: gen.name,
  title: gen.title,
  script: gen.script,
  elevenVoiceId: env.ELEVEN_VOICE_ID || 'nPczCjzI2devNBz1zQrb',
  elevenStability: 0.45,
  elevenStyle: 0.2,
  music: 'music.mp3',
  musicVolume: 0.08,
  accent: gen.accent || '#ffd23f',
  captionFixes: {},
  keywords: gen.keywords || [],
  storyScenes: gen.storyScenes || [],
};

const out = path.join(ROOT, 'src', 'content.json');
writeFileSync(out, JSON.stringify(content, null, 2) + '\n');
console.error(`✓ ${content.title} — ${content.storyScenes.length} adegan -> src/content.json`);
