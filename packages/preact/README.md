# @riot-jsx/preact

Preact renderer adapter and `RiotMount` component for `riot-jsx`.

- `createPreactRenderer()` — lets you use Preact components inside Riot via `connectRenderer()`
- `RiotMount` — lets you embed a Riot component inside a Preact tree

## Install

```bash
pnpm add @riot-jsx/base @riot-jsx/preact riot preact
```

## Usage

### Preact component → Riot tag

```ts
// my-counter.connector.ts
import { connectRenderer } from '@riot-jsx/base';
import { createPreactRenderer } from '@riot-jsx/preact';
import { Counter } from './Counter.tsx';

export default connectRenderer(Counter, {
  name: 'my-counter',
  renderer: createPreactRenderer(),
});
```

```ts
// main.ts
import riot from 'riot';
import MyCounter from './my-counter.connector.ts';

riot.register('my-counter', MyCounter);
// Now <my-counter count={0} /> works in any .riot template
```

### Riot component → Preact tree

```tsx
import { RiotMount } from '@riot-jsx/preact';
import LegacyPanel from './legacy-panel.riot';

function App() {
  return (
    <div>
      <RiotMount component={LegacyPanel} riotProps={{ title: 'Hello' }} />
    </div>
  );
}
```

Named and default Riot slots can be filled from Preact children:

```tsx
<RiotMount component={LegacyPanel} riotProps={{ title: 'Quarterly review' }}>
  <span slot="eyebrow">Named slot</span>
  <strong slot="title">Quarterly review</strong>
  <p>Default slot body content from Preact.</p>
</RiotMount>
```

## API

### `createPreactRenderer()`

Returns a `RendererAdapter<HTMLElement>` backed by Preact's `render()`.

### `RiotMount`

| Prop | Type | Default | Description |
|---|---|---|---|
| `component` | `RiotComponentWrapper` | — | The Riot wrapper to mount |
| `riotProps` | `object` | `{}` | Root props forwarded to Riot; a new top-level reference produces a fresh immutable snapshot |
| `containerTag` | `string` | `"div"` | Tag name for the container element |
| `class` | `string` | — | CSS class on the container element |
| `children` | `ComponentChildren` | — | Optional JSX children serialized into Riot default/named slots |

`RiotMount` only syncs Riot when the `riotProps` reference changes. Stabilise it with `useMemo` to avoid redundant updates.

Slot boundary:

- JSX children are serialized to static HTML before Riot mounts them. Event handlers, refs, and live nested JSX state do not cross this boundary.
- Ordinary children feed Riot's `default` slot. Children with `slot="name"` target the corresponding named Riot slot.
- When slot markup changes, `RiotMount` remounts the Riot component because Riot resolves slot templates only during mount.

## Peer dependencies

- `riot ≥ 4`
- `preact ≥ 10`
