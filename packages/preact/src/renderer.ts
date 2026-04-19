import { h, render } from 'preact';
import type { RendererAdapter, ComponentType } from '@riot-jsx/base';

/**
 * Creates a {@link RendererAdapter} backed by Preact.
 *
 * Preact's `render(vnode, container)` performs an efficient in-place diff of
 * the current DOM.  Calling it again with new props (in `update`) produces an
 * incremental patch — no full re-render.  Calling it with `null` (in
 * `unmount`) tears down the component tree and releases all resources.
 *
 * The `root` returned by `mount()` is simply the container `HTMLElement`
 * itself, since Preact attaches its internal fiber tree directly to the
 * container node.
 *
 * @returns A `RendererAdapter<HTMLElement>` ready for use with
 *   {@link connectRenderer} from `@riot-jsx/base`.
 *
 * @example
 * ```ts
 * import { connectRenderer } from '@riot-jsx/base';
 * import { createPreactRenderer } from '@riot-jsx/preact';
 *
 * const renderer = createPreactRenderer();
 *
 * export default connectRenderer(MyWidget, { name: 'my-widget', renderer });
 * ```
 */
export function createPreactRenderer(): RendererAdapter<HTMLElement> {
  return {
    mount<Props extends object>(
      container: HTMLElement,
      Component: ComponentType<Props>,
      props: Props,
    ): HTMLElement {
      render(h(Component as Parameters<typeof h>[0], props), container);
      return container;
    },

    update<Props extends object>(
      root: HTMLElement,
      Component: ComponentType<Props>,
      props: Props,
    ): void {
      render(h(Component as Parameters<typeof h>[0], props), root);
    },

    unmount(root: HTMLElement): void {
      // Passing null signals Preact to unmount the current tree
      render(null, root);
    },
  };
}
