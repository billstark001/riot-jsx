import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from 'redux';
import { connectRedux } from '../src/connect.js';
import type { RendererAdapter, RiotScope } from '@riot-jsx/base';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CounterState {
  value: number;
}

type CounterAction = { type: 'increment' } | { type: 'decrement' } | { type: 'reset' };

function counterReducer(
  state: CounterState = { value: 0 },
  action: CounterAction,
): CounterState {
  switch (action.type) {
    case 'increment': return { value: state.value + 1 };
    case 'decrement': return { value: state.value - 1 };
    case 'reset':     return { value: 0 };
    default:          return state;
  }
}

function makeStore() {
  return createStore(counterReducer);
}

function makeRenderer(): RendererAdapter<HTMLElement> {
  return {
    mount: vi.fn((c: HTMLElement) => c),
    update: vi.fn(),
    unmount: vi.fn(),
  };
}

function makeScope(props: Record<string, unknown> = {}): RiotScope & { _rxUnsub?: () => void } {
  const scope: RiotScope & { _rxUnsub?: () => void } = {
    props,
    state: {},
    update: vi.fn(),
  };
  return scope;
}

const noop = () => null;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('connectRedux', () => {
  it('returns a RiotComponentWrapper with correct name', () => {
    const renderer = makeRenderer();
    const store = makeStore();
    const wrapper = connectRedux(noop, {
      name: 'my-counter',
      renderer,
      getStore: () => store,
    });
    expect(wrapper.name).toBe('my-counter');
  });

  it('exports has onBeforeMount and onUnmounted lifecycle hooks', () => {
    const renderer = makeRenderer();
    const store = makeStore();
    const wrapper = connectRedux(noop, {
      name: 'my-counter',
      renderer,
      getStore: () => store,
    });
    expect(typeof wrapper.exports?.onBeforeMount).toBe('function');
    expect(typeof wrapper.exports?.onUnmounted).toBe('function');
  });

  it('onBeforeMount subscribes to the store', () => {
    const renderer = makeRenderer();
    const subscribeSpy = vi.spyOn(makeStore(), 'subscribe');
    const store = makeStore();
    store.subscribe = subscribeSpy;
    const wrapper = connectRedux(noop, {
      name: 'my-counter',
      renderer,
      getStore: () => store,
    });

    const scope = makeScope();
    wrapper.exports?.onBeforeMount?.call(scope, {}, {});
    expect(subscribeSpy).toHaveBeenCalledOnce();
    // Clean up
    wrapper.exports?.onUnmounted?.call(scope, {}, {});
  });

  it('store dispatch triggers update() on the component instance', () => {
    const renderer = makeRenderer();
    const store = makeStore();
    const wrapper = connectRedux(noop, {
      name: 'my-counter',
      renderer,
      getStore: () => store,
    });

    const scope = makeScope();
    wrapper.exports?.onBeforeMount?.call(scope, {}, {});

    store.dispatch({ type: 'increment' });
    expect(scope.update).toHaveBeenCalledOnce();

    store.dispatch({ type: 'increment' });
    expect(scope.update).toHaveBeenCalledTimes(2);

    // Clean up
    wrapper.exports?.onUnmounted?.call(scope, {}, {});
  });

  it('onUnmounted unsubscribes from the store', () => {
    const renderer = makeRenderer();
    const store = makeStore();
    const wrapper = connectRedux(noop, {
      name: 'my-counter',
      renderer,
      getStore: () => store,
    });

    const scope = makeScope();
    wrapper.exports?.onBeforeMount?.call(scope, {}, {});
    wrapper.exports?.onUnmounted?.call(scope, {}, {});

    // After unsubscribe, update() should NOT be called
    store.dispatch({ type: 'increment' });
    expect(scope.update).not.toHaveBeenCalled();
  });

  it('mapStateToProps results are merged into component props', () => {
    const renderer = makeRenderer();
    const store = makeStore();
    store.dispatch({ type: 'increment' });
    store.dispatch({ type: 'increment' });

    const wrapper = connectRedux(noop, {
      name: 'my-counter',
      renderer,
      getStore: () => store,
      mapStateToProps: (state: CounterState) => ({ count: state.value }),
    });

    const template = wrapper.template();
    const el = document.createElement('div');
    const scope = makeScope();
    template.mount(el, scope);

    expect(renderer.mount).toHaveBeenCalledWith(
      el,
      expect.any(Function),
      expect.objectContaining({ count: 2 }),
    );
  });

  it('mapDispatchToProps results are merged into component props', () => {
    const renderer = makeRenderer();
    const store = makeStore();

    const wrapper = connectRedux(noop, {
      name: 'my-counter',
      renderer,
      getStore: () => store,
      mapDispatchToProps: (dispatch) => ({
        increment: () => dispatch({ type: 'increment' }),
      }),
    });

    const template = wrapper.template();
    const el = document.createElement('div');
    const scope = makeScope();
    template.mount(el, scope);

    const mountProps = (renderer.mount as ReturnType<typeof vi.fn>).mock.calls[0][2] as Record<string, unknown>;
    expect(typeof mountProps['increment']).toBe('function');
  });

  it('prop priority: dispatchProps > stateProps > ownProps', () => {
    const renderer = makeRenderer();
    const store = makeStore();

    const wrapper = connectRedux(noop, {
      name: 'my-counter',
      renderer,
      getStore: () => store,
      mapStateToProps: (_state: CounterState, ownProps) => ({
        label: 'from-state',
        base: (ownProps['base'] as number) * 2,
      }),
      mapDispatchToProps: () => ({
        label: 'from-dispatch', // should win
      }),
    });

    const template = wrapper.template();
    const el = document.createElement('div');
    template.mount(el, makeScope({ label: 'from-own', base: 5 }));

    const props = (renderer.mount as ReturnType<typeof vi.fn>).mock.calls[0][2] as Record<string, unknown>;
    expect(props['label']).toBe('from-dispatch'); // dispatchProps wins
    expect(props['base']).toBe(10); // stateProps wins over ownProps
  });

  it('multiple instances subscribe/unsubscribe independently', () => {
    const renderer = makeRenderer();
    const store = makeStore();
    const wrapper = connectRedux(noop, {
      name: 'my-counter',
      renderer,
      getStore: () => store,
    });

    const scopeA = makeScope();
    const scopeB = makeScope();

    wrapper.exports?.onBeforeMount?.call(scopeA, {}, {});
    wrapper.exports?.onBeforeMount?.call(scopeB, {}, {});

    store.dispatch({ type: 'increment' });
    expect(scopeA.update).toHaveBeenCalledOnce();
    expect(scopeB.update).toHaveBeenCalledOnce();

    // Unmount A — B should still receive updates
    wrapper.exports?.onUnmounted?.call(scopeA, {}, {});
    store.dispatch({ type: 'increment' });
    expect(scopeA.update).toHaveBeenCalledTimes(1); // no new calls
    expect(scopeB.update).toHaveBeenCalledTimes(2);

    wrapper.exports?.onUnmounted?.call(scopeB, {}, {});
  });
});
