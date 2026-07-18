# Project Memory

## Purpose
- Perfect Pitch is a client-side ear-training web app for 8 modes: `single`, `double`, `melody`, `interval`, `arpeggio`, `chord`, `scale`, and `seventh`.
- The product goal is instant feedback: selecting an answer grades immediately and reveals the correct choice.
- The app should sound like a sampled piano rather than a synthesized oscillator.

## Stack
- Runtime and tooling: `Bun`, `Vite`, `React 19`, `TypeScript`, `Vitest`, `ESLint`.
- Audio layer: `tone`.
- Assets: local piano samples under `public/audio/piano/`.
- Deployment: `GitHub Actions`, `Docker`, `Caddy`, and Firebase Hosting (Spark plan).
- Hosted analytics can be enabled with Google Analytics 4 via the optional build-time env var `VITE_GA_MEASUREMENT_ID`.

## Architecture
- App wiring lives in `src/app`.
- Feature logic is split under `src/features/audio`, `src/features/game`, and `src/features/question-bank`.
- Shared public types live in `src/shared/gameTypes.ts`.
- Shared bilingual copy and text resolvers live in `src/shared/localization.ts`, while language persistence helpers live in `src/app/languagePreference.ts`.
- Music helpers and deterministic random utilities live in `src/shared/music.ts` and `src/shared/random.ts`.
- Mode progression and difficulty persistence live in `src/features/game/progression.ts`.
- Shared evolution thresholds plus legacy dinosaur persistence live in `src/features/game/dinoProgress.ts`.
- Pet shop catalog, wallet, ownership, selection, legacy migration, and per-pet growth live in `src/features/game/petCollection.ts`; companion and shop UI live in `src/features/pet-shop`.
- Shared four-pose animation metadata for every pet lives in `src/features/game/petAnimation.ts`; generated shop-pet frames live under `public/pets/<pet-id>/frames-v1/` and follow the existing `egg|baby|young|adult|super-1..4.png` naming convention.
- Dinosaur hunger timestamps and roar cooldown rules live in `src/features/game/dinoCare.ts`; the lazily loaded Tone.js SFX lives in `src/features/audio/dinoVoice.ts`.

## Product Rules
- The app supports both English and Vietnamese UI/content, defaults to English, and persists the selected language in local storage.
- `single` mode answers identify pitch class only, not octave.
- `double` mode choices must remain unambiguous and use sorted note labels.
- `melody` mode choices must match playback length and avoid visually duplicate distractors.
- `chord` mode identifies harmonically stacked triads played together; `arpeggio` remains the broken-chord mode.
- All modes use fixed levels `easy` / `medium` / `hard` / `expert` / `master`; level-up depends on accumulated correct answers at the current level, while level-down reacts to incorrect streaks.
- `scale` answers identify the root and scale quality across major, minor, modal, whole-tone, and blues content as levels increase.
- `seventh` answers identify compact four-note seventh chords; advanced levels add inversions and close same-root distractors.
- Every generated question must contain exactly 4 unique choices with exactly 1 correct answer.
- Every correct answer adds 10 spendable music notes to the shop wallet and 10 non-spendable growth points to the selected pet. Buying an egg never reduces evolution progress; each pet uses the fixed thresholds `0 / 50 / 200 / 500 / 900` for egg, baby, young, adult, and super stages.
- Buying an unowned pet requires an explicit bilingual confirmation that shows the pet, price, and remaining wallet balance before any notes are deducted.
- The collection starts with the dinosaur and offers seven standard pets priced from 100 to 1,250 notes, four Legendary pets priced from 2,000 to 6,500, Bella Monster for 10,000 notes, Little Bella Monster for 12,500 notes, and Andy Monster for 15,000 notes. Monster is a visibly distinct rarity above Legendary. The photo-grounded Monster pets keep mouthless faces: Bella has uninterrupted pink fur below her eyes; Little Bella has gray fur, mint ears, aqua eyes, yellow/pink cheek nubs, and gray pom-pom feet; Andy has one round orange body, glossy black eyes in joined aqua frames, and exactly six orange pom-poms—two ears, two feet, and two on the lime-green hat—with no arms, rays, or extra body poms. Each pet keeps separate growth progress, and a newly purchased pet starts as the selected egg.
- Pet-shop cards always preview the pet's `adult` sprite so children can see its grown appearance before buying; owned-pet stage labels and the active companion still use real per-pet progress.
- Existing `perfect-pitch-dino-progress` points seed both dinosaur growth and the initial shop wallet when no pet-collection save exists. The legacy dinosaur key remains synchronized for backward compatibility.
- A correct answer also feeds the pet. The dinosaur becomes hungry after 30 minutes without a correct answer, may roar once after a valid user gesture, and uses a 5-minute roar cooldown until fed again.
- Musical answer labels stay language-neutral where appropriate: note names remain Anglo note names, and compact chord/arpeggio labels stay symbol-based like `C`, `Cm`, `Cdim`, `Caug`.

