# Reels Generator

Generator video reels vertikal (1080×1920) berbahasa Indonesia, tanpa wajah.
Pipeline: naskah → suara (TTS) → caption otomatis → render video. Suara default
pakai **edge-tts** (suara neural Microsoft, gratis & tanpa API key); ElevenLabs
dan Piper tersedia sebagai alternatif.

> Repo **private**. Lihat [Catatan lisensi](#catatan-lisensi) sebelum dipakai komersial atau dipublikasikan.

---

## Yang dibutuhkan

- **Node.js** (18+) dan **npm**
- **ffmpeg** / **ffprobe** di PATH (`brew install ffmpeg`)
- **Google Chrome** terpasang — render memakai Chrome sistem, bukan Chromium bawaan
  Remotion (yang sering crash di macOS versi baru).
- Untuk caption: **whisper.cpp** (otomatis di-download & di-build oleh
  `@remotion/install-whisper-cpp` saat pertama kali `npm run captions`).
- Untuk TTS gratis (edge-tts / Piper): **Python** di `.venv`. Di mesin ini venv
  dibuat dengan `/usr/bin/python3` (Xcode CLT), karena Homebrew Python di sini
  rusak:
  ```bash
  /usr/bin/python3 -m venv .venv
  .venv/bin/pip install edge-tts piper-tts
  ```

## Setup

```bash
npm install
cp .env.example .env     # isi ANTHROPIC_API_KEY (untuk web app)
```

Aset/hal ini **tidak** ikut di repo (sengaja) dan harus kamu sediakan sendiri:

- `public/music.mp3` — musik latar bebas royalti (mis. dari Pixabay).
- `ANTHROPIC_API_KEY` di `.env` — hanya untuk web app / `npm run generate`.
- `ELEVENLABS_API_KEY` di `.env` — **opsional**, hanya kalau mau suara ElevenLabs
  (default sudah pakai edge-tts yang gratis).

## Cara cepat: web app (prompt → video)

Cukup tulis satu tokoh/topik, biarkan pipeline-nya jalan sampai MP4 jadi. Pakai
template **stickman generik** (tidak perlu menggambar adegan baru per tokoh).

```bash
npm run web      # buka http://localhost:4000
```

Cukup **satu** key di `.env`: `ANTHROPIC_API_KEY` (untuk mengubah prompt jadi
naskah + daftar adegan; model default `claude-sonnet-5-5`, ganti via
`ANTHROPIC_MODEL`). Suara pakai edge-tts yang gratis, jadi tidak perlu key lain.

Alurnya (semua server-side, key tidak pernah ke browser): prompt →
`scripts/generate-content.mjs` (LLM menulis `src/content.json`) → `tts:edge`
→ `captions` → `remotion render` → MP4 bisa diputar & diunduh di halaman.
Satu render jalan pada satu waktu. Proses ±2–5 menit.

Mau pakai ElevenLabs di web app? Jalankan dengan `TTS_ENGINE=eleven npm run web`
(perlu `ELEVENLABS_API_KEY`).

Mau tanpa web? Generate kontennya saja lalu pakai alur manual di bawah:

```bash
npm run generate "Alan Turing, bapak ilmu komputer"   # -> src/content.json
```

> Generator memilih **format** otomatis dari topiknya, pakai adegan generik saja
> (tidak perlu kode baru per topik):
>
> - **Biografi** (topik = tokoh/penemu): `gintro`, `gportrait`, `gwork`,
>   `gstruggle`, `grival`, `gbreakthrough`, `gimpact`, `gaward`, `gclose`.
> - **Konsep / mental model** (topik = bias/istilah/model, mis "sunk cost
>   fallacy"): cerita relatable dulu → makna → `cstory`, `cthink`, `cdilemma`,
>   `cdrain`, `cterm`, `cwhy`, `clesson`, `coutro`.
>
> Contoh konsep: `npm run generate "sunk cost fallacy"`. Tokoh perempuan /
> everyman tetap tampil generik — karakter stickman belum punya gaya rambut khusus.

## Alur pakai (manual)

Semua konten diatur lewat `src/content.json`. Untuk ganti video, salin salah satu
template ke `content.json`, lalu generate suara + caption, lalu render.

```bash
# 1. pilih template (contoh: stickman)
cp src/content-stickman.json src/content.json

# 2. buat suara + caption (edge-tts, gratis)
npm run build:audio:edge    # = tts:edge + captions

# 3. render
npm run render              # -> out/reel.mp4
```

Pilihan TTS (semuanya menulis `public/voiceover.wav`):

| Script | Mesin | Catatan |
|--------|-------|---------|
| `npm run tts:edge`   | edge-tts  | **Default.** Gratis, tanpa key, suara neural natural (`id-ID-ArdiNeural`/`GadisNeural`). Pilih suara: `npm run tts:edge list`. |
| `npm run tts:eleven` | ElevenLabs | Kualitas tinggi, perlu `ELEVENLABS_API_KEY`, kuota terbatas. |
| `npm run tts`        | Piper      | Open-source, offline, gratis; kualitas di bawah edge-tts. |

- `npm run studio` — buka Remotion Studio untuk preview di browser.
- `npm run build:audio:edge` / `:eleven` — gabungan `tts:*` + `captions`.
- `npm run clip <youtube-url>` — clipper otomatis YouTube ke Reels vertikal dengan dynamic karaoke caption.

> **Penting:** `voiceover.wav` dan `captions.json` hanya menyimpan narasi
> **terakhir**. Setiap ganti ke template bernarasi, jalankan ulang `tts:*` +
> `captions` (edge-tts gratis, jadi aman diulang).

## YouTube to Reels Clipper (Template `ClippedReel`)

Alat otomatis untuk mengubah video YouTube (podcast/wawancara horizontal) menjadi video Reels/Shorts vertikal (9:16) beresolusi 1080×1920 dengan caption dinamis (karaoke pop-word) yang sinkron presisi.

### Fitur
- **Auto Peak Heatmap**: Otomatis mendeteksi momen paling banyak diputar ulang (*#1 Most Replayed*) jika opsi `--start` tidak diisi.
- **Microsecond Word Timestamps**: Mengambil subtitle neural asli YouTube (`.vtt`) untuk akurasi sinkronisasi bibir 100% per kata tanpa drift/mendahului (fallback otomatis ke `whisper.cpp` jika video tidak punya subtitle).
- **Layout Vertikal Sinematik**:
  - Background: video atmosferik blur 45px (scale 1.25x).
  - Main Frame: video 16:9 di tengah dengan sudut membulat (*rounded corners*) dan drop shadow tebal.
  - Hook Title: judul hook tebal di atas tanpa badge pill.
  - Subtitle Mengambang (*Floating Dynamic Subtitle*): teks mengambang tanpa latar belakang kotak hitam (*no background box*), kata aktif menyala kuning elektrik (`#FFE600`) dengan efek pop-spring, jeda antarkata alami tanpa kedip (*seamless continuity*).
  - Progress bar dinamis di bagian bawah.

### Shortcut Command

```bash
# 1. Mode Otomatis (Cari momen paling ramai di video YouTube)
npm run clip https://www.youtube.com/watch?v=c8yYBCQrvfc

# 2. Mode Kustom (Tentukan timestamp mulai, durasi, dan judul hook)
npm run clip https://www.youtube.com/watch?v=c8yYBCQrvfc \
  --start 33:16 \
  --duration 55 \
  --title "BAGI-BAGI JABATAN POLITIK ITU SALAH?" \
  --out out/malaka-clip.mp4
```

| Opsi | Default | Penjelasan |
|---|---|---|
| `<youtube_url>` | *(Wajib)* | Link URL video YouTube |
| `--start` | Auto (Heatmap #1) | Menit mulai (format `MM:SS` atau detik, misal `33:16` atau `1996`) |
| `--duration` | `55` | Panjang klip dalam detik (15 hingga 60) |
| `--title` | Judul video YT | Teks headline hook huruf kapital di bagian atas |
| `--out` | `out/clipped-reel.mp4` | Path berkas video MP4 hasil render |

> Komposisi ini terdaftar di Remotion dengan id **`ClippedReel`**. Anda bisa membuka `npm run studio` untuk preview dan tweak kapan saja.

## Template

Dispatcher ada di `src/Reel.tsx` (membaca `content.template`):

| Template     | Konten                       | Gaya |
|--------------|------------------------------|------|
| `tips`       | `src/content-tips.json`      | Listicle: kartu infografis, counter, step dots |
| `reflective` | `src/content-reflective.json`| Renungan: teks besar sinkron suara, quote card |
| `planet`     | `src/content-planet.json`    | Diagram 3D (Three.js) planet + label SVG |
| `stickman`   | `-stickman`, `-fleming`, `-wright` (biografi) · `-sunkcost` (konsep) | Animasi 2D stickman, adegan ganti mengikuti kata pemicu. Dua format: biografi (`g*`) & konsep cerita→makna (`c*`) |
| `explainer`  | `src/content-dopamine.json`  | **Modern Vector Explainer** (Kurzgesagt / Vox style): Karakter proporsional bernyawa (napas, kedip, bicara, gestur modular), metafora bercerita multi-layer (HoloBrain, GrowthRocket, Iceberg, Desk, EurekaBulb, GoldenTrophy, Cosmos), pencahayaan atmosferik & partikel bokeh, kinetic subtitle |
| `youtube-psych` / `YoutubeLong` | `src/content-youtube-psych.json` | **YouTube Long-Form Documentary 16:9 (1920×1080, >5–10 menit)**: Dokumenter visual multi-bab membahas Psikologi Kognitif, Logical Fallacy, dan Sejarahnya (7 Bab, 20 adegan infografis & sejarah + panel Dossier riset, HUD timeline bab, subtitle broadcast lower-third) |
| `ClippedReel`| `public/clipped_video.mp4` + `src/clipped_captions.json` | YouTube Clipper: 9:16 vertical layout, video blur background, dynamic floating karaoke captions (`npm run clip`) |

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
  Reel.tsx         dispatcher + template tips/reflective/planet/explainer
  Explainer.tsx    template modern vector explainer (karakter proporsional + visual metafora)
  Stickman.tsx     template stickman (semua adegan = SVG)
  ClippedReel.tsx  template YouTube to Reels clipper
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
