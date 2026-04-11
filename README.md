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
