# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [0.1.1] - 2026-04-18

### Fixed

- Avoided redundant `RiotMount` updates when parent Preact or React trees rerender without changing `riotProps`.
- Preserved mounted Riot component state by keeping prop changes on the update path instead of remounting.
- Added regression coverage for omitted `riotProps` and reference-based prop syncing in both the Preact and React packages.
- Fixed renderer adapter prop inference so strictly typed Preact and React function components can be mounted and updated without `Record<string, unknown>` compatibility errors.
- Regenerated workspace package declarations after the renderer type fix so downstream packages no longer consume stale adapter signatures.

### Changed

- Bumped `@riot-jsx/base`, `@riot-jsx/preact`, `@riot-jsx/react`, and `@riot-jsx/redux` to `0.1.1`.
- Switched the npm publish workflow to GitHub Actions trusted publishing via OIDC and taught the publish script to skip token-only preflight checks in CI while keeping local npm login checks intact.

## [0.1.0] - 2026-04-10

First version.
