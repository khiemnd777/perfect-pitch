#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deploy/bootstrap-github-secrets.sh \
    --domain app.example.com \
    --host 203.0.113.10 \
    --ssh-key ~/.ssh/vps_root_ed25519

Options:
  --domain       Production domain pointed to the VPS A record.
  --host         VPS public IP or hostname used by GitHub Actions over SSH.
  --ssh-key      Path to the existing private SSH key for the VPS root user.
  --repo         Optional GitHub repo in owner/name format. Auto-detected by default.
  --port         Optional SSH port. Defaults to 22.
  --user         Optional SSH user. Defaults to root.
  --app-dir      Optional deploy root on the VPS. Defaults to /opt/perfect-pitch.
  --acme-email   Optional contact email for Let's Encrypt registration.
EOF
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

infer_repo() {
  local remote_url
  remote_url="$(git remote get-url origin 2>/dev/null || true)"

  if [[ -z "$remote_url" ]]; then
    fail "Could not detect origin remote. Pass --repo owner/name explicitly."
  fi

  remote_url="${remote_url#git@github.com:}"
  remote_url="${remote_url#https://github.com/}"
  remote_url="${remote_url%.git}"

  if [[ "$remote_url" != */* ]]; then
    fail "Could not parse GitHub repo from origin remote. Pass --repo owner/name explicitly."
  fi

  printf '%s\n' "$remote_url"
}

set_secret() {
  local name="$1"
  local value="$2"

  printf '%s' "$value" | gh secret set "$name" --repo "$REPO"
}

BASE64_BIN="${BASE64_BIN:-base64}"
DEPLOY_PORT=22
DEPLOY_USER=root
DEPLOY_APP_DIR=/opt/perfect-pitch
ACME_EMAIL=
DEPLOY_DOMAIN=
VPS_HOST=
SSH_KEY_PATH=
REPO=

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DEPLOY_DOMAIN="${2:-}"
      shift 2
      ;;
    --host)
      VPS_HOST="${2:-}"
      shift 2
      ;;
    --ssh-key)
      SSH_KEY_PATH="${2:-}"
      shift 2
      ;;
    --repo)
      REPO="${2:-}"
      shift 2
      ;;
    --port)
      DEPLOY_PORT="${2:-}"
      shift 2
      ;;
    --user)
      DEPLOY_USER="${2:-}"
      shift 2
      ;;
    --app-dir)
      DEPLOY_APP_DIR="${2:-}"
      shift 2
      ;;
    --acme-email)
      ACME_EMAIL="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1"
      ;;
  esac
done

[[ -n "$DEPLOY_DOMAIN" ]] || fail "Missing --domain"
[[ -n "$VPS_HOST" ]] || fail "Missing --host"
[[ -n "$SSH_KEY_PATH" ]] || fail "Missing --ssh-key"
[[ -f "$SSH_KEY_PATH" ]] || fail "SSH key not found at $SSH_KEY_PATH"

if [[ -z "$REPO" ]]; then
  REPO="$(infer_repo)"
fi

gh auth status >/dev/null

SSH_KEY_B64="$("$BASE64_BIN" < "$SSH_KEY_PATH" | tr -d '\n')"

set_secret VPS_HOST "$VPS_HOST"
set_secret VPS_PORT "$DEPLOY_PORT"
set_secret VPS_USER "$DEPLOY_USER"
set_secret VPS_SSH_PRIVATE_KEY_B64 "$SSH_KEY_B64"
set_secret DEPLOY_DOMAIN "$DEPLOY_DOMAIN"
set_secret DEPLOY_APP_DIR "$DEPLOY_APP_DIR"

if [[ -n "$ACME_EMAIL" ]]; then
  set_secret ACME_EMAIL "$ACME_EMAIL"
fi

printf '\nGitHub repository secrets updated for %s.\n' "$REPO"
printf 'DNS prerequisite: point the A record for %s to %s before the first production deploy.\n' \
  "$DEPLOY_DOMAIN" "$VPS_HOST"
