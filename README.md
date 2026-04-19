# riot-jsx

Bridge library for using Preact and React components inside [Riot.js](https://riot.js.org/) applications, and vice versa. Enables bidirectional nesting of JSX components and Riot components with optional Redux integration.

## Packages

| Package | Description |
|---|---|
| [`@riot-jsx/base`](packages/base) | Core connector API, types, and CSS scoping utilities |
| [`@riot-jsx/preact`](packages/preact) | Preact renderer adapter and `RiotMount` component |
| [`@riot-jsx/react`](packages/react) | React 18/17 renderer adapters and `RiotMount` component |
| [`@riot-jsx/redux`](packages/redux) | Redux store integration for wrapped components |
| [`example`](packages/example) | Vite + Preact + Riot + Redux demo app |

## How it works

`connectRenderer()` wraps any JSX function component as a standard Riot `RiotComponentWrapper`, which can be registered with `riot.register()` or `riot.component()`. Each package also ships a `RiotMount` component that embeds a Riot component into a Preact or React tree.

For `RiotMount`, root props stay shallow by design: Riot is only resynced when the top-level `riotProps` reference changes, and each new root-props object is snapshotted before being assigned back onto the mounted Riot instance. JSX `children` can also be forwarded into Riot slots, but they are serialized into static slot HTML rather than kept as a live nested JSX subtree.

```
JSX component  ──→  connectRenderer()  ──→  riot.register('tag-name', wrapper)
Riot component ──→  <RiotMount component={wrapper} />  ──→  JSX tree
```

## Quick start

```bash
# Using Preact
pnpm add @riot-jsx/base @riot-jsx/preact riot preact

# Using React
pnpm add @riot-jsx/base @riot-jsx/react riot react react-dom

# With Redux
pnpm add @riot-jsx/base @riot-jsx/preact @riot-jsx/redux riot preact redux
```

## Documentation

| Document | Description |
|---|---|
| [Getting Started](docs/getting-started.md) | Installation, quick-start recipes, requirements |
| [API — @riot-jsx/base](docs/api-base.md) | `connectRenderer`, `RendererAdapter`, `scopeCSS`, types |
| [API — @riot-jsx/preact](docs/api-preact.md) | `createPreactRenderer`, `<RiotMount>` |
| [API — @riot-jsx/react](docs/api-react.md) | `createReact18Renderer`, `createReact17Renderer`, `<RiotMount>` |
| [API — @riot-jsx/redux](docs/api-redux.md) | `connectRedux`, `mapStateToProps`, `mapDispatchToProps` |
| [Advanced Patterns](docs/advanced.md) | Local state, own-props, reactive riotProps, slots, CSS scoping, SSR notes |

## Live demo

The [example app](packages/example) is deployed to GitHub Pages and shows six scenarios:

- **A** — Preact component connected to Redux (direct, no Riot)
- **B** — Riot → Preact nesting, shared Redux store
- **C** — Riot → Preact nesting, local Preact state (no Redux)
- **D** — Preact → Riot, reactive `riotProps`, Riot lifecycle hooks
- **E** — Riot → Preact static children injection inside a Riot host component
- **F** — Preact → Riot, named-slot composition

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test:run
```

## Requirements

- Node.js ≥ 18
- pnpm ≥ 9
- Riot ≥ 4 (peer dependency)
- Preact ≥ 10 or React ≥ 16.8 (peer dependency, depending on the adapter used)
