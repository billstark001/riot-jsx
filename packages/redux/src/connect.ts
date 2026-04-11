import { connectRenderer } from '@riot-jsx/base';
import type {
  ComponentType,
  ConnectOptions,
  RiotComponentWrapper,
  RiotScope,
} from '@riot-jsx/base';
import type {
  ReduxStore,
  MapStateToProps,
  MapDispatchToProps,
} from './types.js';

// ---------------------------------------------------------------------------
// Options type
// ---------------------------------------------------------------------------

/**
 * Configuration for {@link connectRedux}.
 *
 * Extends {@link ConnectOptions} (from `@riot-jsx/base`) with Redux-specific
 * fields.  The `propsResolver` option from `ConnectOptions` is intentionally
 * omitted — `connectRedux` derives it from `mapStateToProps` /
 * `mapDispatchToProps` instead.
 */
export interface ReduxConnectOptions<
  S,
  OwnProps extends Record<string, unknown>,
  StateProps extends Record<string, unknown>,
  DispatchProps extends Record<string, unknown>,
> extends Omit<ConnectOptions<OwnProps & StateProps & DispatchProps>, 'propsResolver'> {
  /**
   * Returns the Redux store instance.
   * Passing a getter (rather than the store directly) makes the connector
   * easier to test and avoids circular-import issues during module evaluation.
   */
  getStore: () => ReduxStore<S>;
  /**
   * Maps Redux state (and own Riot props) to additional JSX component props.
   * If omitted, no state-derived props are merged.
   */
  mapStateToProps?: MapStateToProps<S, OwnProps, StateProps>;
  /**
   * Maps Redux dispatch (and own Riot props) to callback props.
   * If omitted, no dispatch props are merged.
   */
  mapDispatchToProps?: MapDispatchToProps<OwnProps, DispatchProps>;
}

// ---------------------------------------------------------------------------
// connectRedux
// ---------------------------------------------------------------------------

/**
 * Creates a Riot component wrapper that renders a JSX component and keeps it
 * in sync with a Redux store.
 *
 * ### Props merge order (highest priority first)
 * `dispatchProps` > `stateProps` > `ownProps` (Riot props from parent)
 *
 * ### Redux lifecycle
 * - **`onBeforeMount`** — subscribes to the store; re-renders (`this.update()`)
 *   on every dispatch.
 * - **`onUnmounted`** — unsubscribes from the store.
 *
 * If the component wrapper already defines `onBeforeMount` or `onUnmounted`
 * (e.g. set in `options.exports`), those are composed — the existing hook
 * fires first.
 *
 * @param Component - A Preact or React function component
 * @param options   - Extended options including Redux wiring
 * @returns A {@link RiotComponentWrapper} compatible with Riot 4+
 *
 * @example
 * ```ts
 * import { connectRedux } from '@riot-jsx/redux';
 * import { createPreactRenderer } from '@riot-jsx/preact';
 * import { MyCounter } from './MyCounter.jsx';
 * import { store } from './store.js';
 *
 * export default connectRedux(MyCounter, {
 *   name: 'my-counter',
 *   renderer: createPreactRenderer(),
 *   getStore: () => store,
 *   mapStateToProps: (state) => ({ count: state.counter.value }),
 *   mapDispatchToProps: (dispatch) => ({
 *     increment: () => dispatch({ type: 'counter/increment' }),
 *     decrement: () => dispatch({ type: 'counter/decrement' }),
 *   }),
 * });
 * ```
 */
export function connectRedux<
  S,
  OwnProps extends Record<string, unknown> = Record<string, unknown>,
  StateProps extends Record<string, unknown> = Record<string, unknown>,
  DispatchProps extends Record<string, unknown> = Record<string, unknown>,
>(
  Component: ComponentType<OwnProps & StateProps & DispatchProps>,
  options: ReduxConnectOptions<S, OwnProps, StateProps, DispatchProps>,
): RiotComponentWrapper {
  const { getStore, mapStateToProps, mapDispatchToProps, ...baseOptions } = options;

  // ------------------------------------------------------------------
  // Props resolver: called on every mount/update with the current scope
  // ------------------------------------------------------------------
  function resolveProps(scope: RiotScope): OwnProps & StateProps & DispatchProps {
    const ownProps = (scope.props ?? {}) as OwnProps;
    const store = getStore();
    const state = store.getState();

    const stateProps: StateProps = mapStateToProps
      ? mapStateToProps(state, ownProps)
      : ({} as StateProps);

    const dispatchProps: DispatchProps = mapDispatchToProps
      ? mapDispatchToProps(store.dispatch, ownProps)
      : ({} as DispatchProps);

    // Priority: dispatchProps > stateProps > ownProps (mirrors react-redux)
    return { ...ownProps, ...stateProps, ...dispatchProps };
  }

  // ------------------------------------------------------------------
  // Build the base wrapper via connectRenderer
  // ------------------------------------------------------------------
  const wrapper = connectRenderer(
    Component as ComponentType,
    { ...baseOptions, propsResolver: resolveProps },
  );

  // ------------------------------------------------------------------
  // Capture any existing lifecycle hooks so we can compose them
  // ------------------------------------------------------------------
  type ScopePlus = RiotScope & { _rxUnsub?: () => void };

  const existingOnBeforeMount = wrapper.exports?.onBeforeMount as
    | ((this: ScopePlus, ...args: unknown[]) => void)
    | undefined;

  const existingOnUnmounted = wrapper.exports?.onUnmounted as
    | ((this: ScopePlus, ...args: unknown[]) => void)
    | undefined;

  // ------------------------------------------------------------------
  // Attach Redux subscription lifecycle hooks
  // ------------------------------------------------------------------
  wrapper.exports = {
    ...wrapper.exports,

    onBeforeMount(
      this: ScopePlus,
      props: Record<string, unknown>,
      state: Record<string, unknown>,
    ) {
      existingOnBeforeMount?.call(this, props, state);
      // Subscribe: trigger a Riot re-render on every store change
      this._rxUnsub = getStore().subscribe(() => {
        this.update();
      });
    },

    onUnmounted(
      this: ScopePlus,
      props: Record<string, unknown>,
      state: Record<string, unknown>,
    ) {
      existingOnUnmounted?.call(this, props, state);
      if (this._rxUnsub) {
        this._rxUnsub();
        this._rxUnsub = undefined;
      }
    },
  };

  return wrapper;
}
