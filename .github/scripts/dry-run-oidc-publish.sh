#!/usr/bin/env bash
#
# OIDC dry-run — exercise npm publish auth without uploading to the registry.
# For throwaway branch testing only. Do not merge to master.
#
# Uses a unique prerelease version so npm does not reject the dry-run when the
# current release version (e.g. 7.4.0) already exists on the registry.
#
# Expects actions/setup-node to have configured the npm registry (.npmrc).
# setup-node may set NODE_AUTH_TOKEN for OIDC — do not override it with NPM_TOKEN.

set -euo pipefail

BASE_VERSION=$(node -p "require('./lerna.json').version")
DRY_RUN_VERSION="${BASE_VERSION}-oidc-dry-run.${GITHUB_RUN_NUMBER:?GITHUB_RUN_NUMBER is required}"

echo "OIDC dry-run version: ${DRY_RUN_VERSION} (not committed, not published)"

for dir in packages/*; do
  node -e "
    const fs = require('fs');
    const path = './${dir#./}/package.json';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
    pkg.version = '${DRY_RUN_VERSION}';
    if (pkg.dependencies?.['@smartlyio/yavl']) {
      pkg.dependencies['@smartlyio/yavl'] = '${DRY_RUN_VERSION}';
    }
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  "
done

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
  echo "::error::One or more dry-runs failed."
  echo "If the error mentions trusted publishing, workflow filename, or 401/403/404 auth, check OIDC config on npmjs.com."
  echo "If the error mentions an existing version, re-run the workflow (run number changes the prerelease suffix)."
  exit 1
fi

echo ""
echo "OIDC dry-run passed for all packages. Nothing was published to npm."
