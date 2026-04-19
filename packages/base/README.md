# @riot-jsx/base

Core connector API for `riot-jsx`. Provides the `connectRenderer()` function that wraps any JSX function component as a standard Riot component wrapper, plus CSS scoping utilities and shared TypeScript types.

All public props generics accept ordinary object interfaces. You do not need to add artificial `[key: string]: unknown` index signatures to component props just to satisfy the bridge types.

## Install

```bash
pnpm add @riot-jsx/base
```

A renderer adapter package (`@riot-jsx/preact` or `@riot-jsx/react`) is required in practice; `@riot-jsx/base` is rarely used on its own.

## API

### `connectRenderer(Component, options)`

Wraps a JSX function component as a Riot `RiotComponentWrapper`.

```ts
import { connectRenderer } from '@riot-jsx/base';
import { createPreactRenderer } from '@riot-jsx/preact';

export default connectRenderer(MyWidget, {
  name: 'my-widget',        // custom-element tag name (must contain a hyphen)
  renderer: createPreactRenderer(),
  css: `.title { color: red; }`,   // optional scoped CSS
  propsResolver: (scope) => ({     // optional: map Riot scope → component props
    value: scope.props['value'] as number,
  }),
});
```

The returned wrapper can be registered with Riot:

```ts
import riot from 'riot';
import MyWidgetWrapper from './my-widget.connector.ts';

riot.register('my-widget', MyWidgetWrapper);
```

### `snapshotRiotProps(props)`

Creates the same immutable root-props snapshot used internally by `RiotMount`. Plain objects and arrays are cloned recursively, while opaque references such as functions, dates, DOM nodes, maps, and sets are preserved by reference.

### CSS scoping

```ts
import { scopeCSSNative, scopeCSSWithStylis } from '@riot-jsx/base';

// Regex-based scoping (no extra dependency)
const scoped = scopeCSSNative(css, '[data-scope-abc]');

// Stylis-based scoping (pass the stylis module explicitly)
import stylis from 'stylis';
const scoped = scopeCSSWithStylis(css, '[data-scope-abc]', stylis);
```

## Types

Key interfaces exported from this package:

- `RiotComponentWrapper` — the object shape Riot expects from a compiled `.riot` file
- `RiotComponentTemplate` — the template object lifecycle interface (`createDOM`, `mount`, `update`, `unmount`, `clone`)
- `RendererAdapter<Root>` — interface that renderer packages implement
- `ConnectOptions<Props>` — options passed to `connectRenderer()`
- `RiotScope` — the `this` context Riot passes to template lifecycle methods
