# @riot-jsx/redux

Redux integration for `riot-jsx`. Wraps a JSX component as a Riot tag that automatically subscribes to a Redux store, re-renders on state changes, and cleans up on unmount.

## Install

```bash
pnpm add @riot-jsx/base @riot-jsx/preact @riot-jsx/redux riot preact redux
# or with React:
pnpm add @riot-jsx/base @riot-jsx/react @riot-jsx/redux riot react react-dom redux
```

## Usage

```ts
// counter.connector.ts
import { connectRedux } from '@riot-jsx/redux';
import { createPreactRenderer } from '@riot-jsx/preact';
import { Counter } from './Counter.tsx';
import { store } from './store.ts';
import type { RootState } from './store.ts';

export default connectRedux(Counter, {
  name: 'redux-counter',
  renderer: createPreactRenderer(),
  getStore: () => store,
  mapStateToProps: (state: RootState) => ({
    count: state.counter.value,
  }),
  mapDispatchToProps: (dispatch) => ({
    increment: () => dispatch({ type: 'counter/increment' }),
    decrement: () => dispatch({ type: 'counter/decrement' }),
  }),
});
```

```ts
// main.ts
import riot from 'riot';
import ReduxCounter from './counter.connector.ts';

riot.register('redux-counter', ReduxCounter);
```

## API

### `connectRedux(Component, options)`

Extends `connectRenderer()` with Redux lifecycle management.

**Props merge order** (highest priority first): `dispatchProps` > `stateProps` > `ownProps` (Riot props from the parent template).

**Options** extend `ConnectOptions` from `@riot-jsx/base`:

| Option | Type | Description |
|---|---|---|
| `getStore` | `() => ReduxStore<S>` | Returns the Redux store instance |
| `mapStateToProps` | `(state, ownProps) => StateProps` | Maps store state to component props |
| `mapDispatchToProps` | `(dispatch, ownProps) => DispatchProps` | Maps dispatch to callback props |

All other `ConnectOptions` fields (`name`, `renderer`, `css`, `exports`) are also accepted.

**Lifecycle**: subscribes to the store in `onBeforeMount`, unsubscribes in `onUnmounted`. Existing `onBeforeMount` / `onUnmounted` hooks in `options.exports` are composed (existing hook fires first).

## Peer dependencies

- `riot ≥ 4`
- `redux ≥ 4`
- `preact ≥ 10` or `react ≥ 16.8` (whichever renderer you use)
