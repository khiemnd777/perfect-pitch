---
name: perfect-pitch-ci-cd
description: Use when changing Perfect Pitch CI, GitHub Actions workflows, Docker or Caddy deploy files, VPS bootstrap scripts, or local GitHub secret bootstrap for production deployment.
---

# Perfect Pitch CI/CD

## Scope
- Use this skill for GitHub Actions validation and deploy workflows, Docker runtime files, Caddy config, VPS bootstrap logic, and local deploy-secret setup in this repo.

## Source Of Truth
- CI workflow: `.github/workflows/ci.yml`
- Production deploy workflow: `.github/workflows/deploy-production.yml`
- Runtime stack: `Dockerfile`, `compose.yml`, `deploy/Caddyfile.template`, `deploy/nginx.conf`
- Local secret bootstrap: `scripts/deploy/bootstrap-github-secrets.sh`
- Remote VPS bootstrap: `scripts/deploy/remote-bootstrap.sh`

## Deployment Contract
- `main` is the production branch.
- CI must pass before production deploy is allowed to run.
- Production deploy ships repo context over SSH to the VPS and boots the app with `docker compose`.
- The VPS is expected to be reachable by SSH and may start without Docker installed.
- Public traffic is terminated by Caddy with automatic HTTPS for the configured domain.
- Secrets stay out of git; GitHub repository secrets are the runtime source of deploy credentials and host config.

## Rules
- Keep the deploy flow idempotent; re-running the same workflow must converge safely on the target VPS.
- Preserve zero-touch VPS setup: do not introduce steps that require manual login or package installation on the server.
- Keep deploy scripts non-interactive.
- Fail fast when required secrets or deploy inputs are missing.
- If runtime ports, domain routing, or health checks change, update both the workflows and the remote bootstrap logic together.
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
- DNS A record setup is an external prerequisite and must point the production domain to the VPS IP before first live deploy.
- The local setup path for secrets should stay scriptable through `gh secret set`; do not move this flow into manual GitHub UI steps unless the task explicitly changes operating procedure.
