/**
 * Redux-related type definitions for `@riot-jsx/redux`.
 *
 * These are purposely minimal so the package does NOT introduce a hard
 * compile-time dependency on the `redux` package or any specific store type.
 * Users may pass their own fully-typed store; TypeScript infers `S`, `A` etc.
 * through generics on {@link connectRedux}.
 */

// ---------------------------------------------------------------------------
// Minimal Redux store interface
// ---------------------------------------------------------------------------

/**
 * A dispatch function accepting an action and returning the same action.
 * Parametrised so typed action unions flow through without casting.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReduxDispatch<A = any> = (action: A) => A;

/**
 * The minimal surface of a Redux store required by `@riot-jsx/redux`.
 * Compatible with both `redux` and `@reduxjs/toolkit` stores.
 */
export interface ReduxStore<S = unknown> {
  /** Returns the current state tree. */
  getState(): S;
  /** Dispatches an action to the store. */
  dispatch: ReduxDispatch;
  /**
   * Registers a change listener called after every dispatch.
   * @returns An unsubscribe function.
   */
  subscribe(listener: () => void): () => void;
}

// ---------------------------------------------------------------------------
// Mapping function types
// ---------------------------------------------------------------------------

/**
 * Maps the Redux state (plus the component's own Riot props) to a plain object
 * of props that will be merged into the JSX component's props.
 *
 * @template S          - Shape of the Redux state
 * @template OwnProps   - Props received from the parent Riot component
 * @template StateProps - Props this function produces
 */
export type MapStateToProps<
  S,
  OwnProps extends object,
  StateProps extends object,
> = (state: S, ownProps: OwnProps) => StateProps;

/**
 * Maps the Redux dispatch function (plus own props) to a plain object of
 * callback props (usually action creators bound to dispatch).
 *
 * @template OwnProps      - Props received from the parent Riot component
 * @template DispatchProps - Props (callbacks) this function produces
 */
export type MapDispatchToProps<
  OwnProps extends object,
  DispatchProps extends object,
> = (dispatch: ReduxDispatch, ownProps: OwnProps) => DispatchProps;
