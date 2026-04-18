#!/usr/bin/env bash

set -euo pipefail

log() {
  printf '==> %s\n' "$*"
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

run_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

download_to_stdout() {
  local url="$1"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url"
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO- "$url"
    return
  fi

  fail "Neither curl nor wget is available on the VPS."
}

http_probe() {
  local url="$1"

  if command -v curl >/dev/null 2>&1; then
    curl --fail --silent --show-error "$url" >/dev/null
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO- "$url" >/dev/null
    return
  fi

  fail "Neither curl nor wget is available for HTTP health checks."
}

install_docker_if_missing() {
  if command -v docker >/dev/null 2>&1; then
    return
  fi

  log "Installing Docker via the official convenience script"
  download_to_stdout "https://get.docker.com" | run_root sh
}

ensure_docker_running() {
  if command -v systemctl >/dev/null 2>&1; then
    run_root systemctl enable docker >/dev/null 2>&1 || true
    run_root systemctl restart docker
  elif command -v service >/dev/null 2>&1; then
    run_root service docker start
  fi

  docker info >/dev/null
}

ensure_compose_plugin() {
  if docker compose version >/dev/null 2>&1; then
    return
  fi

  if command -v apt-get >/dev/null 2>&1; then
    run_root apt-get update
    run_root apt-get install -y docker-compose-plugin
  elif command -v dnf >/dev/null 2>&1; then
    run_root dnf install -y docker-compose-plugin
  elif command -v yum >/dev/null 2>&1; then
    run_root yum install -y docker-compose-plugin
  fi

  docker compose version >/dev/null 2>&1 || fail "Docker Compose plugin is not available after bootstrap."
}

render_runtime_files() {
  local template_path="$RELEASE_DIR/deploy/Caddyfile.template"
  local caddyfile_path="$RELEASE_DIR/deploy/Caddyfile"
  local global_options=''

  if [[ -n "$ACME_EMAIL" ]]; then
    global_options=$'{\n\temail '"$ACME_EMAIL"$'\n}\n'
  fi

  awk \
    -v domain="$DEPLOY_DOMAIN" \
    -v global_options="$global_options" \
    '{
      gsub(/__GLOBAL_OPTIONS__/, global_options)
      gsub(/__DEPLOY_DOMAIN__/, domain)
      print
    }' "$template_path" > "$caddyfile_path"
}

wait_for_local_app() {
  local attempts=20
  local delay_seconds=3

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    if http_probe "http://127.0.0.1:${APP_PORT}/"; then
      return
    fi

    sleep "$delay_seconds"
  done

  fail "The app container did not become healthy on localhost:${APP_PORT}."
}

DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-}"
ACME_EMAIL="${ACME_EMAIL:-}"
APP_DIR="${DEPLOY_APP_DIR:-/opt/perfect-pitch}"
RELEASE_DIR="${DEPLOY_RELEASE_DIR:-$APP_DIR/current}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-perfect-pitch}"
APP_PORT="${APP_PORT:-8080}"

[[ -n "$DEPLOY_DOMAIN" ]] || fail "DEPLOY_DOMAIN is required."
[[ -d "$RELEASE_DIR" ]] || fail "Release directory $RELEASE_DIR does not exist."
[[ -f "$RELEASE_DIR/compose.yml" ]] || fail "compose.yml is missing from $RELEASE_DIR."

install_docker_if_missing
ensure_docker_running
ensure_compose_plugin
render_runtime_files

cd "$RELEASE_DIR"

log "Pulling base images"
docker compose --project-name "$COMPOSE_PROJECT_NAME" pull caddy

log "Building and starting the production stack"
docker compose --project-name "$COMPOSE_PROJECT_NAME" up -d --build --remove-orphans

log "Waiting for the app container to become healthy"
wait_for_local_app

log "Deployment finished successfully"
