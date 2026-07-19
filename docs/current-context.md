# Current Context

Last updated: 2026-07-19

## Implemented
- Pet purchases now open an accessible bilingual confirmation dialog before spending any music notes. The dialog shows the selected pet, price, and post-purchase wallet balance; Cancel and `Escape` leave the wallet unchanged, while Buy now completes the existing purchase flow. Desktop and 390px browser QA confirmed focus starts on the safe Cancel action, the mobile dialog stays within the viewport without horizontal overflow, successful purchases update ownership and wallet state, and no console errors are emitted.
- Companion sprites now prioritize full-pet visibility: square-card stage scales were recalibrated, sprite/body paint clipping was removed, and active raster frames may render beyond their logical box instead of cutting off ears, wings, crowns, or animation poses. Tap reactions render as a top-layer absolute speech bubble above and clear of the pet, with a downward pointer aimed at the portrait; it paints above the wallet/shop row without intercepting pointer input. The pet and its copy stay at their original, unshifted baselines while the bubble toggles independently, so their relative positions and the companion card dimensions do not change. Home, mobile, and compact game cards passed 1440px/390px browser QA with stable before/after dimensions, no overflow, and no console issues.
- The `Your Music Buddy` card now uses a compact companion-dashboard layout: wallet and shop actions share a clear top action row, the active pet sits in a dedicated visual spotlight, and evolution progress plus the five-stage journey live in one grouped growth panel. The same hierarchy adapts to the compact in-game card, keeps EN/VI copy readable, and passed browser QA at 1440px and 390px with no horizontal overflow or console issues.
- The compact in-game companion card uses localized short wallet labels (`Wallet` / `Ví nhạc`) in a deliberate two-row wallet control, with the note balance below the label, so narrow sidebars never truncate it; the full wallet name remains in the accessible label and on the roomier home card.
- A bilingual pet egg shop is available from the companion card on both home and quiz screens. The collection includes the original Music Dino; seven standard shop pets priced from 100 to 1,250 notes; four visibly badged legendary pets priced from 2,000 to 6,500; Bella at 10,000 notes; Little Bella Monster at 12,500 notes; Andy Monster at 15,000 notes; Dory Monster at 17,500 notes; and Alvin Monster at 20,000 notes with the distinct Monster badge above Legendary rarity. Bella uses the shorter display name while retaining Monster rarity.
- All sixteen shop pets have complete five-stage, four-pose raster sprite sets matching the dinosaur art direction. The 320 shop-pet runtime frames are transparent 512×512 PNGs under `public/pets/<pet-id>/frames-v1/`; Bella, Little Bella, Andy, Dory, and Alvin are grounded in supplied real-world reference photos and keep their defining mouthless faces. Andy's hatched stages use exactly six orange pom-poms—two ears, two feet, and two on the green hat—with no arms or extra body poms. Dory's hatched stages keep one pale-gray fuzzy body, mint cat ears, giant aqua eyes, exactly two mint cord legs, and exactly two glossy peach-pink boots. Alvin's hatched stages keep one muted-seafoam fuzzy body, rounded emerald ears, aqua eyes, exactly two pale-mint cord legs, and exactly two glossy forest-green shoes. Dory and Alvin exclude keyring hardware, arms, and tails. The shared React animation registry gives every species the same paced stage timelines, reduced-motion behavior, and adult raster previews in the shop.
- Pet-shop cards always show the first `adult` sprite for every catalog pet, including unowned pets, so children can preview the grown appearance. Ownership, price, current-stage labels, and active-companion progression remain unchanged.
- Every correct answer adds 10 spendable notes to the shop wallet and 10 separate growth points to the selected pet. Purchases deduct only wallet notes, never evolution progress; every pet persists its own five-stage `0 / 50 / 200 / 500 / 900` journey, and a purchased egg becomes the active companion immediately.
- Existing dinosaur saves migrate without losing progress: legacy points seed both dinosaur growth and the initial shop balance when no collection save exists, while the legacy key stays synchronized for compatibility.
- The shop dialog is keyboard-dismissible, locks background scrolling, and renders through a body portal so it remains fixed after page scrolling. Browser QA passed at 1280px and 390px with no horizontal overflow, confirmed access from home and quiz screens, and found no console errors.
- Firebase project `perfect-pitch-knasoftware` now hosts the production Vite build on the Spark plan. `firebase.json` serves `dist` and rewrites client-side routes to `index.html`; `.firebaserc` binds the repo to the dedicated project.
- Production canonical, Open Graph, structured-data, robots, sitemap, and runtime SEO URLs now target `https://andy.knasoftware.com/`.
- Firebase Hosting custom domain `andy.knasoftware.com` is active with HTTPS. The custom domain and `perfect-pitch-knasoftware.web.app` serve the same current Firebase release.
- Ear-training content now spans 8 modes and 5 levels. New `scale` rounds cover major/minor through modal, whole-tone, and blues colors; new `seventh` rounds cover four-note seventh qualities and inversions.
- `expert` and `master` extend every existing mode with shorter or denser playback, closer distractors, 6-7 note melodies with repeats, all chromatic intervals, and compound intervals through a perfect twelfth.
- The expanded seeded question bank has automated coverage across every `mode × difficulty` combination, including exactly 4 unique choices, exactly 1 correct answer, playback inside `C4-B5`, advanced close melody distractors, and broad answer variety.
- Runtime browser QA confirmed the 8-card mode grid at desktop and 390px without horizontal overflow, sample-based first play and replay for both new modes, immediate Scale grading/reset, live EN/VI seventh-chord copy, and no browser console errors.
- All five dinosaur stages now use real four-pose raster animation: the egg progressively cracks, the baby blinks and waves, the young dinosaur dances with its note, the adult breathes and flutters its scarf, and the super dinosaur blinks, powers up, and moves its cape. Stage-specific timelines replace the old low-rate fixed interval, use short movement beats plus longer expression holds, and crossfade poses over 160ms so the browser renders motion smoothly instead of showing a four-image slideshow. Per-frame alignment metadata normalizes subject scale, center, and baseline; the React player pauses in hidden tabs and respects reduced-motion preferences.
- Tapping the current dinosaur is keyboard-accessible and cycles through localized, stage-specific emoji reactions and speech bubbles; hungry pets use their own reaction set.
- Dinosaur care state now persists separately from evolution points. After 30 minutes without a correct answer the pet becomes hungry; the next valid interaction can trigger one child-friendly rawr, with a 5-minute cooldown until another roar is allowed. Any correct answer feeds the pet immediately without spending accumulated evolution points.
- The rawr SFX is generated by a lazily imported Tone.js voice in `src/features/audio/dinoVoice.ts`, stays behind browser user-gesture rules, and surfaces a visible retry message if audio startup fails. Runtime QA confirmed all five CSS animations, successful rawr startup, reaction bubbles, and 390px no-overflow behavior.
- The main practice UI has been redesigned for children with a brighter pastel palette, larger rounded controls, playful mode icons, clear button depth, responsive single-column mobile layouts, and visible keyboard focus states.
- A persistent dinosaur-raising game now awards 10 music notes per correct answer and evolves through five stages at 0, 50, 200, 500, and 900 points: egg, baby, young, cute adult, and cute super dinosaur. Egg-to-baby remains quick, while every later stage takes progressively longer.
- The dinosaur companion is visible on both the mode picker and quiz screen, shows current points, the next evolution target, a five-step journey, localized EN/VI stage copy, and a celebration animation after correct answers. Session-score reset intentionally leaves pet progress intact.
- The five consistent dinosaur stages use 20 locally hosted transparent PNGs under `public/dino/frames-v1/`. The original `public/dino/evolution-sprite.png` remains as the visual identity reference but is no longer used by the runtime renderer.
- Dinosaur progression has unit coverage plus app-level coverage for point awards, persistence, and the egg-to-baby threshold. Responsive visual QA passed at 1440px and 390px with no horizontal overflow.
- Khi bấm `Play`/`Replay`, nút phát sẽ bị disable trong toàn bộ thời gian audio của câu hỏi đang chạy và tự bật lại khi phát xong, để tránh spam click chồng lệnh phát.
- Sau khi chọn đáp án, UI tự cuộn mượt tới khối feedback kết quả để người chơi thấy ngay đúng/sai và đáp án đúng mà không cần cuộn tay trên màn hình dài/mobile.
- Session stats now persist in local storage across page refreshes, using the existing app storage pattern; the in-game stats card also includes a reset button that clears the persisted score back to zero without affecting mode progression.
- Google Analytics 4 can now be enabled by setting `VITE_GA_MEASUREMENT_ID` in deploy secrets; the app emits page views plus events for mode selection, play/replay, answers, next-question, return-home, and audio errors, and the production deploy now forwards that env var into the Docker build on the VPS.
- `index.html` now includes English-first production SEO/social metadata for `https://andy.knasoftware.com/`: descriptive page title, meta description, canonical URL, robots, Open Graph, Twitter summary tags, WebApplication JSON-LD structured data, and a no-JavaScript crawlable fallback summary.
- `public/robots.txt` allows crawlers and points to `https://andy.knasoftware.com/sitemap.xml`; `public/sitemap.xml` lists the canonical production homepage plus 6 SEO content routes.
- The app now renders English-first SEO content pages for `/ear-training`, `/perfect-pitch-training`, `/interval-ear-training`, `/chord-ear-training`, `/piano-ear-training`, and `/what-is-perfect-pitch`, with crawlable headings, explanatory text, FAQ content, and internal `<a href>` links.
- The home screen renders immediately without a piano preload gate; `Tone.js` and the piano audio engine are lazy-loaded only after the first Play click, reducing the initial production JS bundle from about 455 KB to about 223 KB and moving audio runtime code into a separate chunk.
- The app now supports bilingual `en` / `vi` copy across shell UI, generated prompts/helper text, choice meta, and progression notices.
- The main app shell renders the footer signature in both languages: `For Son. By Father`, with a GitHub link under the slogan pointing to the current repository.
- English is the default language, and the selected language is persisted separately from gameplay progress in local storage.
- A header-level `EN/VI` language switcher is available on the home screen and in-game screen.
- The app supports 8 training modes: `single`, `double`, `melody`, `interval`, `arpeggio`, `chord`, `scale`, and `seventh`.
- Playback is generated from question payloads and routed through the `AudioEngine`.
- Answering a choice is graded immediately through `evaluateSelection`.
- Moving to the next question resets evaluation state and regenerates a question for the active mode.
- Replay behavior is implemented in the audio engine by replaying the cached `currentQuestion`.
- Every mode runs on fixed `easy` / `medium` / `hard` / `expert` / `master` levels with automatic progression: level-up is based on accumulated correct answers at the current level, while level-down reacts to two wrong answers in a row.
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
- `src/features/question-bank/questionFactory.ts`: question generation rules for all 8 modes across all 5 difficulty levels.
- `src/features/game/evaluation.ts`: answer grading logic.
- `src/features/game/progression.ts`: difficulty streak rules and local-storage persistence helpers.
- `src/features/game/dinoProgress.ts`: fixed evolution stages, progress calculation, and legacy dinosaur persistence.
- `src/features/game/petCollection.ts`: persistent wallet, owned/selected pets, per-pet growth, prices, purchases, rewards, and legacy migration.
- `src/features/game/petAnimation.ts`: shared four-pose animation registry and runtime frame paths for every pet species and stage.
- `src/features/pet-shop/PetCompanion.tsx`: active companion card and shared egg-to-super raster animation renderer for every pet.
- `src/features/pet-shop/PetShop.tsx`: responsive bilingual catalog dialog, purchase actions, and pet selection.
- `src/features/game/dinoCare.ts`: persistent feeding timestamps, hunger threshold, and roar cooldown.
- `src/features/audio/dinoVoice.ts`: lazy Tone.js child-friendly dinosaur rawr SFX.
- `public/dino/evolution-sprite.png`: original five-stage visual identity reference retained for future art work.
- `public/dino/frames-v1/`: four transparent raster animation frames for each dinosaur stage.
- `public/pets/<pet-id>/frames-v1/`: four transparent raster animation frames for every stage of all sixteen shop pets.
- `src/shared/gameTypes.ts`: shared domain types used across the app.
- `src/shared/localization.ts`: shared English/Vietnamese copy, label formatters, and progression text helpers.
- `.github/workflows/ci.yml`: validation workflow for pushes and pull requests.
- `.github/workflows/deploy-production.yml`: production deploy workflow for `main`.
- `deploy/Caddyfile`: checked-in default Caddy config for local validation and container startup.
- `scripts/deploy/remote-bootstrap.sh`: idempotent VPS bootstrap and deploy entrypoint.

## Known Gaps
- All sixteen shop pets now match the dinosaur's raster animation depth, but they still reuse the dinosaur's generic interaction sound behavior; species-specific sounds remain a future audio enhancement.
- There is no persisted agent memory workflow in the codebase beyond `AGENTS.md`. This file and `memory.md` are now the canonical lightweight memory layer.
- Full perceptual audio verification with speakers still needs to be repeated in all 8 modes, including checking rawr volume against piano playback; automated flows and headless browser audio startup pass.
- The production deploy path still depends on working GitHub repository secrets; live VPS reachability, Docker bootstrap, and HTTPS issuance have now been verified against real infrastructure.

## Recommended Next Focus
- If touching deploy infra, verify first live deploy against a real VPS and domain before relying on automatic production releases.
- If touching UX, verify mode switching, replay, next-question reset, progression messaging, score persistence/reset, and live EN/VI switching in all 8 modes.
- If touching audio, verify first user gesture still unlocks playback and sample coverage remains correct across `C4-B5`.

## Update Rule
- Refresh this file when behavior changes, new risks are discovered, or the next best follow-up task becomes clearer.
- Do not duplicate stable architecture rules here; move those into `memory.md`.
