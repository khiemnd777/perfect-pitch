---
name: perfect-pitch-content
description: Use when changing Perfect Pitch note naming, distractor generation, difficulty defaults, or the questionFactory logic for single-note, double-note, and melody rounds.
---

# Perfect Pitch Content

## Scope
- Use this skill for anything that changes ear-training content or answer semantics.

## Generator Rules
- Always generate exactly 4 unique choices.
- Always generate exactly 1 correct choice.
- `single`: identify pitch class only.
- `double`: keep pair labels sorted so equivalent answers do not compete.
- `melody`: distractors must match the same sequence length as the correct answer.

## Naming
- Use Anglo note names: `C, C#, D, D#, E, F, F#, G, G#, A, A#, B`.
- Keep UI-facing labels concise; extra explanation belongs in `meta` text, not the primary label.

## Testing
- Update generator tests for shape, uniqueness, and correct-answer guarantees.
- Prefer seeded generation for deterministic assertions.
