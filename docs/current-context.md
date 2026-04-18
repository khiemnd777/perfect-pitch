# Current Context

Last updated: 2026-04-18

## Implemented
- Boot flow preloads all piano assets before the main game UI is shown.
- The app supports 5 training modes: `single`, `double`, `melody`, `interval`, and `arpeggio`.
- Playback is generated from question payloads and routed through the `AudioEngine`.
- Answering a choice is graded immediately through `evaluateSelection`.
- Moving to the next question resets evaluation state and regenerates a question for the active mode.
- Replay behavior is implemented in the audio engine by replaying the cached `currentQuestion`.
- Every mode now runs on fixed `easy` / `medium` / `hard` levels with automatic up/down progression based on two-answer streaks.
- Per-mode difficulty progress is persisted in local storage and restored when the player returns.
- CI now runs on GitHub Actions for pushes and pull requests, covering `bun install --frozen-lockfile`, lint, tests, and production build.
- Production deploy now runs through a GitHub Actions workflow triggered by successful CI on `main`, shipping the repo context to the VPS and bootstrapping Docker + Caddy remotely.
- Local deploy setup is now driven by `scripts/deploy/bootstrap-github-secrets.sh`, which prepares and uploads repository secrets through `gh`.

## Important Files
- `src/app/App.tsx`: main flow, mode selection, playback actions, grading state, and session stats.
- `src/features/audio/audioEngine.ts`: Tone startup, sample preload, playback scheduling, replay, and cleanup.
- `src/features/audio/pianoSamples.ts`: local piano sample mapping and velocity layers.
- `src/features/question-bank/questionFactory.ts`: question generation rules for all 5 modes across all difficulty levels.
- `src/features/game/evaluation.ts`: answer grading logic.
- `src/features/game/progression.ts`: difficulty streak rules and local-storage persistence helpers.
- `src/shared/gameTypes.ts`: shared domain types used across the app.
- `.github/workflows/ci.yml`: validation workflow for pushes and pull requests.
- `.github/workflows/deploy-production.yml`: production deploy workflow for `main`.
- `scripts/deploy/remote-bootstrap.sh`: idempotent VPS bootstrap and deploy entrypoint.

## Known Gaps
- There is no persisted agent memory workflow in the codebase beyond `AGENTS.md`. This file and `memory.md` are now the canonical lightweight memory layer.
- Manual verification for first-play audio and all 5 per-mode flows still needs to be rerun after any audio or gameplay change.
- The production deploy path still depends on valid DNS pointing and working GitHub repository secrets; these cannot be verified locally without real infrastructure.

## Recommended Next Focus
- If touching deploy infra, verify first live deploy against a real VPS and domain before relying on automatic production releases.
- If touching UX, verify mode switching, replay, next-question reset, and progression messaging in all 5 modes.
- If touching audio, verify first user gesture still unlocks playback and sample coverage remains correct across `C4-B5`.

## Update Rule
- Refresh this file when behavior changes, new risks are discovered, or the next best follow-up task becomes clearer.
- Do not duplicate stable architecture rules here; move those into `memory.md`.
