# example

Demo application showing bidirectional nesting of Preact and Riot components, including Redux state sharing, reactive Riot root props, Riot-authored child content injected into Preact, and named slots.

## What it demonstrates

- **Preact → Riot**: A root Preact `App` component embeds a Riot panel via `<RiotMount>`.
- **Riot → Preact**: The Riot panel (`RiotPanel.riot`) uses a `<preact-counter>` tag, which is a Preact component registered via `connectRedux`.
- **Shared Redux state**: Both the outer Preact app and the nested Preact component read from the same Redux counter store, incremented/decremented via dispatch callbacks.
- **Reactive Riot root props**: `RiotTimer.riot` is driven by memoized `riotProps` from Preact.
- **Riot → Preact children injection**: `RiotSlotCard.riot` feeds Riot-authored default-slot markup into a wrapped Preact component's `children` prop as static HTML.
- **Named slots**: `RiotNamedSlots.riot` maps JSX children with `slot="..."` into named Riot slots.

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
- Riot slot metadata used in both directions: Riot → Preact children injection and Preact → Riot named-slot composition

## Project structure

```
src/
  main.tsx                        Entry point — registers Riot tags, renders Preact root
  store.ts                        Redux store (counter slice)
  App.tsx                         Root Preact component with RiotMount
  components/
    PreactCounter.tsx             Pure Preact counter component
    PreactChildrenCard.tsx        Preact card receiving Riot-authored children
    RiotPanel.riot                Riot SFC that uses <preact-counter />
    RiotSlotCard.riot             Riot SFC that injects child content into a Preact card
    RiotNamedSlots.riot           Riot SFC with named slots driven by JSX slot props
  connectors/
    PreactChildrenCard.connector.ts Connects PreactChildrenCard to Riot slot content
    PreactCounter.connector.ts    Connects PreactCounter to Riot + Redux
```
