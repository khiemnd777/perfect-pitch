---
name: perfect-pitch-frontend
description: Use when working on the Perfect Pitch React frontend, including Vite+Bun setup, feature structure, UI states, responsive layout, and immediate-answer quiz flows.
---

# Perfect Pitch Frontend

## Scope
- Use this skill for UI, app state, routing-free screen flow, test wiring, and frontend architecture in this repo.

## Workflow
1. Keep app-level composition in `src/app`.
2. Keep reusable domain types in `src/shared`.
3. Put game logic under `src/features/game` and question generation under `src/features/question-bank`.
4. Preserve the product contract: 6 modes, 4 fixed choices, instant grading, next-question reset.

## UI Rules
- Default language is Vietnamese.
- Preserve the current visual direction: warm piano-bar palette, serif headline, compact control surface.
- Mobile must remain usable without horizontal scrolling.
- Do not hide the correct answer after submission.

## Testing
- Add or update component tests when changing answer flow, replay flow, or question reset behavior.
- Favor deterministic seeds or stub factories over brittle random assertions.
