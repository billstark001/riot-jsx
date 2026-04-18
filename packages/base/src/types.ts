/**
 * Core type definitions shared across all riot-jsx packages.
 *
 * These represent the minimal interfaces Riot's runtime expects from a component
 * wrapper produced by `@riotjs/compiler`, plus the renderer adapter contract
 * that this library uses to plug in Preact, React, or any other JSX renderer.
 */

// ---------------------------------------------------------------------------
// Riot-side interfaces
// ---------------------------------------------------------------------------

/**
 * The scope object Riot passes to every template lifecycle method.
 * It represents the component instance (`this`) at the point of the call.
 */
export interface RiotScope {
  /** External props received from a parent component or from `riot.component()`. */
  readonly props: Record<string, unknown>;
  /** Internal component state managed by `this.update()`. */
  readonly state: Record<string, unknown>;
  /** Schedules an incremental re-render with an optional partial state merge. */
  readonly update: (newState?: Record<string, unknown>) => void;
  /** Allows lifecycle methods stored on the instance. */
  [key: string]: unknown;
}

/**
 * The template object returned by a Riot component's template factory.
 * Riot calls these methods at specific points in the component lifecycle.
 *
 * This interface is intentionally minimal — it mirrors riot's internal
 * `RiotComponentTemplate` contract without requiring riot as a dependency.
 */
export interface RiotComponentTemplate {
  /**
   * Called by Riot v9+ to prepare the DOM structure before mounting.
   * Implementations should perform any one-time DOM setup here and return
   * `this` so that Riot can immediately call `.clone()` on the result.
   */
  createDOM(element: HTMLElement): RiotComponentTemplate;
  /** Called once to initialise the component inside `element`. */
  mount(element: HTMLElement, scope: RiotScope): RiotComponentTemplate;
  /** Called whenever state or props change to refresh the rendered output. */
  update(scope: RiotScope): RiotComponentTemplate;
  /**
   * Called when the component is removed from the DOM.
   * @param keepRootElement - When `true` Riot leaves the root element in place
   *   (used by parent un-mounters that manage the container themselves).
   */
  unmount(scope: RiotScope, keepRootElement?: boolean): RiotComponentTemplate;
  /**
   * Returns a brand-new, independent template instance.
   * Riot's `each` binding calls this method to obtain per-item templates;
   * implementations MUST NOT share mutable state between clones.
   */
  clone(): RiotComponentTemplate;
}

/**
 * Lifecycle hooks and initial state that are merged into the component instance.
 * Any additional properties (e.g. Redux unsubscribe handles) should be typed
 * explicitly by sub-packages.
 */
export interface RiotComponentExports {
  onBeforeMount?: (
    this: RiotScope,
    props: Record<string, unknown>,
    state: Record<string, unknown>,
  ) => void;
  onMounted?: (
    this: RiotScope,
    props: Record<string, unknown>,
    state: Record<string, unknown>,
  ) => void;
  onBeforeUpdate?: (
    this: RiotScope,
    props: Record<string, unknown>,
    state: Record<string, unknown>,
  ) => void;
  onUpdated?: (
    this: RiotScope,
    props: Record<string, unknown>,
    state: Record<string, unknown>,
  ) => void;
  onBeforeUnmount?: (
    this: RiotScope,
    props: Record<string, unknown>,
    state: Record<string, unknown>,
  ) => void;
  onUnmounted?: (
    this: RiotScope,
    props: Record<string, unknown>,
    state: Record<string, unknown>,
  ) => void;
  [key: string]: unknown;
}
/**
 * The component instance object returned by mounting a Riot template.
 * Riot calls `update()` and `unmount()` on this object to drive the lifecycle.
 */
export interface RiotInstance {
  /** Schedules an incremental re-render with an optional partial state merge. */
  update(state?: Record<string, unknown>): void;
  /** Unmounts the component and frees all associated resources. */
  unmount(keepRootElement?: boolean): void;
}

