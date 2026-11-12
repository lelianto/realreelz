# Contributing

Terima kasih sudah mau berkontribusi! / Thanks for contributing! Issues and PRs
are welcome in Indonesian or English.

## Setup

```bash
npm install
python3 -m venv .venv && .venv/bin/pip install edge-tts
cp .env.example .env
npm run studio        # preview templates in the browser
```

## Before opening a PR

- Run `npx tsc --noEmit` (CI runs the same check).
- Never commit secrets (`.env`), generated media (`public/*`, `out/`, `*.mp4`,
  `*.wav`, `*.mp3`) or downloaded binaries (`.bin/`, `.venv/`).
- Don't hardcode personal handles, absolute paths or OS-specific binaries.
  Use `DEFAULT_HANDLE` from `src/brand.ts` and the env vars in `.env.example`.
- Keep a template self-contained: one `src/<Template>.tsx` plus one example
  `src/content-<name>.json`, and add a row to the template table in the README.
- Only add assets (fonts, music, images) you have the right to redistribute,
  and note their license in the PR.

## Adding a new template

1. Create `src/MyTemplate.tsx` exporting a component that reads its scenes from
   the content JSON.
2. Route it in the dispatcher in `src/Reel.tsx` via `content.template`.
3. Add `src/content-mytemplate.json` as an example and document it in the README.
