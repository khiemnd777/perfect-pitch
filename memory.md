# Project Memory

## Purpose
- Perfect Pitch is a client-side ear-training web app for 6 modes: `single`, `double`, `melody`, `interval`, `arpeggio`, and `chord`.
- The product goal is instant feedback: selecting an answer grades immediately and reveals the correct choice.
- The app should sound like a sampled piano rather than a synthesized oscillator.

## Stack
- Runtime and tooling: `Bun`, `Vite`, `React 19`, `TypeScript`, `Vitest`, `ESLint`.
- Audio layer: `tone`.
- Assets: local piano samples under `public/audio/piano/`.
- Deployment: `GitHub Actions`, `Docker`, `Caddy`.
- Hosted analytics can be enabled with Google Analytics 4 via the optional build-time env var `VITE_GA_MEASUREMENT_ID`.

## Architecture
- App wiring lives in `src/app`.
- Feature logic is split under `src/features/audio`, `src/features/game`, and `src/features/question-bank`.
- Shared public types live in `src/shared/gameTypes.ts`.
- Shared bilingual copy and text resolvers live in `src/shared/localization.ts`, while language persistence helpers live in `src/app/languagePreference.ts`.
- Music helpers and deterministic random utilities live in `src/shared/music.ts` and `src/shared/random.ts`.
- Mode progression and difficulty persistence live in `src/features/game/progression.ts`.

## Product Rules
- The app supports both English and Vietnamese UI/content, defaults to English, and persists the selected language in local storage.
- `single` mode answers identify pitch class only, not octave.
- `double` mode choices must remain unambiguous and use sorted note labels.
- `melody` mode choices must match playback length and avoid visually duplicate distractors.
- `chord` mode identifies harmonically stacked triads played together; `arpeggio` remains the broken-chord mode.
- All modes use fixed levels `easy` / `medium` / `hard`; level-up now depends on accumulated correct answers at the current level, while level-down still reacts to incorrect streaks.
- Every generated question must contain exactly 4 unique choices with exactly 1 correct answer.
- Musical answer labels stay language-neutral where appropriate: note names remain Anglo note names, and compact chord/arpeggio labels stay symbol-based like `C`, `Cm`, `Cdim`, `Caug`.

## Audio Rules
- Piano playback must stay sample-based.
- Sample assets should only be loaded from `public/audio/piano/` unless the audio library is intentionally replaced.
- Sample coverage must continue to support `C4-B5` after any sample-map change.
- Audio initialization must stay behind a user gesture to avoid autoplay failures.
- Replay must reuse the current question payload instead of generating a new one.

## Current Implementation Snapshot
- `src/app/App.tsx` preloads piano assets on boot, lets the user pick a mode, restores per-mode difficulty and language from local storage, exposes an `EN/VI` switcher on home and game screens, and auto-adjusts level progression during play.
- `src/app/analytics.ts` injects Google Analytics 4 only when `VITE_GA_MEASUREMENT_ID` is present and tracks page views plus core quiz interactions.
- Session stats track answered count, correct count, current streak, and best streak.
- `src/features/audio/audioEngine.ts` caches the current question for replay and uses layered `Tone.Sampler` instances mapped from local piano samples.
- `src/features/question-bank/questionFactory.ts` supports deterministic generation by `mode + difficulty` with an optional seed and bound language, including harmonic chord questions.
- `.github/workflows/ci.yml` runs lint, tests, production builds, deploy-script syntax checks, `docker compose config`, image builds, and default Caddy validation on pushes and pull requests.
- `.github/workflows/deploy-production.yml` deploys successful `main` builds to a VPS by shipping the repo context over SSH, bootstrapping Docker if needed, and serving the app via Docker + Caddy.
- `deploy/Caddyfile` is a checked-in local/default HTTP reverse-proxy config, while `deploy/Caddyfile.template` is rendered with the production domain on the VPS before rollout.
- `scripts/deploy/bootstrap-github-secrets.sh` reads deploy inputs from a repo-root `.env.deploy` file by default and can bootstrap from either an existing SSH key or a one-time VPS password by generating and installing a dedicated deploy key automatically.
- `compose.yml` runs the public Caddy container in host-network mode and proxies to `127.0.0.1:8080`, which avoids broken ACME DNS resolution from the Docker bridge on the production VPS.
- `scripts/deploy/bootstrap-github-secrets.sh` pushes deployment secrets to GitHub from the local machine via `gh secret set`.

## Working Commands
- `bun run dev`
- `bun run lint`
- `bun run test:run`
- `bun run build`
- `bash scripts/deploy/bootstrap-github-secrets.sh --help`

## Source Of Truth
- Durable facts belong in this file.
- Short-lived implementation status belongs in `docs/current-context.md`.
