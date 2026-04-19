import type {
  ComponentType,
  RendererAdapter,
  RiotComponentTemplate,
  RiotScope,
  PropsResolver,
} from './types.js';

/**
 * Creates a Riot template factory backed by an arbitrary JSX renderer adapter.
 *
 * The factory pattern is necessary because Riot's `each` binding calls
 * `clone()` to produce independent per-item template instances.  Each
 * invocation of the returned factory creates a fresh, isolated instance with
 * its own renderer `root` handle — so list items never share DOM state.
 *
 * ## Lifecycle mapping
 *
 * | Riot call             | Renderer adapter call  |
 * |-----------------------|------------------------|
 * | `template.mount()`    | `renderer.mount()`     |
 * | `template.update()`   | `renderer.update()`    |
 * | `template.unmount()`  | `renderer.unmount()`   |
 * | `template.clone()`    | new factory invocation |
 *
 * @param renderer     - A {@link RendererAdapter} (e.g. Preact, React 18/17)
 * @param Component    - The JSX function component to render
 * @param resolveProps - Derives component props from the current Riot scope
 * @returns A zero-argument factory `() => RiotComponentTemplate`
 */
export function makeTemplateFactory<
  Root,
  Props extends object,
>(
  renderer: RendererAdapter<Root>,
  Component: ComponentType<Props>,
  resolveProps: PropsResolver<Props>,
): () => RiotComponentTemplate {
  return function templateFactory(): RiotComponentTemplate {
    /** Opaque root handle returned by the renderer; null when not mounted. */
    let _root: Root | null = null;

    const template: RiotComponentTemplate = {
      createDOM(_element: HTMLElement): RiotComponentTemplate {
        // Riot v9 calls createDOM(element).clone() before mount().
        // The JSX renderer manages its own DOM during mount(), so no
        // DOM preparation is needed here.  Return self so that Riot's
        // subsequent `.clone()` call produces an independent instance.
        return template;
      },

      mount(element: HTMLElement, scope: RiotScope): RiotComponentTemplate {
        _root = renderer.mount(element, Component, resolveProps(scope));
        return template;
      },

      update(scope: RiotScope): RiotComponentTemplate {
        if (_root !== null) {
          renderer.update(_root, Component, resolveProps(scope));
        }
        return template;
      },

      unmount(_scope: RiotScope, _keepRootElement?: boolean): RiotComponentTemplate {
        if (_root !== null) {
          renderer.unmount(_root);
          _root = null;
        }
        return template;
      },

      clone(): RiotComponentTemplate {
        // Return a fully independent instance — MUST NOT share _root.
        return makeTemplateFactory(renderer, Component, resolveProps)();
      },
    };

    return template;
  };
}
