# API Reference — @riot-jsx/base

Core connector factory, shared types, and CSS scoping utilities.

## `connectRenderer(Component, options)`

Wraps a JSX function component as a standard Riot `RiotComponentWrapper` — the same shape produced by the Riot compiler from a `.riot` source file.

```ts
function connectRenderer<Props extends Record<string, unknown>>(
  Component: ComponentType<Props>,
  options: ConnectOptions<Props>,
): RiotComponentWrapper
```

### `ConnectOptions<Props>`

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✓ | Custom-element tag name; must contain a hyphen |
| `renderer` | `RendererAdapter` | ✓ | Renderer adapter from `@riot-jsx/preact` or `@riot-jsx/react` |
| `css` | `string \| null` | — | Scoped CSS injected as a `<style>` tag into the Riot shadow DOM |
| `propsResolver` | `PropsResolver<Props>` | — | Custom function to transform Riot scope → JSX props |

#### `propsResolver`

```ts
type PropsResolver<Props> = (scope: RiotScope) => Props;
```

When omitted, the default resolver passes `scope.props` directly as JSX props, merging `scope.state` for extra fields. Supply a custom resolver to reshape or filter the incoming data.

```ts
connectRenderer(MyWidget, {
  name: 'my-widget',
  renderer,
  propsResolver: (scope) => ({
    title: String(scope.props.title ?? 'Untitled'),
    count: Number(scope.props.count ?? 0),
  }),
});
```

### Returns

A `RiotComponentWrapper` that can be passed to `riot.register()` or `riot.component()`.

---

## `RendererAdapter<Root>`

The contract that `@riot-jsx/preact` and `@riot-jsx/react` implement:

```ts
interface RendererAdapter<Root = unknown> {
  mount(container: HTMLElement, Component: ComponentType, props: Record<string, unknown>): Root;
  update(root: Root, Component: ComponentType, props: Record<string, unknown>): void;
  unmount(root: Root): void;
}
```

Implement this interface to add support for other JSX renderers (e.g. Solid, Vue's JSX mode).

---

## `scopeCSS(css, tagName)`

Prefixes every CSS rule with `[is="<tagName>"]` to emulate Riot's built-in CSS scoping outside of the `.riot` compiler pipeline.

```ts
function scopeCSS(css: string, tagName: string): string;
```

You rarely need to call this directly — `connectRenderer` applies it automatically when you pass the `css` option.

---

## Types

### `RiotScope`

```ts
interface RiotScope {
  readonly props: Record<string, unknown>;
  readonly state: Record<string, unknown>;
  readonly update: (newState?: Record<string, unknown>) => void;
  [key: string]: unknown;
}
```

### `RiotComponentWrapper`

```ts
interface RiotComponentWrapper {
  name: string;
  css: string | null;
  exports: object | null;
  template: TemplateFactory;
}
```

### `ComponentType<Props>`

```ts
type ComponentType<Props = Record<string, unknown>> =
  (props: Props) => unknown;
```
