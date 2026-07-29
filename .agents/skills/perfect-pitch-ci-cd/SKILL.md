---
name: perfect-pitch-ci-cd
description: Use when changing Perfect Pitch CI, Firebase Hosting deployment, GitHub Actions workflows, Docker or Caddy packaging files, or legacy VPS tooling.
---

# Perfect Pitch CI/CD

## Scope
- Use this skill for GitHub Actions validation, Firebase Hosting releases, Docker runtime files, Caddy config, and retained legacy VPS tooling in this repo.

## Source Of Truth
- CI workflow: `.github/workflows/ci.yml`
- Production hosting config: `.firebaserc`, `firebase.json`
- Runtime stack: `Dockerfile`, `compose.yml`, `deploy/Caddyfile.template`, `deploy/nginx.conf`
- Retained legacy VPS tooling: `scripts/deploy/bootstrap-github-secrets.sh`, `scripts/deploy/remote-bootstrap.sh`

## Deployment Contract
- `main` is the production branch.
- The active production target is Firebase Hosting project `perfect-pitch-knasoftware` on `andy.knasoftware.com`.
- CI must pass before a production Firebase release is made.
- Run `bun run build` before `firebase deploy --only hosting --project perfect-pitch-knasoftware` so generated SEO HTML, sitemap, and 404 artifacts are current.
- Docker, Caddy, and VPS bootstrap files are retained as optional packaging/reference tooling. They must not be wired back to an automatic production workflow unless a new active VPS target is explicitly approved.
- Secrets stay out of git.

## Rules
- Keep Firebase releases idempotent; redeploying the same build and hosting config must converge safely.
- Do not restore the retired `andy.dailyturning.com` deployment workflow.
- If legacy VPS tooling is intentionally reused for a new target, preserve zero-touch setup and keep scripts non-interactive.
- Keep deploy scripts non-interactive.
- Fail fast when required secrets or deploy inputs are missing.
- If optional VPS runtime ports, domain routing, or health checks change, update Docker/Caddy and remote bootstrap logic together.
- If the Docker build changes, verify the production image still serves the Vite app correctly behind Caddy.

## Validation
- Run `bun run lint`.
- Run `bun run test:run`.
- Run `bun run build`.
- Run `bash -n scripts/deploy/bootstrap-github-secrets.sh scripts/deploy/remote-bootstrap.sh`.
- Run `docker compose config`.
- Run `docker build -t perfect-pitch-ci-local .`.
- Validate a rendered Caddy config with `caddy validate` in a container before changing deploy routing behavior.

## Operator Notes
- `andy.dailyturning.com` is retired and must not be treated as a deployment target.
- Verify both `andy.knasoftware.com` and `perfect-pitch-knasoftware.web.app` after a Firebase release.
- The legacy secret bootstrap path should remain scriptable through `gh secret set` if it is ever reused for a newly approved VPS target.
