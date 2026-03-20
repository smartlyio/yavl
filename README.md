# Yet Another Validation Library (YAVL)

A declarative and type-safe model & validation library for TypeScript. YAVL lets you define field dependencies, conditional validations, default values, and metadata annotations in a single model definition — with full compile-time type safety.

Key features include incremental validation (only re-validates changed data), support for complex nested and array structures, conditional logic via `when`, a powerful annotation system, and default value resolution with circular dependency detection. YAVL is framework-agnostic and works on both client and server.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [`@smartlyio/yavl`](packages/yavl) | [![npm](https://img.shields.io/npm/v/@smartlyio/yavl)](https://www.npmjs.com/package/@smartlyio/yavl) | Core model & validation library |
| [`@smartlyio/yavl-hooks`](packages/yavl-hooks) | [![npm](https://img.shields.io/npm/v/@smartlyio/yavl-hooks)](https://www.npmjs.com/package/@smartlyio/yavl-hooks) | React hooks for YAVL |

## Releasing

1. Open a PR and add a label (`patch`/`minor`/`major`/`no-release`)
2. Wait for CI checks to pass (label validation, npm token check)
3. Get your PR approved
4. Merge — all packages are automatically versioned and published to npm

> **Note:** The npm token expires every 90 days. If the token check fails, follow the [NPM token rotation](#npm-token-rotation) instructions.

### Release workflow

This project uses [Lerna](https://lerna.js.org/) in fixed version mode with GitHub Actions for automated versioning and publishing. All packages (`@smartlyio/yavl`, `@smartlyio/yavl-hooks`) are versioned together — a change in any package bumps all packages to the same version.

The release process is driven entirely by PR labels. Contributors do not need to run any versioning or publishing commands.

#### How to release

1. **Open a pull request** with your changes against `master`.
2. **Add a release label** to the PR: `patch`, `minor`, or `major`.
   - `patch` — bug fixes, small non-breaking changes
   - `minor` — new features, non-breaking additions
   - `major` — breaking changes
   - `no-release` — changes that should not trigger a release (docs, CI, refactors)
3. **The label is required.** A CI check will block merging if no release label is set.
4. **Merge the PR.** That's it — the rest is fully automated.

After merge, a GitHub Action automatically:
- Determines the bump type from the PR label
- Bumps all package versions via `lerna version` (fixed mode)
- Commits the version bump to `master` with the PR titles as a release log
- Publishes each package to npm via `npm publish` (idempotent — safe to re-run)
- Creates and pushes a `v{VERSION}` git tag

If multiple PRs are merged between releases, the highest bump type wins (major > minor > patch) and all PR titles are included in the version commit.

#### CI checks on pull requests

| Check | What it does |
|---|---|
| **Release Label Check** | Fails if no release label is set. Ensures exactly one of `patch`, `minor`, `major`, or `no-release` is present. |
| **NPM Token Check** | Verifies the npm publish token is valid and not about to expire. Fails if expired or expiring within 14 days; warns at 30 days. |

#### NPM token rotation

The npm publish token (`NPM_TOKEN`) expires every 90 days. The NPM Token Check workflow catches this early, during PR review rather than at publish time.

When rotating the token:

1. Go to [npmjs.com token settings](https://www.npmjs.com/settings/smartlyio/tokens)
2. Generate a new **Automation** token with publish access
3. Update the `NPM_TOKEN` [repository secret](https://github.com/smartlyio/yavl/settings/secrets/actions)
4. Update the `NPM_TOKEN_EXPIRY` [repository variable](https://github.com/smartlyio/yavl/settings/variables/actions) with the new expiration date (YYYY-MM-DD format)

