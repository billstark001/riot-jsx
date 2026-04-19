# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to Semantic Versioning.

## [0.1.2] - 2026-04-19

### Added

- Added children-to-slot bridging for `RiotMount` in both `@riot-jsx/preact` and `@riot-jsx/react`, covering Riot's default slot and named slots via JSX `slot` props.
- Added new demo coverage for Riot-authored default-slot markup injected into wrapped Preact components, plus named-slot composition from Preact into Riot components.
- Added dedicated `@riot-jsx/react` API documentation and explicit guidance on the behavioral boundary between Riot slots and live JSX subtrees.

### Fixed

- Avoided redundant root-props snapshotting for stable top-level props objects and skipped slot work entirely when `RiotMount` is used without children.
- Removed remaining test-side type inference friction by moving more shape information into shared generic helpers instead of repeated assertions.

### Changed

- Bumped `@riot-jsx/base`, `@riot-jsx/preact`, `@riot-jsx/react`, and `@riot-jsx/redux` to `0.1.2`.
- Relaxed public props generics from `Record<string, unknown>` to ordinary object types so interface-shaped props infer cleanly without artificial index signatures.
- Documented that slotted JSX children are serialized to static HTML and that slot markup changes remount the Riot component.

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
