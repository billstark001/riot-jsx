# example

Demo application showing bidirectional nesting of Preact and Riot components sharing a Redux store.

## What it demonstrates

- **Preact → Riot**: A root Preact `App` component embeds a Riot panel via `<RiotMount>`.
- **Riot → Preact**: The Riot panel (`RiotPanel.riot`) uses a `<preact-counter>` tag, which is a Preact component registered via `connectRedux`.
- **Shared Redux state**: Both the outer Preact app and the nested Preact component read from the same Redux counter store, incremented/decremented via dispatch callbacks.

## Run

```bash
pnpm install        # from the workspace root
pnpm --filter example dev
```

Then open `http://localhost:5173`.

## Stack

- [Vite 5](https://vitejs.dev/) with `@preact/preset-vite`
- [Preact 10](https://preactjs.com/) (JSX via `@preact/preset-vite`)
- [Riot.js 9](https://riot.js.org/) with `rollup-plugin-riot` for `.riot` SFC support
- [Redux](https://redux.js.org/) (plain, no toolkit) for shared state
- [`@riot-jsx/preact`](../preact) + [`@riot-jsx/redux`](../redux) for bridging

## Project structure

```
src/
  main.tsx                        Entry point — registers Riot tags, renders Preact root
  store.ts                        Redux store (counter slice)
  App.tsx                         Root Preact component with RiotMount
  components/
    PreactCounter.tsx             Pure Preact counter component
    RiotPanel.riot                Riot SFC that uses <preact-counter />
  connectors/
    PreactCounter.connector.ts    Connects PreactCounter to Riot + Redux
```
