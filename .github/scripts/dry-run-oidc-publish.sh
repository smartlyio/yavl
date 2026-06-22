#!/usr/bin/env bash
#
# OIDC dry-run — exercise npm publish auth without uploading to the registry.
# For throwaway branch testing only. Do not merge to master.
#
# Expects actions/setup-node to have configured the npm registry (.npmrc).
# Authentication uses OIDC trusted publishing — do not set NODE_AUTH_TOKEN.

set -euo pipefail

FAILED=0
for dir in packages/*; do
  NAME=$(node -p "require('./$dir/package.json').name")
  VERSION=$(node -p "require('./$dir/package.json').version")

  echo "Dry-run publish ${NAME}@${VERSION}..."
  if npm publish "./$dir" --access public --dry-run --userconfig "$GITHUB_WORKSPACE/.npmrc"; then
    echo "Dry-run passed: ${NAME}@${VERSION}"
  else
    echo "::error::Dry-run failed for ${NAME}@${VERSION}"
    FAILED=1
  fi
done

if [ "$FAILED" -eq 1 ]; then
  echo "::error::One or more dry-runs failed. Check OIDC trusted publisher config on npmjs.com."
  exit 1
fi

echo ""
echo "OIDC dry-run passed for all packages. Nothing was published to npm."
