# Perfect Pitch

Perfect Pitch is a fully client-side ear-training web app built for practicing single notes, double notes, short melodies, intervals, arpeggios, triads, scales, and seventh chords with local piano samples.

Live site: [https://andy.knasoftware.com](https://andy.knasoftware.com)

## Product Goal

- Grade answers immediately and reveal the correct choice as soon as the player selects one.
- Preserve a natural musical character by using sampled piano audio instead of a synth.
- Keep the experience fast and browser-based, with no backend required.

## Current Features

- 8 training modes: `single`, `double`, `melody`, `interval`, `arpeggio`, `chord`, `scale`, `seventh`.
- 5 fixed difficulty levels: `easy`, `medium`, `hard`, `expert`, `master`.
- Automatic difficulty progression up or down based on correct and incorrect streaks.
- Per-mode progress persisted in local storage.
- Replay always reuses the current question payload instead of generating a new one.
- Deterministic question generation patterns, with optional seeds for testing when needed.
- Crawlable English and Vietnamese learning pages for high-intent ear-training topics, with direct links into the matching practice mode.

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
bun run seo:generate
```

`bun run build` compiles the app and then generates the crawlable route HTML, `404.html`, and `sitemap.xml` from `src/seo/seoContent.ts`. `seo:generate` is useful only when regenerating those artifacts inside an existing `dist` directory.

## Project Structure

- `src/app`: app shell, mode flow, preload logic, grading state, and session stats.
- `src/features/audio`: Tone startup, sample preload, playback, replay, and cleanup.
- `src/features/game`: grading logic and streak-based progression.
- `src/features/question-bank`: question generation for all 8 modes across 5 difficulty levels.
- `src/shared`: public types, music helpers, and random utilities.
- `src/seo`: the canonical SEO route/content/metadata manifest.
- `scripts/generate-seo.ts`: static SEO route, 404, and sitemap generation.
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
- replay behavior in all 8 modes
- immediate grading
- next-question reset

## Internal Docs

- `AGENTS.md`: workflow rules for agents operating in this repo.
- `memory.md`: durable project context.
- `docs/current-context.md`: current implementation state and next focus areas.

## CI/CD And Production Deployment

GitHub Actions validates every push and pull request. The active production site is deployed to Firebase Hosting project `perfect-pitch-knasoftware`; `andy.dailyturning.com` and its automatic VPS workflow are retired.

### What is included

- `.github/workflows/ci.yml`: runs lint, tests, and production build on pull requests and pushes.
- `.firebaserc` and `firebase.json`: bind and configure the active Firebase Hosting project.
- `Dockerfile`: multi-stage image build for the static Vite app.
- `compose.yml`, Caddy files, and VPS scripts: optional packaging/reference tooling; they are not active production deployment.

### Firebase production release

```bash
bun run lint
bun run test:run
bun run build
firebase deploy --only hosting --project perfect-pitch-knasoftware
```

The public GA4 Measurement ID is stored in `.env.production`, so every production build—including the reference Docker image—enables analytics consistently. Override `VITE_GA_MEASUREMENT_ID` in the build environment only when intentionally targeting another GA4 web stream. After deployment, verify both `https://andy.knasoftware.com` and the Firebase fallback domain.

## SEO Release Checklist

After deploying a production build:

- confirm `/ear-training` and `/vi/luyen-cam-am` return unique HTML with HTTP 200
- confirm a random invalid URL returns HTTP 404 and `noindex, follow`
- submit `https://andy.knasoftware.com/sitemap.xml` in Google Search Console
- request indexing for the homepage, `/ear-training`, `/perfect-pitch-training`, and `/vi/luyen-cam-am`
- verify the GA4 Realtime/DebugView events `seo_practice_landing`, `seo_cta_click`, `first_answer`, `answer_5`, and `answer_10`
