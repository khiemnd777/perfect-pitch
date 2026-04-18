#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deploy/bootstrap-github-secrets.sh

  bash scripts/deploy/bootstrap-github-secrets.sh --env-file .env.deploy

Options:
  --env-file     Optional dotenv file. Defaults to .env.deploy in the repo root.

Environment file variables:
  GH_TOKEN       Optional GitHub token with repo/admin:repo_hook or repo secret write access. If set, the script authenticates gh automatically.
  DEPLOY_DOMAIN  Production domain pointed to the VPS A record. Required.
  VPS_HOST       VPS public IP or hostname used by GitHub Actions over SSH. Required.
  SSH_KEY_PATH   Path to an existing private SSH key for the VPS user.
  VPS_PASSWORD   Password for the VPS user. If set without SSH_KEY_PATH, a deploy key is generated and installed automatically.
  REPO           Optional GitHub repo in owner/name format. Auto-detected by default.
  VPS_PORT       Optional SSH port. Defaults to 22.
  VPS_USER       Optional SSH user. Defaults to root.
  DEPLOY_APP_DIR Optional deploy root on the VPS. Defaults to /opt/perfect-pitch.
  ACME_EMAIL     Optional contact email for Let's Encrypt registration.
  VITE_GA_MEASUREMENT_ID Optional Google Analytics 4 measurement id like G-XXXXXXXXXX.
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

ensure_command() {
  local name="$1"

  command -v "$name" >/dev/null 2>&1 || fail "Missing required command: $name"
}

load_env_file() {
  local env_file="$1"

  [[ -f "$env_file" ]] || fail "Missing env file: $env_file"

  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
}

ensure_github_auth() {
  if gh auth status >/dev/null 2>&1; then
    return
  fi

  [[ -n "${GH_TOKEN:-}" ]] || fail "gh is not authenticated. Add GH_TOKEN to $ENV_FILE or run gh auth login once."

  printf '%s' "$GH_TOKEN" | gh auth login --hostname github.com --with-token >/dev/null
}

install_generated_key_via_password() {
  local key_path="$1"
  local pubkey_path="${key_path}.pub"

  ensure_command sshpass
  ensure_command ssh-keygen
  [[ -n "$VPS_PASSWORD" ]] || fail "--password is required to install a generated deploy key."

  if [[ ! -f "$key_path" ]]; then
    mkdir -p "$(dirname "$key_path")"
    ssh-keygen -t ed25519 -N '' -f "$key_path" -C "perfect-pitch-deploy" >/dev/null
  fi

  [[ -f "$pubkey_path" ]] || fail "Public key not found at $pubkey_path"

  sshpass -p "$VPS_PASSWORD" ssh \
    -p "$VPS_PORT" \
    -o StrictHostKeyChecking=accept-new \
    -o PreferredAuthentications=password \
    -o PubkeyAuthentication=no \
    "$VPS_USER@$VPS_HOST" \
    "umask 077 && mkdir -p ~/.ssh && touch ~/.ssh/authorized_keys && grep -qxF '$(cat "$pubkey_path")' ~/.ssh/authorized_keys || printf '%s\n' '$(cat "$pubkey_path")' >> ~/.ssh/authorized_keys"
}

BASE64_BIN="${BASE64_BIN:-base64}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.deploy"
VPS_PORT=22
VPS_USER=root
DEPLOY_APP_DIR=/opt/perfect-pitch
ACME_EMAIL=
VITE_GA_MEASUREMENT_ID=
DEPLOY_DOMAIN=
VPS_HOST=
SSH_KEY_PATH=
VPS_PASSWORD=
REPO=

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
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

load_env_file "$ENV_FILE"

[[ -n "$DEPLOY_DOMAIN" ]] || fail "Missing DEPLOY_DOMAIN in $ENV_FILE"
[[ -n "$VPS_HOST" ]] || fail "Missing VPS_HOST in $ENV_FILE"

if [[ -z "$SSH_KEY_PATH" && -n "$VPS_PASSWORD" ]]; then
  SSH_KEY_PATH="${HOME}/.ssh/perfect-pitch-deploy-ed25519"
  install_generated_key_via_password "$SSH_KEY_PATH"
fi

[[ -n "$SSH_KEY_PATH" ]] || fail "Missing --ssh-key or --password"
[[ -f "$SSH_KEY_PATH" ]] || fail "SSH key not found at $SSH_KEY_PATH"

if [[ -z "$REPO" ]]; then
  REPO="$(infer_repo)"
fi

ensure_github_auth

SSH_KEY_B64="$("$BASE64_BIN" < "$SSH_KEY_PATH" | tr -d '\n')"

set_secret VPS_HOST "$VPS_HOST"
set_secret VPS_PORT "$VPS_PORT"
set_secret VPS_USER "$VPS_USER"
set_secret VPS_SSH_PRIVATE_KEY_B64 "$SSH_KEY_B64"
set_secret DEPLOY_DOMAIN "$DEPLOY_DOMAIN"
set_secret DEPLOY_APP_DIR "$DEPLOY_APP_DIR"

if [[ -n "$ACME_EMAIL" ]]; then
  set_secret ACME_EMAIL "$ACME_EMAIL"
fi

if [[ -n "$VITE_GA_MEASUREMENT_ID" ]]; then
  set_secret VITE_GA_MEASUREMENT_ID "$VITE_GA_MEASUREMENT_ID"
fi

printf '\nGitHub repository secrets updated for %s.\n' "$REPO"
printf 'Loaded config from: %s\n' "$ENV_FILE"
printf 'DNS prerequisite: point the A record for %s to %s before the first production deploy.\n' \
  "$DEPLOY_DOMAIN" "$VPS_HOST"
printf 'Deploy key path: %s\n' "$SSH_KEY_PATH"
