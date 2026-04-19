# API Reference — @riot-jsx/react

React renderer adapters and `RiotMount` component.

## `createReact18Renderer()`

Returns a `RendererAdapter` backed by React 18's `createRoot()` API.

```ts
import { createReact18Renderer } from '@riot-jsx/react';

const renderer = createReact18Renderer();
```

The adapter uses React 18's concurrent root API. Calling `update()` renders the same component into the existing root, and `unmount()` disposes the React tree cleanly.

## `createReact17Renderer()`

Returns a `RendererAdapter` backed by the legacy `ReactDOM.render()` API for React 16/17 projects.

```ts
import { createReact17Renderer } from '@riot-jsx/react';

const renderer = createReact17Renderer();
```

### Usage with `connectRenderer`

```ts
import { connectRenderer } from '@riot-jsx/base';
import { createReact18Renderer } from '@riot-jsx/react';
import { MyWidget } from './MyWidget.js';

const renderer = createReact18Renderer();

export default connectRenderer(MyWidget, {
  name: 'my-widget',
  renderer,
  css: `.title { font-size: 1.5rem; }`,
});
```

---

## `<RiotMount>`

A React component that mounts a compiled Riot component into the React tree.

```tsx
import { RiotMount } from '@riot-jsx/react';
import LegacyChart from './legacy-chart.riot';

function Dashboard({ data }: { data: number[] }) {
  return <RiotMount component={LegacyChart} riotProps={{ data }} />;
}
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `component` | `RiotComponentWrapper` | — | **Required.** The Riot component wrapper to mount |
| `riotProps` | `object` | `{}` | Root props forwarded into Riot; a new top-level reference produces a fresh immutable snapshot |
| `containerTag` | `string` | `"div"` | HTML tag for the wrapper element |
| `className` | `string` | — | CSS class name for the wrapper element |
| `children` | `ReactNode` | — | Optional JSX children serialized into Riot default/named slots |

### Lifecycle

1. **Mount** — `riot.component(wrapper)(container, propsSnapshot, meta?)` is called inside `useEffect`, after the DOM node is ready.
2. **Update** — When the top-level `riotProps` reference changes, `instance.props` is replaced with a new immutable snapshot and Riot `instance.update()` is called.
3. **Slot changes** — When serialized slot markup changes, `RiotMount` remounts the Riot component because Riot resolves slot templates only during mount.
4. **Unmount** — `instance.unmount(true)` is called in the cleanup so the wrapper DOM node remains under React's control.

### Performance tip

Pass a stable `riotProps` reference (e.g. via `useMemo`) to avoid triggering an unnecessary Riot re-render on every React render cycle:

```tsx
const riotData = useMemo(() => ({ items, theme }), [items, theme]);

return <RiotMount component={MyList} riotProps={riotData} />;
```

### Slot boundary

- Ordinary children feed Riot's `default` slot. Children with `slot="name"` target a named Riot slot.
- Children are serialized to static HTML before Riot mounts them. Event handlers, refs, and live nested React state do not cross this boundary.
- If you need interactive JSX islands inside Riot, wrap them with `connectRenderer()` instead of passing them through `RiotMount` children.
