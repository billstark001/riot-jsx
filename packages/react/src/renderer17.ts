import { createElement } from 'react';
import * as ReactDOM from 'react-dom';
import type { RendererAdapter, ComponentType } from '@riot-jsx/base';

type LegacyReactDOM = typeof ReactDOM & {
  render(element: unknown, container: HTMLElement): void;
  unmountComponentAtNode(container: HTMLElement): void;
};

const legacyReactDOM = ReactDOM as LegacyReactDOM;

// ---------------------------------------------------------------------------
// React 16 / 17 adapter
// ---------------------------------------------------------------------------

/**
 * Creates a {@link RendererAdapter} backed by React 16/17's legacy render API.
 *
 * Uses `ReactDOM.render()` which is available in **React 16 and 17** (marked
 * deprecated in React 18, removed in React 19).  The opaque root handle is
 * the container `HTMLElement`; React tracks its fiber tree on it internally.
 *
 * For React 18+ use {@link createReact18Renderer} instead.
 *
 * @example
 * ```ts
 * import { connectRenderer } from '@riot-jsx/base';
 * import { createReact17Renderer } from '@riot-jsx/react';
 *
 * const renderer = createReact17Renderer();
 * export default connectRenderer(MyWidget, { name: 'my-widget', renderer });
 * ```
 */
export function createReact17Renderer(): RendererAdapter<HTMLElement> {
  return {
    mount<Props extends object>(
      container: HTMLElement,
      Component: ComponentType<Props>,
      props: Props,
    ): HTMLElement {
      legacyReactDOM.render(
        createElement(Component as React.FC<Props>, props),
        container,
      );
      return container;
    },

    update<Props extends object>(
      root: HTMLElement,
      Component: ComponentType<Props>,
      props: Props,
    ): void {
      legacyReactDOM.render(
        createElement(Component as React.FC<Props>, props),
        root,
      );
    },

    unmount(root: HTMLElement): void {
      legacyReactDOM.unmountComponentAtNode(root);
    },
  };
}
