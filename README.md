# Reels Generator

Generator video reels vertikal (1080×1920) berbahasa Indonesia, tanpa wajah.
Pipeline: naskah → suara (TTS) → caption otomatis → render video, semuanya lokal
kecuali suara ElevenLabs.

> Repo **private**. Lihat [Catatan lisensi](#catatan-lisensi) sebelum dipakai komersial atau dipublikasikan.

---

## Yang dibutuhkan

- **Node.js** (18+) dan **npm**
- **ffmpeg** / **ffprobe** di PATH (`brew install ffmpeg`)
- **Google Chrome** terpasang — render memakai Chrome sistem, bukan Chromium bawaan
  Remotion (yang sering crash di macOS versi baru).
- Untuk caption: **whisper.cpp** (otomatis di-download & di-build oleh
  `@remotion/install-whisper-cpp` saat pertama kali `npm run captions`).
- Untuk TTS open-source (Piper): **Python**. Di mesin ini pakai
  `/usr/bin/python3` (Xcode CLT), karena Homebrew Python di sini rusak.
  Lihat `scripts/tts.mjs`.

## Setup

```bash
npm install
cp .env.example .env     # lalu isi ELEVENLABS_API_KEY=...
```

Dua aset ini **tidak** ikut di repo (sengaja) dan harus kamu sediakan sendiri:

- `public/music.mp3` — musik latar bebas royalti (mis. dari Pixabay).
- API key ElevenLabs di `.env` (kalau pakai suara ElevenLabs).

## Alur pakai

Semua konten diatur lewat `src/content.json`. Untuk ganti video, salin salah satu
template ke `content.json`, lalu generate suara + caption, lalu render.

```bash
# 1. pilih template (contoh: stickman)
cp src/content-stickman.json src/content.json

# 2. buat suara + caption (ElevenLabs)
npm run tts:eleven      # -> public/voiceover.wav
npm run captions        # -> public/captions.json

# 3. render
npm run render          # -> out/reel.mp4
```

- `npm run studio` — buka Remotion Studio untuk preview di browser.
- `npm run tts` — TTS versi open-source (Piper), alternatif ElevenLabs.
- `npm run build:audio:eleven` — gabungan `tts:eleven` + `captions`.

> **Penting:** `voiceover.wav` dan `captions.json` hanya menyimpan narasi
> **terakhir**. Setiap ganti ke template bernarasi, jalankan ulang
> `tts:eleven` + `captions` (memakai kuota ElevenLabs).

## Template

Dispatcher ada di `src/Reel.tsx` (membaca `content.template`):

| Template     | Konten                       | Gaya |
|--------------|------------------------------|------|
| `tips`       | `src/content-tips.json`      | Listicle: kartu infografis, counter, step dots |
| `reflective` | `src/content-reflective.json`| Renungan: teks besar sinkron suara, quote card |
| `planet`     | `src/content-planet.json`    | Diagram 3D (Three.js) planet + label SVG |
| `stickman`   | `src/content-stickman.json`, `-fleming`, `-wright` | Animasi 2D stickman, adegan ganti mengikuti kata pemicu |

### Catatan render per template

- **planet** butuh flag WebGL — tambahkan `--gl=angle`:
  ```bash
  npx remotion render Reel out/planet.mp4 --gl=angle \
    --browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ```
- Untuk kualitas lebih tinggi (mengurangi shimmer teks), tambahkan `--crf=16`.
- **stickman**: `storyScenes[]` menentukan urutan adegan (`cue` = kata pemicu di
  naskah). `keywords` jadi kuning di subtitle. `captionFixes` mengoreksi salah
  dengar whisper. Topik baru butuh menggambar adegan baru di `src/Stickman.tsx`.
  Cek dulu timing `cue` sebelum menggambar — kalau dua cue terlalu dekat,
  adegannya berkelebat.

## Struktur

```
src/
  Root.tsx         komposisi Remotion (1080x1920, durasi dari voiceover/durationSec)
  Reel.tsx         dispatcher + template tips/reflective/planet
  Stickman.tsx     template stickman (semua adegan = SVG)
  content*.json    konten tiap video
scripts/
  tts-eleven.mjs   TTS ElevenLabs
  tts.mjs          TTS Piper (open-source)
  captions.mjs     caption via whisper.cpp
public/            aset hasil generate (gitignored) — taruh music.mp3 di sini
```

## Catatan lisensi

- **Remotion** TIDAK sepenuhnya gratis: bebas untuk individu, organisasi ≤3
  karyawan, dan nonprofit, tapi perusahaan for-profit yang lebih besar wajib
  membeli Company License. Lihat `node_modules/remotion/LICENSE.md`.
- **ElevenLabs** paket Free hanya untuk penggunaan non-komersial.
- **Musik & suara** tidak dibundel; pastikan kamu punya hak atas aset yang kamu pakai.
- Naskah biografi (Tesla/Fleming/Wright) ditulis dari pengetahuan umum dan sebagian
  berupa legenda populer — verifikasi faktanya sebelum dipublikasikan.
