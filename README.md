# Perfect Pitch

Perfect Pitch is a fully client-side ear-training web app built for practicing single notes, double notes, short melodies, intervals, arpeggios, and chords with local piano samples.

Live site: [https://andy.dailyturning.com](https://andy.dailyturning.com)

## Product Goal

- Grade answers immediately and reveal the correct choice as soon as the player selects one.
- Preserve a natural musical character by using sampled piano audio instead of a synth.
- Keep the experience fast and browser-based, with no backend required.

## Current Features

- 6 training modes: `single`, `double`, `melody`, `interval`, `arpeggio`, `chord`.
- 3 fixed difficulty levels: `easy`, `medium`, `hard`.
- Automatic difficulty progression up or down based on correct and incorrect streaks.
- Per-mode progress persisted in local storage.
- Replay always reuses the current question payload instead of generating a new one.
- Deterministic question generation patterns, with optional seeds for testing when needed.

## Tech Stack

- `Bun`
- `Vite`
- `React 19`
- `TypeScript`
- `Tone.js`
- `Vitest`
- `ESLint`

## Install And Run

```bash
bun install
bun run dev
```

The app runs on the Vite dev server by default. Audio is only unlocked after the first user gesture to avoid browser autoplay restrictions.

## Scripts

```bash
bun run dev
bun run lint
bun run test:run
bun run build
```

## Project Structure

- `src/app`: app shell, mode flow, preload logic, grading state, and session stats.
- `src/features/audio`: Tone startup, sample preload, playback, replay, and cleanup.
- `src/features/game`: grading logic and streak-based progression.
- `src/features/question-bank`: question generation for all 6 modes across 3 difficulty levels.
- `src/shared`: public types, music helpers, and random utilities.
- `public/audio/piano`: piano samples used for playback.

## Domain Rules

- `single`: answers identify pitch class only, not octave.
- `double`: choices must stay unambiguous and note-pair labels must be sorted.
- `melody`: distractors must match playback length and avoid visual duplication.
- Every question must contain exactly 4 unique choices and exactly 1 correct answer.
- Any sample-map change must preserve sample coverage across the `C4-B5` range.

## Verification Before Publishing

```bash
bun run lint
bun run test:run
bun run build
bash -n scripts/deploy/bootstrap-github-secrets.sh scripts/deploy/remote-bootstrap.sh
docker compose config
docker build -t perfect-pitch-ci-local .
```

Manual verification is also recommended for:

- first-play audio after the first user gesture
- replay behavior in all 6 modes
- immediate grading
- next-question reset

## Internal Docs

- `AGENTS.md`: workflow rules for agents operating in this repo.
- `memory.md`: durable project context.
- `docs/current-context.md`: current implementation state and next focus areas.

## CI/CD And VPS Deployment

This repo now includes GitHub Actions workflows for CI and production deploys, plus a zero-touch VPS bootstrap flow using Docker and Caddy.

### What is included

- `.github/workflows/ci.yml`: runs lint, tests, and production build on pull requests and pushes.
- `.github/workflows/deploy-production.yml`: deploys automatically after CI succeeds on `main`.
- `Dockerfile`: multi-stage image build for the static Vite app.
- `compose.yml`: production stack with the app container and a public Caddy reverse proxy.
- `deploy/Caddyfile`: checked-in default Caddy config for local Docker validation and startup.
- `scripts/deploy/remote-bootstrap.sh`: idempotent VPS bootstrap for Docker and Compose.
- `scripts/deploy/bootstrap-github-secrets.sh`: local helper to base64-encode the SSH key and push deploy secrets to GitHub.

### Required GitHub secrets

- `VPS_HOST`
- `VPS_PORT` default `22`
- `VPS_USER` default `root`
- `VPS_SSH_PRIVATE_KEY_B64`
- `DEPLOY_DOMAIN`
- `DEPLOY_APP_DIR` default `/opt/perfect-pitch`
- `ACME_EMAIL` optional

### Local setup for first deploy

Create `.env.deploy` in the repo root from [deploy/bootstrap.env.example](/Users/khiemnguyen/Works/andy/pp/deploy/bootstrap.env.example:1), then run the helper script from your local machine after `gh auth login`:

```bash
cp deploy/bootstrap.env.example .env.deploy
bash scripts/deploy/bootstrap-github-secrets.sh
```

If you want the whole flow to be one shell command with no separate `gh auth login`, set `GH_TOKEN` in `.env.deploy`. The script will authenticate `gh` automatically before uploading secrets.

If you only have the VPS password, set `VPS_PASSWORD` in `.env.deploy` and leave `SSH_KEY_PATH` commented out. The helper will generate a dedicated deploy key, install it on the server, and then upload the GitHub secrets.

Before the first production deploy succeeds, point the domain A record to the VPS IP.