## Audio Rules
- Piano playback must stay sample-based.
- Sample assets should only be loaded from `public/audio/piano/` unless the audio library is intentionally replaced.
- Sample coverage must continue to support `C4-B5` after any sample-map change.
- Audio initialization must stay behind a user gesture to avoid autoplay failures.
- Initial page load should not preload Tone.js or piano samples; audio loading belongs behind the first playback gesture to keep Lighthouse Total Blocking Time low.
- Replay must reuse the current question payload instead of generating a new one.
- Dinosaur SFX must remain gesture-safe and lazy-loaded; it must not pull Tone.js into the initial home bundle or change the sample-based piano engine.

## Current Implementation Snapshot
- `src/app/App.tsx` lets the user pick a mode immediately, lazy-loads the audio engine on first playback, restores per-mode difficulty and language from local storage, exposes an `EN/VI` switcher on home and game screens, and auto-adjusts level progression during play.
- `src/app/analytics.ts` injects Google Analytics 4 only when `VITE_GA_MEASUREMENT_ID` is present and tracks page views plus core quiz interactions.
- Session stats track answered count, correct count, current streak, and best streak.
- The child-friendly game shell shows a persistent five-stage companion on the home and quiz screens. Every species and stage uses four generated transparent raster frames: the dinosaur under `public/dino/frames-v1/`, and shop pets under `public/pets/<pet-id>/frames-v1/`.
- The companion card opens a bilingual pet shop from home and quiz screens. Collection state persists under `perfect-pitch-pet-collection`, and the modal renders through a body portal so it stays viewport-fixed on scrolled mobile pages.
- Companion idle motion uses shared stage-specific React timelines over four aligned key poses. Each timeline mixes short movement beats with longer expression holds, while CSS crossfades pose changes at the browser refresh rate; separate CSS motion remains reserved for tap, reward, and hunger feedback. Tapping the pet triggers localized stage-specific reactions, while hunger adds a distinct visual state and child-friendly rawr SFX.
- `src/features/audio/audioEngine.ts` caches the current question for replay and uses layered `Tone.Sampler` instances mapped from local piano samples.
- `src/features/question-bank/questionFactory.ts` supports deterministic generation across all 8 modes and 5 levels with an optional seed and bound language, including scale and seventh-chord questions.
- `.github/workflows/ci.yml` runs lint, tests, production builds, deploy-script syntax checks, `docker compose config`, image builds, and default Caddy validation on pushes and pull requests.
- `.github/workflows/deploy-production.yml` deploys successful `main` builds to a VPS by shipping the repo context over SSH, bootstrapping Docker if needed, and serving the app via Docker + Caddy.
- `deploy/Caddyfile` is a checked-in local/default HTTP reverse-proxy config, while `deploy/Caddyfile.template` is rendered with the production domain on the VPS before rollout.
- Public SEO discovery files live in `public/robots.txt` and `public/sitemap.xml` for the production canonical URL `https://andy.knasoftware.com/`.
- SEO content routes are handled in the React app for `/ear-training`, `/perfect-pitch-training`, `/interval-ear-training`, `/chord-ear-training`, `/piano-ear-training`, and `/what-is-perfect-pitch`; keep these routes listed in `public/sitemap.xml`.
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
