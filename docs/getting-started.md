# Getting Started

`riot-jsx` is a monorepo of bridge packages that let you embed **Preact / React components inside Riot.js**, and **Riot components inside Preact / React**, with optional Redux integration.

## Installation

Pick the adapter that matches your renderer:

```bash
# Preact
pnpm add @riot-jsx/base @riot-jsx/preact riot preact

# React 18
pnpm add @riot-jsx/base @riot-jsx/react riot react react-dom

# + Redux (either adapter)
pnpm add @riot-jsx/redux redux
```

## Quick start — Preact component inside Riot

### 1. Write a plain Preact component

```tsx
// src/components/MyWidget.tsx
export function MyWidget({ title }: { title: string }) {
  return <div class="widget"><h3>{title}</h3></div>;
}
```

### 2. Wrap it as a Riot tag

```ts
// src/connectors/my-widget.connector.ts
import { connectRenderer } from '@riot-jsx/base';
import { createPreactRenderer } from '@riot-jsx/preact';
import { MyWidget } from '../components/MyWidget.js';

const renderer = createPreactRenderer();

export default connectRenderer(MyWidget, {
  name: 'my-widget',   // must contain a hyphen
  renderer,
});
```

### 3. Register and use the tag

```ts
// src/main.ts
import { register } from 'riot';
import MyWidgetWrapper from './connectors/my-widget.connector.js';

register('my-widget', MyWidgetWrapper);
```

```html
<!-- any .riot file -->
<parent-component>
  <my-widget title="Hello from Riot" />
</parent-component>
```

## Quick start — Riot component inside Preact

```tsx
import { RiotMount } from '@riot-jsx/preact';
import LegacyChart from './legacy-chart.riot';

function Dashboard() {
  return (
    <div>
      <RiotMount component={LegacyChart} riotProps={{ data: [1, 2, 3] }} />
    </div>
  );
}
```

Riot is mounted once when the Preact component appears, updated when `riotProps` changes, and cleanly unmounted when the Preact component is removed.

## Passing children into Riot slots

`RiotMount` can feed JSX children into Riot's default slot and named slots:

```tsx
<RiotMount component={LegacyPanel} riotProps={{ title: 'Quarterly review' }}>
  <span slot="eyebrow">Named slot</span>
  <strong slot="title">Quarterly review</strong>
  <p>Default slot body content from JSX.</p>
</RiotMount>
```

Boundary notes:

- Ordinary children feed Riot's `default` slot. Children with `slot="name"` target named Riot slots.
- Children are serialized to static HTML before Riot mounts them. Event handlers, refs, and live nested React or Preact state do not cross this boundary.
- When slot markup changes, `RiotMount` remounts the Riot component because Riot resolves slot templates only during mount.

## TypeScript

All packages ship `.d.ts` files. The generic parameters of `connectRenderer` and `connectRedux` are inferred from the component props automatically.

## Requirements

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 |
| pnpm | ≥ 9 |
| Riot.js | ≥ 4 (peer dependency) |
| Preact | ≥ 10 (when using `@riot-jsx/preact`) |
| React | ≥ 16.8 (when using `@riot-jsx/react`) |
| Redux | ≥ 4 (when using `@riot-jsx/redux`) |

## Next steps

- [API Reference — @riot-jsx/base](./api-base.md)
- [API Reference — @riot-jsx/preact](./api-preact.md)
- [API Reference — @riot-jsx/react](./api-react.md)
- [API Reference — @riot-jsx/redux](./api-redux.md)
- [Advanced Patterns](./advanced.md)
