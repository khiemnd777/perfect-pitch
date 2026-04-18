# Current Context

Last updated: 2026-04-18

## Implemented
- `index.html` now includes production SEO/social metadata: descriptive page title, meta description, canonical URL, robots, Open Graph, and Twitter summary tags for `https://andy.dailyturning.com/`.
- Boot flow preloads all piano assets before the main game UI is shown.
- The app now supports bilingual `en` / `vi` copy across shell UI, generated prompts/helper text, choice meta, and progression notices.
- Both the boot screen and the main app shell now render the same footer signature in both languages: `For Son. By Father`, with a GitHub link under the slogan pointing to the current repository.
- English is the default language, and the selected language is persisted separately from gameplay progress in local storage.
- A header-level `EN/VI` language switcher is available on the boot screen, home screen, and in-game screen.
- The app supports 6 training modes: `single`, `double`, `melody`, `interval`, `arpeggio`, and `chord`.
- Playback is generated from question payloads and routed through the `AudioEngine`.
- Answering a choice is graded immediately through `evaluateSelection`.
- Moving to the next question resets evaluation state and regenerates a question for the active mode.
- Replay behavior is implemented in the audio engine by replaying the cached `currentQuestion`.
- Every mode now runs on fixed `easy` / `medium` / `hard` levels with automatic progression: level-up is based on accumulated correct answers at the current level, while level-down still reacts to two wrong answers in a row.
- Per-mode difficulty progress is persisted in local storage and restored when the player returns.
- CI now runs on GitHub Actions for pushes and pull requests, covering `bun install --frozen-lockfile`, lint, tests, production build, deploy script syntax, `docker compose config`, production image build, and default Caddy validation.
- Production deploy now runs through a GitHub Actions workflow triggered by successful CI on `main`, shipping the repo context to the VPS and bootstrapping Docker + Caddy remotely.
- Local deploy setup is now driven by `scripts/deploy/bootstrap-github-secrets.sh`, which reads `.env.deploy`, prepares the deploy key if needed, and uploads repository secrets through `gh`.
- `deploy/Caddyfile` now exists as the default local/runtime config so Docker Compose can be validated locally without depending on a generated file.
- The local deploy bootstrap now supports password-only VPS access by generating a dedicated deploy SSH key, installing it on the server, and then storing that key in GitHub secrets for future zero-touch deploys.
- The production VPS for `andy.dailyturning.com` is now reachable over the generated deploy key, and the app has been deployed live once successfully.
- Caddy now runs with host networking and proxies to `127.0.0.1:8080` because ACME DNS resolution failed from the Docker bridge on this VPS while host-networked Caddy succeeded.

## Important Files
- `src/app/App.tsx`: main flow, mode selection, playback actions, grading state, and session stats.
- `src/app/languagePreference.ts`: local-storage load/save helpers for selected language.
- `src/features/audio/audioEngine.ts`: Tone startup, sample preload, playback scheduling, replay, and cleanup.
- `src/features/audio/pianoSamples.ts`: local piano sample mapping and velocity layers.
- `src/features/question-bank/questionFactory.ts`: question generation rules for all 6 modes across all difficulty levels.
- `src/features/game/evaluation.ts`: answer grading logic.
- `src/features/game/progression.ts`: difficulty streak rules and local-storage persistence helpers.
- `src/shared/gameTypes.ts`: shared domain types used across the app.
- `src/shared/localization.ts`: shared English/Vietnamese copy, label formatters, and progression text helpers.
- `.github/workflows/ci.yml`: validation workflow for pushes and pull requests.
- `.github/workflows/deploy-production.yml`: production deploy workflow for `main`.
- `deploy/Caddyfile`: checked-in default Caddy config for local validation and container startup.
- `scripts/deploy/remote-bootstrap.sh`: idempotent VPS bootstrap and deploy entrypoint.

## Known Gaps
- There is no persisted agent memory workflow in the codebase beyond `AGENTS.md`. This file and `memory.md` are now the canonical lightweight memory layer.
- Manual verification for first-play audio, replay, next-question reset, footer placement, and live EN/VI switching in all 6 modes still needs to be rerun after this UX/content change.
- The production deploy path still depends on working GitHub repository secrets; live VPS reachability, Docker bootstrap, and HTTPS issuance have now been verified against real infrastructure.

## Recommended Next Focus
- If touching deploy infra, verify first live deploy against a real VPS and domain before relying on automatic production releases.
- If touching UX, verify mode switching, replay, next-question reset, progression messaging, and live EN/VI switching in all 6 modes.
- If touching audio, verify first user gesture still unlocks playback and sample coverage remains correct across `C4-B5`.

## Update Rule
- Refresh this file when behavior changes, new risks are discovered, or the next best follow-up task becomes clearer.
- Do not duplicate stable architecture rules here; move those into `memory.md`.
