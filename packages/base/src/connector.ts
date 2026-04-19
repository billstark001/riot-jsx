import type {
  ComponentType,
  ConnectOptions,
  PropsResolver,
  RiotComponentWrapper,
} from './types.js';
import { makeTemplateFactory } from './template.js';

/**
 * Wraps a JSX function component (Preact or React) as a standard Riot
 * component wrapper that can be passed directly to `riot.register()` or
 * `riot.component()`.
 *
 * The resulting wrapper is indistinguishable from one produced by the Riot
 * compiler from a `.riot` source file: it has a `name`, optionally `css`, an
 * `exports` object with lifecycle hooks, and a `template` factory.
 *
 * @param Component - A Preact or React function component
 * @param options   - Configuration (tag name, renderer adapter, css, …)
 * @returns A {@link RiotComponentWrapper} compatible with Riot 4+
 *
 * @example
 * ```ts
 * import { connectRenderer } from '@riot-jsx/base';
 * import { createPreactRenderer } from '@riot-jsx/preact';
 * import { MyWidget } from './MyWidget.jsx';
 *
 * const renderer = createPreactRenderer();
 *
 * export default connectRenderer(MyWidget, {
 *   name: 'my-widget',
 *   renderer,
 *   css: `.title { font-size: 1.5rem; }`,
 * });
 * ```
 */
export function connectRenderer<Props extends object>(
  Component: ComponentType<Props>,
  options: ConnectOptions<Props>,
): RiotComponentWrapper {
  const { name, renderer, css = null } = options;

  if (!name || !name.includes('-')) {
    throw new Error(
      `[connectRenderer] "name" must be a valid custom-element tag name ` +
        `(must contain a hyphen, e.g. "my-widget"). Received: "${String(name)}"`,
    );
  }

  if (!renderer || typeof renderer.mount !== 'function') {
    throw new Error(
      '[connectRenderer] options.renderer is required and must implement RendererAdapter.',
    );
  }

  const resolveProps: PropsResolver<Props> =
    options.propsResolver ?? ((scope) => scope.props as Props);

  return {
    name,
    css,
    exports: {},
    template: makeTemplateFactory(renderer, Component, resolveProps),
  };
}
