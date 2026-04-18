# Perfect Pitch Agents Guide

## Product Goal
- Build a client-side ear-training web app for single notes, double notes, short melodies, intervals, and arpeggios.
- Preserve instant feedback: answer selection must grade immediately and reveal the correct choice.
- Keep the experience musical rather than synthetic; piano playback should stay sample-based.

## Frontend Conventions
- Stack: `Vite + React + TypeScript + Bun`.
- Organize code by feature under `src/features/*` and keep app wiring in `src/app`.
- Public app types live in `src/shared/gameTypes.ts`; avoid duplicating local variants.
- Prefer deterministic generators for tests by accepting an optional seed.
- UI copy stays Vietnamese unless a task explicitly changes localization scope.

## Audio Rules
- Use `tone` as the Web Audio layer.
- Load piano assets only from `public/audio/piano/` unless a task explicitly replaces the library and updates this file.
- Do not swap sample filenames, velocity layers, or note coverage casually; any sample-map change must verify playback still covers `C4-B5`.
- Keep audio initialization behind a user gesture to avoid browser autoplay failures.
- Replay should always reuse the current question payload rather than regenerating notes.

## Content Rules
- `single` answers identify pitch class only, not octave.
- `double` choices must stay unambiguous and use sorted note labels.
- `melody` choices should match playback length and avoid visually duplicate distractors.
- A question generator must always produce exactly 4 unique choices with exactly 1 correct answer.

## Verification Checklist
- Run `bun run lint`.
- Run `bun run test:run`.
- Run `bun run build`.
- Manually verify first-play audio, replay, immediate grading, and next-question reset in all 5 modes.

## Memory Workflow
- Read `memory.md` before deep repo exploration to load durable project context quickly.
- Read `docs/current-context.md` before changing behavior to understand the latest working state, open issues, and follow-up priorities.
- Update `memory.md` only when stable facts change: architecture, stack, domain rules, commands, file ownership, or decisions expected to matter across many future tasks.
- Update `docs/current-context.md` after meaningful work lands when the current implementation state, known gaps, or next recommended tasks have changed.
- Keep both files concise and factual. Do not dump full chat transcripts, speculative notes, or temporary reasoning.
