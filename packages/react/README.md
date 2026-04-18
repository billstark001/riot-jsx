# @riot-jsx/react

React renderer adapters and `RiotMount` component for `riot-jsx`.

- `createReact18Renderer()` — React 18 adapter using the concurrent root API (`createRoot`)
- `createReact17Renderer()` — React 16/17 adapter using the legacy `ReactDOM.render` API
- `RiotMount` — embeds a Riot component inside a React tree

## Install

```bash
pnpm add @riot-jsx/base @riot-jsx/react riot react react-dom
```

## Usage

### React component → Riot tag

```ts
// my-widget.connector.ts
import { connectRenderer } from '@riot-jsx/base';
import { createReact18Renderer } from '@riot-jsx/react';
import { MyWidget } from './MyWidget.tsx';

export default connectRenderer(MyWidget, {
  name: 'my-widget',
  renderer: createReact18Renderer(),
});
```

```ts
// main.ts
import riot from 'riot';
import MyWidget from './my-widget.connector.ts';

riot.register('my-widget', MyWidget);
```

### Riot component → React tree

```tsx
import { RiotMount } from '@riot-jsx/react';
import LegacyPanel from './legacy-panel.riot';

function App() {
  const props = useMemo(() => ({ title: 'Hello' }), []);
  return <RiotMount component={LegacyPanel} riotProps={props} />;
}
```

## API

### `createReact18Renderer()`

Returns a `RendererAdapter` backed by React 18's `createRoot()`. Requires `react-dom ≥ 18`.

### `createReact17Renderer()`

Returns a `RendererAdapter` backed by the legacy `ReactDOM.render()`. Use this for React 16 or 17 projects; it imports from `react-dom` rather than `react-dom/client`.

### `RiotMount`

| Prop | Type | Default | Description |
|---|---|---|---|
| `component` | `RiotComponentWrapper` | — | The Riot wrapper to mount |
| `riotProps` | `Record<string, unknown>` | `{}` | Props forwarded to the Riot component |
| `containerTag` | `string` | `"div"` | Tag name for the container element |
| `className` | `string` | — | CSS class on the container element |

`RiotMount` only syncs Riot when the `riotProps` reference changes. Stabilise it with `useMemo` to avoid redundant updates.

## Peer dependencies

- `riot ≥ 4`
- `react ≥ 16.8` and `react-dom ≥ 16.8`
