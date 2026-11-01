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
Dari topik user, buat SATU video ~45-55 detik. Keluarkan HANYA JSON valid (tanpa
teks lain, tanpa code fence) dengan bentuk PERSIS:

{
  "name": "<JUDUL PENDEK HURUF BESAR, utk badge>",
  "title": "<judul lengkap>",
  "accent": "#ffd23f",
  "script": "<naskah Bahasa Indonesia 110-150 kata>",
  "keywords": ["kata","kata"],
  "storyScenes": [ {"kind":"...", "cue":..., ...params}, ... ]
}

PILIH FORMAT dulu dari topiknya:
• FORMAT BIOGRAFI  -> kalau topik = seorang tokoh/penemu/ilmuwan. Pakai adegan "g*".
• FORMAT KONSEP    -> kalau topik = konsep/mental model/bias/istilah (mis "sunk cost
  fallacy", "survivorship bias", "compound interest"). Pakai adegan "c*".

ATURAN NASKAH — BIOGRAFI:
- Kalimat pertama = HOOK (pola "Pria/Wanita ini ... tapi ...").
- Alur: masalah -> perjuangan -> terobosan -> dampak -> penutup inspiratif.
- name = NAMA TOKOH huruf besar.

ATURAN NASKAH — KONSEP (CERITA DULU, BARU MAKNA):
- Mulai dgn CERITA/skenario relatable sehari-hari (pakai "kamu ..."), JANGAN definisi.
- Lalu baru REVEAL nama konsepnya, jelaskan kenapa itu terjadi, dan pelajarannya.
- Tutup dgn pertanyaan/ajakan refleksi.
- name = NAMA KONSEP huruf besar yang pendek (mis "SUNK COST").

UMUM: tulis SEMUA angka/tahun dgn huruf ("seribu sembilan ratus tiga"), JANGAN angka
di dalam naskah. Bahasa alami utk TTS. keywords = 6-10 kata penting (disorot kuning).

ADEGAN FORMAT BIOGRAFI (pakai HANYA "kind" ini):
- "gintro"        hook.                    params: mood ("sad"|"neutral"|"shock")
- "gportrait"     kenalkan tokoh.          params: label (mis "1867 · POLANDIA", <=18 huruf)
- "gwork"         bekerja/meneliti.        params: prop ("flask"|"bulb"|"gear"|"book"|"scope")
- "gstruggle"     kegagalan.               (tanpa param)
- "grival"        diragukan/konflik.       params: bubbleL, bubbleR (<=10 huruf)
- "gbreakthrough" terobosan.               params: label (nama temuan HURUF BESAR, <=12 huruf)
- "gimpact"       dampak ke dunia.         (tanpa param)
- "gaward"        penghargaan.             params: label (mis "NOBEL 1903", <=14 huruf)
- "gclose"        penutup inspiratif.      (tanpa param)
Adegan PERTAMA = {"kind":"gintro","cue":null,...}.

ADEGAN FORMAT KONSEP (pakai HANYA "kind" ini):
- "cstory"    adegan cerita relatable.  params: label (situasi, <=16 huruf), bubble (pikiran, <=38 huruf), mood, prop (opsional)
- "cthink"    dilema batin close-up.    params: bubble (<=38 huruf), mood
- "cdilemma"  dua pilihan.              params: optL, optR (<=14 huruf tiap opsi)
- "cdrain"    sumber daya hangus.       params: label (mis "Rp 50.000" / "2 JAM", <=12 huruf)
- "cterm"     REVEAL nama konsep.       params: term (HURUF BESAR, <=18 huruf), def (definisi singkat, <=42 huruf)
- "cwhy"      kenapa ini terjadi.       params: label (judul, <=18 huruf), points (array 2-3 poin, tiap <=28 huruf)
- "clesson"   pelajaran/takeaway.       params: label (<=30 huruf)
- "coutro"    penutup + pertanyaan.     params: label (pertanyaan singkat, <=28 huruf)
Adegan PERTAMA = {"kind":"cstory","cue":null,...}. Urutan disarankan:
cstory -> cthink/cdrain -> cdilemma -> cterm -> cwhy -> clesson -> coutro (8-9 adegan).

JANGAN campur adegan "g*" dan "c*" dalam satu video.

ATURAN cue (SANGAT PENTING): "cue" tiap adegan (kecuali yang pertama = null) adalah
SATU kata yang MUNCUL PERSIS di naskah & jadi pemicu ganti adegan saat diucapkan.
Pilih kata yang: umum & jelas (hindari angka/nama asing/singkatan — sering salah
dengar TTS), muncul sekali, runtut (cue ke-n setelah cue ke-(n-1)), & berjauhan
(idealnya tiap adegan >=3 detik).

Di SETIAP scene object tambahkan "hair" (kode warna, mis "#2a2320") & "moustache"
(true/false) supaya tokoh konsisten. Tokoh perempuan / everyman: "moustache": false.`;

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