/**
 * The compiled component wrapper object that `riot.register()` and
 * `riot.component()` accept.  This is the shape produced by `@riotjs/compiler`
 * from a `.riot` source file, and what this library produces from JSX.
 */
export interface RiotComponentWrapper {
  /** Custom-element tag name — must contain at least one hyphen. */
  name: string;
  /**
   * Scoped CSS string.  Riot's built-in CSS manager injects this into a
   * `<style>` element and automatically prefixes every rule with
   * `[is="<name>"]` so styles are naturally scoped to the component.
   *
   * For CSS that uses `&` nesting, pre-process it with {@link scopeCSSWithStylis}
   * (or another tool) before passing here.
   */
  css?: string | null;
  /** Lifecycle hooks and state mixed into the component instance. */
  exports?: RiotComponentExports;
  /**
   * Template factory: called once per component definition.
   * Returns a {@link RiotComponentTemplate} that drives the DOM.
   */
  template: () => RiotComponentTemplate;
}

// ---------------------------------------------------------------------------
// Renderer adapter interface
// ---------------------------------------------------------------------------

/**
 * A generic JSX component type compatible with both React and Preact function
 * components.  The `Root` type parameter is the opaque handle each renderer
 * returns from `mount()` and passes back to `update()` / `unmount()`.
 */
export type ComponentType<P extends Record<string, unknown> = Record<string, unknown>> = (
  props: P,
) => unknown;

/**
 * Adapter that abstracts a specific JSX renderer (Preact, React 18, React 17…).
 *
 * The type parameter `Root` is the opaque handle returned by `mount()` and
 * consumed by subsequent `update()` and `unmount()` calls.
 * - For Preact this is the container `HTMLElement` itself.
 * - For React 18 this is the `ReactRoot` object from `createRoot()`.
 * - For React 16/17 this is the container `HTMLElement`.
 *
 * Each `mount()` / `update()` call infers its own props shape from the JSX
 * component passed in, so a single renderer instance can safely drive multiple
 * components with different prop types.
 */
export interface RendererAdapter<Root = unknown> {
  /**
   * Render `Component` with `props` into `container`.
   * @returns An opaque root handle for subsequent update/unmount calls.
   */
  mount<Props extends Record<string, unknown>>(
    container: HTMLElement,
    Component: ComponentType<Props>,
    props: Props,
  ): Root;
  /** Re-render with new props (diff/patch only what changed). */
  update<Props extends Record<string, unknown>>(
    root: Root,
    Component: ComponentType<Props>,
    props: Props,
  ): void;
  /** Tear down the component tree and free all associated resources. */
  unmount(root: Root): void;
}

// ---------------------------------------------------------------------------
// ConnectRenderer options
// ---------------------------------------------------------------------------

/**
 * A function that derives JSX component props from the current Riot scope.
 * Called on every `mount` and `update`.
 */
export type PropsResolver<Props extends Record<string, unknown> = Record<string, unknown>> = (
  scope: RiotScope,
) => Props;

/**
 * Configuration options for {@link connectRenderer}.
 */
export interface ConnectOptions<Props extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Riot custom-element tag name.
   * Must contain at least one hyphen (e.g. `"my-widget"`).
   */
  name: string;
  /**
   * The renderer adapter to use (e.g. from `@riot-jsx/preact` or
   * `@riot-jsx/react`).
   */
  renderer: RendererAdapter;
  /**
   * Optional scoped CSS string passed verbatim to Riot's CSS manager.
   * Riot adds the `[is="<name>"]` scope prefix automatically.
   */
  css?: string | null;
  /**
   * Maps the Riot scope (`props`, `state`, lifecycle methods) to the props
   * that will be passed into the JSX component.
   *
   * Defaults to `(scope) => scope.props` — i.e. Riot's own props are
   * forwarded unchanged.
   */
  propsResolver?: PropsResolver<Props>;
}
