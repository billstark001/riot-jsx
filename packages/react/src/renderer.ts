import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { RendererAdapter, ComponentType } from '@riot-jsx/base';

// ---------------------------------------------------------------------------
// Minimal local typings
// ---------------------------------------------------------------------------

/** Subset of the ReactRoot object returned by React 18's `createRoot()`. */
interface ReactRoot {
  render(element: unknown): void;
  unmount(): void;
}

// ---------------------------------------------------------------------------
// React 18 adapter
// ---------------------------------------------------------------------------

/**
 * Creates a {@link RendererAdapter} backed by React 18's concurrent root API.
 *
 * Uses `ReactDOM.createRoot()` which requires **React and react-dom ≥ 18**.
 * The opaque `root` handle returned by `mount()` is the `ReactRoot` object
 * produced by `createRoot()` — keep it alive for the lifetime of the widget.
 *
 * @example
 * ```ts
 * import { connectRenderer } from '@riot-jsx/base';
 * import { createReact18Renderer } from '@riot-jsx/react';
 *
 * const renderer = createReact18Renderer();
 * export default connectRenderer(MyWidget, { name: 'my-widget', renderer });
 * ```
 */
export function createReact18Renderer(): RendererAdapter<ReactRoot> {
  return {
    mount<Props extends object>(
      container: HTMLElement,
      Component: ComponentType<Props>,
      props: Props,
    ): ReactRoot {
      const root = createRoot(container);
      root.render(createElement(Component as React.FC<Props>, props));
      return root;
    },

    update<Props extends object>(
      root: ReactRoot,
      Component: ComponentType<Props>,
      props: Props,
    ): void {
      root.render(createElement(Component as React.FC<Props>, props));
    },

    unmount(root: ReactRoot): void {
      root.unmount();
    },
  };
}
