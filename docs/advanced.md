# Advanced Patterns

## 1. Local Preact state alongside Redux state

A Preact component wrapped by `connectRedux` can still use `useState` / `useReducer` for purely local UI state (e.g. a tooltip toggle). Redux only drives the data that must be shared globally.

```tsx
import { useState } from 'preact/hooks';

export function Counter({ count, increment, decrement }: CounterProps) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div>
      <button onClick={decrement}>−</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onMouseEnter={() => setShowHint(true)}
              onMouseLeave={() => setShowHint(false)}>?</button>
      {showHint && <p class="hint">Click ± to change the shared counter.</p>}
    </div>
  );
}
```

---

## 2. Passing own-props from a Riot parent

Props declared on the Riot element are available as `ownProps` inside both mapping functions.

```html
<!-- parent.riot -->
<parent>
  <my-counter factor="{ 5 }" />
</parent>
```

```ts
mapStateToProps: (state: RootState, ownProps: { factor?: string }) => ({
  count: state.counter.value * Number(ownProps.factor ?? 1),
}),
```

---

## 3. Riot component receiving dynamic props from Preact

Use `riotProps` on `<RiotMount>` to drive the embedded Riot component with reactive Preact data. Passing a `useMemo`-stabilised object avoids unnecessary Riot update cycles:

```tsx
function Dashboard({ userId }: { userId: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const riotData = useMemo(
    () => ({ userId, theme }),
    [userId, theme],
  );

  return (
    <div>
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle theme
      </button>
      <RiotMount component={LegacyChart} riotProps={riotData} />
    </div>
  );
}
```

---

## 4. Multiple Riot components on one page

Every registered tag name must be unique. Create one connector file per tag:

```ts
// connectors/chart.connector.ts
export default connectRenderer(Chart, { name: 'legacy-chart', renderer });

// connectors/map.connector.ts
export default connectRenderer(Map,   { name: 'legacy-map',   renderer });
```

```ts
// main.ts
register('legacy-chart', ChartWrapper);
register('legacy-map',   MapWrapper);
```

---

## 5. Custom `propsResolver` for fine-grained control

When neither the default pass-through nor Redux mapping is sufficient, supply a `propsResolver` directly to `connectRenderer`:

```ts
connectRenderer(SearchBox, {
  name: 'search-box',
  renderer,
  propsResolver: (scope) => ({
    query:      String(scope.props.q ?? ''),
    maxResults: Math.min(Number(scope.props.limit ?? 20), 100),
    onSearch:   typeof scope.props.onsearch === 'function'
                  ? scope.props.onsearch as (q: string) => void
                  : () => {},
  }),
});
```

---

## 6. Unmounting and remounting Riot components inside a list

When you render a list of `<RiotMount>` items — e.g. one chart per dataset entry — each item must receive a stable, unique `key` prop so Preact correctly destroys and creates the Riot instance as items enter and leave:

```tsx
function ReportList({ reports }: { reports: Report[] }) {
  return (
    <ul>
      {reports.map(r => (
        <li key={r.id}>
          <RiotMount component={ReportChart} riotProps={{ reportId: r.id }} />
        </li>
      ))}
    </ul>
  );
}
```

---

## 7. Using scoped CSS

Provide a `css` string to `connectRenderer` / `connectRedux`. The library prefixes every rule with `[is="<tag-name>"]`, preventing style leakage:

```ts
const css = `
  .card { border-radius: 8px; background: #f0f4ff; }
  .card h2 { margin: 0; }
`;

connectRenderer(Card, { name: 'info-card', renderer, css });
```

Compiled output is equivalent to:

```css
[is="info-card"] .card { border-radius: 8px; background: #f0f4ff; }
[is="info-card"] .card h2 { margin: 0; }
```

---

## 8. Server-side rendering considerations

`@riot-jsx/preact` and `@riot-jsx/react` depend on browser DOM APIs to mount and update components. For SSR, move registration to client-only code (e.g. a dynamic `import()` guarded by `typeof window !== 'undefined'`) and hydrate with Preact's or React's hydration APIs.
