#!/data/data/com.termux/files/usr/bin/bash
# Install Claude Code on Termux (Android / Pixel).
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/talaboom/xbot-trader/main/tools/termux-claude-setup.sh | bash
#
# What it does:
#   - Updates Termux package index
#   - Installs nodejs, git, openssh, termux-api
#   - Requests storage permission so Claude can see /sdcard
#   - Installs @anthropic-ai/claude-code globally via npm
#   - Acquires a wake lock so long sessions don't get killed

set -euo pipefail

if [ ! -d /data/data/com.termux ]; then
  echo "This script is for Termux on Android. Aborting." >&2
  exit 1
fi

echo "==> Updating package index..."
pkg update -y

echo "==> Installing nodejs, git, openssh, termux-api..."
pkg install -y nodejs git openssh termux-api

echo "==> Requesting storage permission (tap Allow if prompted)..."
termux-setup-storage || true

echo "==> Installing Claude Code globally via npm..."
npm install -g @anthropic-ai/claude-code

echo "==> Acquiring wake lock (prevents Android from killing long sessions)..."
termux-wake-lock || true

cat <<'EOF'

Setup complete.

Next steps:
  1. Run:  claude
     (opens your browser to log in — one time only)

  2. For GitHub over SSH:
       ssh-keygen -t ed25519 -C "pixel"
       cat ~/.ssh/id_ed25519.pub
     ...paste into https://github.com/settings/keys

  3. Battery: Settings -> Apps -> Termux -> Battery -> Unrestricted.

  4. Optional (rooted devices): pkg install tsu
     Then `tsu` gives you a root shell if you ever need it.

EOF
