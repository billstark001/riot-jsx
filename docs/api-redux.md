# API Reference — @riot-jsx/redux

Connects a JSX component to a Redux store inside a Riot tag, handling subscription, re-renders, and cleanup automatically.

## `connectRedux(Component, options)`

```ts
import { connectRedux } from '@riot-jsx/redux';

function connectRedux<S, OwnProps, StateProps, DispatchProps>(
  Component: ComponentType<OwnProps & StateProps & DispatchProps>,
  options: ReduxConnectOptions<S, OwnProps, StateProps, DispatchProps>,
): RiotComponentWrapper
```

### `ReduxConnectOptions`

Extends `ConnectOptions` from `@riot-jsx/base` with Redux-specific fields. `propsResolver` is intentionally omitted — Redux wiring is derived from `mapStateToProps` / `mapDispatchToProps`.

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✓ | Custom-element tag name |
| `renderer` | `RendererAdapter` | ✓ | Renderer adapter (`createPreactRenderer()`, etc.) |
| `getStore` | `() => ReduxStore<S>` | ✓ | Getter that returns the Redux store instance |
| `css` | `string \| null` | — | Scoped CSS |
| `mapStateToProps` | `MapStateToProps<S, OwnProps, StateProps>` | — | Maps Redux state → additional JSX props |
| `mapDispatchToProps` | `MapDispatchToProps<OwnProps, DispatchProps>` | — | Maps `dispatch` → callback props |

### Props merge order (highest priority first)

```
dispatchProps  >  stateProps  >  ownProps (Riot element attributes)
```

### Subscription lifecycle

- On **mount**, `store.subscribe()` is called and the initial state is rendered immediately.
- On every **store change**, the new `stateProps` are compared to the previous ones. A re-render is triggered only when the result is different (shallow equality check on individual keys).
- On **unmount**, the subscription is released via the unsubscribe callback.

---

## `mapStateToProps`

```ts
type MapStateToProps<S, OwnProps, StateProps> =
  (state: S, ownProps: OwnProps) => StateProps;
```

Receives the current Redux state and the own props passed to the Riot element, and returns extra props that are merged into the JSX component.

```ts
mapStateToProps: (state: RootState, own) => ({
  count: state.counter.value,
  multiplier: own.factor as number ?? 1,
}),
```

## `mapDispatchToProps`

```ts
type MapDispatchToProps<OwnProps, DispatchProps> =
  (dispatch: Dispatch, ownProps: OwnProps) => DispatchProps;
```

Receives Redux `dispatch` and own props, and returns callback props injected into the JSX component.

```ts
mapDispatchToProps: (dispatch) => ({
  increment: () => dispatch({ type: 'counter/increment' }),
  decrement: () => dispatch({ type: 'counter/decrement' }),
  reset:     () => dispatch({ type: 'counter/reset' }),
}),
```

---

## Full example

```ts
import { connectRedux } from '@riot-jsx/redux';
import { createPreactRenderer } from '@riot-jsx/preact';
import { Counter } from './Counter.js';
import { getStore } from './store.js';
import type { RootState } from './store.js';

const renderer = createPreactRenderer();

export default connectRedux(Counter, {
  name: 'redux-counter',
  renderer,
  getStore,
  mapStateToProps: (state: RootState) => ({
    count: state.counter.value,
  }),
  mapDispatchToProps: (dispatch) => ({
    increment: () => dispatch({ type: 'counter/increment' }),
    decrement: () => dispatch({ type: 'counter/decrement' }),
    reset:     () => dispatch({ type: 'counter/reset' }),
  }),
});
```

Then in your entry point:

```ts
import { register } from 'riot';
import ReduxCounter from './connectors/Counter.connector.js';

register('redux-counter', ReduxCounter);
```

And in any `.riot` file:

```html
<parent-panel>
  <redux-counter />
</parent-panel>
```
