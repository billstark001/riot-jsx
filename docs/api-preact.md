# API Reference — @riot-jsx/preact

Preact renderer adapter and `RiotMount` component.

## `createPreactRenderer()`

Returns a `RendererAdapter<HTMLElement>` backed by Preact's `render` function.

```ts
import { createPreactRenderer } from '@riot-jsx/preact';

const renderer = createPreactRenderer();
```

The adapter uses Preact's in-place diff so that `update()` performs an incremental patch rather than a full re-render. Calling `unmount()` passes `null` to Preact's `render`, which tears down the component tree and runs all `useEffect` cleanups.

### Usage with `connectRenderer`

```ts
import { connectRenderer } from '@riot-jsx/base';
import { createPreactRenderer } from '@riot-jsx/preact';
import { MyWidget } from './MyWidget.js';

const renderer = createPreactRenderer();

export default connectRenderer(MyWidget, {
  name: 'my-widget',
  renderer,
  css: `.title { font-size: 1.5rem; }`,
});
```

---

## `<RiotMount>`

A Preact component that mounts a compiled Riot component into the Preact tree.

```tsx
import { RiotMount } from '@riot-jsx/preact';
import LegacyChart from './legacy-chart.riot';

function Dashboard({ data }: { data: number[] }) {
  return <RiotMount component={LegacyChart} riotProps={{ data }} />;
}
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `component` | `RiotComponentWrapper` | — | **Required.** The Riot component wrapper to mount |
| `riotProps` | `Record<string, unknown>` | `{}` | Props forwarded into the Riot component on every render |
| `containerTag` | `string` | `"div"` | HTML tag for the wrapper element |
| `class` | `string` | — | CSS class name for the wrapper element |

### Lifecycle

1. **Mount** — `riot.component(wrapper)(container, riotProps)` is called inside `useEffect`, after the DOM node is ready.
2. **Update** — When `riotProps` changes (shallow comparison), `instance.update(riotProps)` is called.
3. **Unmount** — `instance.unmount()` is called in the `useEffect` cleanup when the Preact component is removed.

### Performance tip

Pass a stable `riotProps` reference (e.g. via `useMemo`) to avoid triggering an unnecessary Riot re-render on every Preact render cycle:

```tsx
const riotData = useMemo(() => ({ items, theme }), [items, theme]);

return <RiotMount component={MyList} riotProps={riotData} />;
```
