#!/usr/bin/env bash
#
# Validate the NPM publish token and check its expiry date.
#
# Two layers of protection:
#   1. `npm whoami` verifies the token is currently valid.
#   2. NPM_TOKEN_EXPIRY date is checked to warn before expiration.
#
# Expects:
#   NODE_AUTH_TOKEN   — the npm token (from secrets.NPM_TOKEN)
#   NPM_TOKEN_EXPIRY  — expiration date in YYYY-MM-DD format (optional)
#   REPO_URL          — GitHub repo URL for instructions (e.g. https://github.com/smartlyio/yavl)

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/smartlyio/yavl}"

# --- Step 1: Verify token validity ---

if [ -z "${NODE_AUTH_TOKEN:-}" ]; then
  echo "::error::NPM_TOKEN secret is not configured in this repository."
  echo ""
  echo "To fix this:"
  echo "  1. Go to https://www.npmjs.com/settings/tokens"
  echo "  2. Generate a new Automation token with publish access"
  echo "  3. Add it as NPM_TOKEN in repository secrets:"
  echo "     ${REPO_URL}/settings/secrets/actions"
  exit 1
fi

echo "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}" > ~/.npmrc

if ! NPM_USER=$(npm whoami --registry https://registry.npmjs.org 2>&1); then
  echo "::error::NPM token is invalid or expired."
  echo ""
  echo "The token stored in the NPM_TOKEN secret no longer works."
  echo "Please generate a new one:"
  echo ""
  echo "  1. Go to https://www.npmjs.com/settings/tokens"
  echo "  2. Generate a new Automation token with publish access"
  echo "  3. Update NPM_TOKEN in repository secrets:"
  echo "     ${REPO_URL}/settings/secrets/actions"
  echo "  4. Update NPM_TOKEN_EXPIRY in repository variables (YYYY-MM-DD):"
  echo "     ${REPO_URL}/settings/variables/actions"
  exit 1
fi

echo "NPM token is valid (authenticated as: $NPM_USER)"
rm -f ~/.npmrc

# --- Step 2: Check expiry date ---

if [ -z "${NPM_TOKEN_EXPIRY:-}" ]; then
  echo "::warning::NPM_TOKEN_EXPIRY variable is not set. Set it to the token's expiration date (YYYY-MM-DD) in repository variables to enable early expiry warnings."
  echo "  ${REPO_URL}/settings/variables/actions"
  exit 0
fi

EXPIRY_EPOCH=$(date -d "$NPM_TOKEN_EXPIRY" +%s 2>/dev/null || true)
if [ -z "$EXPIRY_EPOCH" ]; then
  echo "::warning::Could not parse NPM_TOKEN_EXPIRY value '$NPM_TOKEN_EXPIRY'. Use YYYY-MM-DD format."
  exit 0
fi

TODAY_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - TODAY_EPOCH) / 86400 ))

ROTATE_INSTRUCTIONS=$(cat <<EOF

  1. Go to https://www.npmjs.com/settings/tokens
  2. Generate a new Automation token with publish access
  3. Update NPM_TOKEN in repository secrets:
     ${REPO_URL}/settings/secrets/actions
  4. Update NPM_TOKEN_EXPIRY in repository variables (YYYY-MM-DD):
     ${REPO_URL}/settings/variables/actions
EOF
)

if [ "$DAYS_LEFT" -lt 0 ]; then
  DAYS_AGO=$(( DAYS_LEFT * -1 ))
  echo "::error::NPM token expired $DAYS_AGO day(s) ago (on $NPM_TOKEN_EXPIRY)."
  echo ""
  echo "Please rotate the token immediately:${ROTATE_INSTRUCTIONS}"
  exit 1
elif [ "$DAYS_LEFT" -lt 15 ]; then
  echo "::error::NPM token expires in $DAYS_LEFT day(s) (on $NPM_TOKEN_EXPIRY). Please rotate it before merging."
  echo "${ROTATE_INSTRUCTIONS}"
  exit 1
elif [ "$DAYS_LEFT" -lt 30 ]; then
  echo "::warning::NPM token expires in $DAYS_LEFT day(s) (on $NPM_TOKEN_EXPIRY). Consider rotating it soon."
else
  echo "NPM token expires in $DAYS_LEFT day(s) (on $NPM_TOKEN_EXPIRY)."
fi
