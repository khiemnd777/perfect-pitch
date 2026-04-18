---
name: perfect-pitch-audio
description: Use when modifying Perfect Pitch audio playback, Tone.js integration, piano sample loading, replay behavior, or browser audio initialization constraints.
---

# Perfect Pitch Audio

## Scope
- Use this skill for `tone` setup, sample maps, playback scheduling, and browser audio restrictions in this repo.

## Source Of Truth
- Piano assets live in `public/audio/piano/`.
- The sample map and velocity layers live in `src/features/audio/pianoSamples.ts`.
- The runtime engine lives in `src/features/audio/audioEngine.ts`.

## Rules
- Keep playback sample-based; do not replace piano audio with a synth unless the task explicitly changes product direction.
- Initialize audio only after a user gesture.
- Replay must use the current `Question` object, not create a new one.
- If sample coverage changes, verify all note classes in the `C4-B5` range still resolve.

## Validation
- Check first-play behavior in the browser.
- Check replay after an answered question.
- Check that failed audio initialization surfaces a user-visible error instead of failing silently.
