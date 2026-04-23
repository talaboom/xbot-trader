#!/usr/bin/env bash
# Push this directory to a fresh GitHub repo under your account.
#
# Usage (from inside /tmp/rose-oil-canada/):
#   ./SETUP.sh            # defaults to repo name "rose-oil-canada"
#   ./SETUP.sh my-repo    # custom repo name
#
# Requirements:
#   - `gh` CLI installed and authenticated (run `gh auth login` first)
#   - Git installed
#
# What it does:
#   1. Initializes git in this directory (if not already done)
#   2. Creates a new private GitHub repo under your account
#   3. Pushes all files to main
set -euo pipefail

REPO_NAME="${1:-rose-oil-canada}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is not installed."
  echo "Install with: sudo apt install gh   (Debian/Parrot)"
  echo "Then authenticate: gh auth login"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh is not authenticated. Run: gh auth login"
  exit 1
fi

# Initialize git if needed
if [ ! -d .git ]; then
  git init -b main
  git add .
  git -c user.email="$(git config --global user.email || echo you@example.com)" \
      -c user.name="$(git config --global user.name || echo You)" \
      commit -m "Initial commit: Rose Oil Canada planning docs

Six docs covering customer targeting, outreach emails, Canadian import
regulations, Shopify setup, and B2B marketplace strategy. Generated as a
starting kit for a Mississauga-based Bulgarian rose oil import business.
"
fi

# Create the GitHub repo and push
gh repo create "$REPO_NAME" --private --source=. --remote=origin --push

echo ""
echo "Done."
echo "Repo URL: $(gh repo view --json url --jq .url)"
