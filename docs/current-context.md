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

## Important Files
- `src/app/App.tsx`: main flow, mode selection, playback actions, grading state, and session stats.
- `src/features/audio/audioEngine.ts`: Tone startup, sample preload, playback scheduling, replay, and cleanup.
- `src/features/audio/pianoSamples.ts`: local piano sample mapping and velocity layers.
- `src/features/question-bank/questionFactory.ts`: question generation rules for all 5 modes across all difficulty levels.
- `src/features/game/evaluation.ts`: answer grading logic.
- `src/features/game/progression.ts`: difficulty streak rules and local-storage persistence helpers.
- `src/shared/gameTypes.ts`: shared domain types used across the app.

## Known Gaps
- `README.md` was previously still the default Vite template and did not describe the actual product. This is now fixed and should stay product-specific.
- There is no persisted agent memory workflow in the codebase beyond `AGENTS.md`. This file and `memory.md` are now the canonical lightweight memory layer.
- Manual verification for first-play audio and all 5 per-mode flows still needs to be rerun after any audio or gameplay change.

## Recommended Next Focus
- If touching UX, verify mode switching, replay, next-question reset, and progression messaging in all 5 modes.
- If touching audio, verify first user gesture still unlocks playback and sample coverage remains correct across `C4-B5`.
- If touching content generation, keep distractors unique, preserve the 4-choice invariant, and confirm new interval/arpeggio labels stay musically clear in Vietnamese.

## Update Rule
- Refresh this file when behavior changes, new risks are discovered, or the next best follow-up task becomes clearer.
- Do not duplicate stable architecture rules here; move those into `memory.md`.
