#!/usr/bin/env bash
# scripts/bootstrap.sh — Genesis Kit one-time bootstrap script (idempotent)
# Generates Synapse config and prepares local data directories.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$ROOT_DIR/data"

echo "=== MiLyfe OS Genesis Kit Bootstrap ==="
mkdir -p "$DATA_DIR/matrix" "$DATA_DIR/ollama" "$DATA_DIR/vault"

if [ ! -f "$DATA_DIR/matrix/homeserver.yaml" ]; then
  echo "Generating Synapse homeserver.yaml for local development..."
  cat << 'EOF' > "$DATA_DIR/matrix/homeserver.yaml"
server_name: "milyfe.local"
pid_file: /data/homeserver.pid
listeners:
  - port: 8008
    tls: false
    type: http
    x_forwarded: true
    resources:
      - names: [client, federation]
        compress: false
database:
  name: sqlite3
  args:
    database: /data/homeserver.db
enable_registration: true
enable_registration_without_verification: true
EOF
  echo "✓ Created $DATA_DIR/matrix/homeserver.yaml"
else
  echo "✓ $DATA_DIR/matrix/homeserver.yaml already exists (skipping)"
fi

echo "=== Bootstrap Complete ==="
echo "Run 'npm run slice' to test the vertical slice or 'docker compose up' to launch the mesh."
