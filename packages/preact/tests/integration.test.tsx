import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/preact';
import { h } from 'preact';
import { connectRenderer } from '@riot-jsx/base';
import type { RiotComponentWrapper, RiotInstance, RiotScope } from '@riot-jsx/base';
import { createPreactRenderer } from '../src/renderer.js';
import type { RiotSlotData } from '../src/slots.js';

// ---------------------------------------------------------------------------
// Helpers: minimal Riot mock
// ---------------------------------------------------------------------------

/**
 * Creates a minimal Riot-like orchestrator to exercise the full
 * connectRenderer + createPreactRenderer pipeline without requiring an
 * actual Riot installation in the test environment.
 */
type MockScope<Props extends Record<string, unknown>> = RiotScope<Props> & {
  update: ReturnType<typeof vi.fn>;
};

type MockMountedRiotInstance<Props extends Record<string, unknown>> =
  RiotInstance<Props> & {
    props: Props;
    update: ReturnType<typeof vi.fn>;
    unmount: ReturnType<typeof vi.fn>;
  };

function createDummyWrapper(): RiotComponentWrapper {
  return {
    name: 'dummy-tag',
    css: null,
    exports: {},
    template: () => ({
      createDOM: vi.fn().mockReturnThis(),
      mount: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      unmount: vi.fn().mockReturnThis(),
      clone: vi.fn().mockReturnThis(),
    }),
  };
}

function createMockRiotMount<Props extends Record<string, unknown>>(
  wrapper: RiotComponentWrapper,
) {
  const template = wrapper.template();
  let mounted = false;

  return {
    mount(element: HTMLElement, props: Props) {
      const scope: MockScope<Props> = {
        props,
        state: {},
        update: vi.fn((newState?: Record<string, unknown>) => {
          if (newState) Object.assign(scope.state, newState);
          template.update(scope);
        }),
      };
      template.mount(element, scope);
      mounted = true;
      return scope;
    },
    update(scope: MockScope<Props>, props: Props) {
      Object.assign(scope.props, props);
      template.update(scope);
    },
    unmount(scope: MockScope<Props>) {
      template.unmount(scope);
      mounted = false;
    },
    get isMounted() { return mounted; },
  };
}

// ---------------------------------------------------------------------------
// Integration tests: Preact component inside a Riot-style wrapper
// ---------------------------------------------------------------------------

describe('connectRenderer + createPreactRenderer (integration)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders a Preact component through the full Riot wrapper pipeline', () => {
    function Badge({ label }: { label: string }) {
      return h('span', { 'data-testid': 'badge' }, label);
    }

    const wrapper = connectRenderer(Badge, {
      name: 'test-badge',
      renderer: createPreactRenderer(),
    });

    const riotLike = createMockRiotMount(wrapper);
    act(() => { riotLike.mount(container, { label: 'Active' }); });

    expect(container.querySelector('[data-testid="badge"]')?.textContent).toBe('Active');
  });

  it('updates Preact component props when Riot scope changes', () => {
    function Score({ points }: { points: number }) {
      return h('p', { 'data-testid': 'score' }, `Points: ${points}`);
    }

    const wrapper = connectRenderer(Score, {
      name: 'test-score',
      renderer: createPreactRenderer(),
    });

    const riotLike = createMockRiotMount<{ points: number }>(wrapper);
    let scope!: MockScope<{ points: number }>;
    act(() => { scope = riotLike.mount(container, { points: 0 }); });

    expect(container.textContent).toContain('Points: 0');

    act(() => { riotLike.update(scope, { points: 100 }); });
    expect(container.textContent).toContain('Points: 100');
  });

  it('unmounts preact component cleanly', () => {
    function Marker() {
      return h('div', { 'data-testid': 'marker' }, 'visible');
    }

    const wrapper = connectRenderer(Marker, {
      name: 'test-marker',
      renderer: createPreactRenderer(),
    });

    const riotLike = createMockRiotMount<Record<string, never>>(wrapper);
    let scope!: MockScope<Record<string, never>>;
    act(() => { scope = riotLike.mount(container, {}); });

    expect(container.querySelector('[data-testid="marker"]')).not.toBeNull();

    act(() => { riotLike.unmount(scope); });
    expect(container.textContent).toBe('');
  });

  it('propsResolver maps riot scope to component props correctly', () => {
    function Double({ value }: { value: number }) {
      return h('span', { 'data-testid': 'result' }, String(value));
    }

    const wrapper = connectRenderer(Double, {
      name: 'test-double',
      renderer: createPreactRenderer(),
      propsResolver: (scope: RiotScope<{ n: number }>) => ({
        value: scope.props.n * 2,
      }),
    });

    const riotLike = createMockRiotMount<{ n: number }>(wrapper);
    act(() => { riotLike.mount(container, { n: 7 }); });

    expect(container.querySelector('[data-testid="result"]')?.textContent).toBe('14');
  });
});

// ---------------------------------------------------------------------------
// Tests: RiotMount component (Preact → Riot direction)
// ---------------------------------------------------------------------------
// NOTE: Full RiotMount integration requires the `riot` package at runtime.
// Here we verify the component behaviour with a mocked riot module.

describe('RiotMount component', () => {
  it('renders a container element', async () => {
    // Dynamically import with riot mocked (see RiotMount.test.tsx for full coverage)
    const { RiotMount } = await import('../src/RiotMount.js');
    const dummyWrapper = createDummyWrapper();

    // Without riot installed the component should still render the container
    const { container } = render(h(RiotMount, { component: dummyWrapper }));
    expect(container.firstElementChild?.tagName.toLowerCase()).toBe('div');
  });

  it('does not update the mounted Riot instance when parent rerenders without riotProps', async () => {
    vi.resetModules();

    const instance: MockMountedRiotInstance<Record<string, unknown>> = {
      props: {},
      update: vi.fn(),
      unmount: vi.fn(),
    };
    const mountFn = vi.fn((_element: HTMLElement, props: Record<string, unknown> = {}) => {
      instance.props = props;
      return instance;
    });

    vi.doMock('riot', () => ({
      component: vi.fn(() => mountFn),
    }));

    const { RiotMount } = await import('../src/RiotMount.js');
    const dummyWrapper = createDummyWrapper();

    function Host({ tick }: { tick: number }) {
      return h('div', null, h('span', null, String(tick)), h(RiotMount, { component: dummyWrapper }));
    }

    let rerender!: ReturnType<typeof render>['rerender'];
    await act(async () => {
      ({ rerender } = render(h(Host, { tick: 0 })));
    });

    expect(mountFn).toHaveBeenCalledTimes(1);
    expect(instance.update).not.toHaveBeenCalled();

    await act(async () => {
      rerender(h(Host, { tick: 1 }));
    });

    await act(async () => {
      rerender(h(Host, { tick: 2 }));
    });

    expect(instance.update).not.toHaveBeenCalled();
    vi.doUnmock('riot');
    vi.resetModules();
  });

  it('updates the mounted Riot instance only when riotProps identity changes', async () => {
    vi.resetModules();

    interface TimerProps {
      seconds: number;
    }

    const initialProps: TimerProps = { seconds: 10 };
    const nextProps: TimerProps = { seconds: 20 };
    const instance: MockMountedRiotInstance<TimerProps> = {
      props: initialProps,
      update: vi.fn(),
      unmount: vi.fn(),
    };
    const mountFn = vi.fn((_element: HTMLElement, props: TimerProps) => {
      instance.props = props;
      return instance;
    });

    vi.doMock('riot', () => ({
      component: vi.fn(() => mountFn),
    }));

    const { RiotMount } = await import('../src/RiotMount.js');
    const dummyWrapper = createDummyWrapper();

    let rerender!: ReturnType<typeof render>['rerender'];
    await act(async () => {
      ({ rerender } = render(h(RiotMount, { component: dummyWrapper, riotProps: initialProps })));
    });

    expect(mountFn).toHaveBeenCalledTimes(1);
    expect(instance.update).not.toHaveBeenCalled();

    await act(async () => {
      rerender(h(RiotMount, { component: dummyWrapper, riotProps: initialProps }));
    });

    expect(instance.update).not.toHaveBeenCalled();

    await act(async () => {
      rerender(h(RiotMount, { component: dummyWrapper, riotProps: nextProps }));
    });

    expect(instance.props).toEqual(nextProps);
    expect(instance.props).not.toBe(nextProps);
    expect(instance.update).toHaveBeenCalledTimes(1);
    vi.doUnmock('riot');
    vi.resetModules();
  });

  it('snapshots riotProps before mount and update', async () => {
    vi.resetModules();

    interface TotalsProps {
      total: number;
      nested: { value: number };
    }

    const sourceProps: TotalsProps = { total: 1, nested: { value: 1 } };
    const nextProps: TotalsProps = { total: 2, nested: { value: 2 } };
    const instance: MockMountedRiotInstance<TotalsProps> = {
      props: {},
      update: vi.fn(),
      unmount: vi.fn(),
    };
    const mountFn = vi.fn((_element: HTMLElement, props: TotalsProps) => {
      instance.props = props;
      return instance;
    });

    vi.doMock('riot', () => ({
      component: vi.fn(() => mountFn),
    }));

    const { RiotMount } = await import('../src/RiotMount.js');
    const dummyWrapper = createDummyWrapper();

    let rerender!: ReturnType<typeof render>['rerender'];
    await act(async () => {
      ({ rerender } = render(h(RiotMount, { component: dummyWrapper, riotProps: sourceProps })));
    });

    expect(instance.props).toEqual({ total: 1, nested: { value: 1 } });
    expect(instance.props).not.toBe(sourceProps);
    expect(Object.isFrozen(instance.props)).toBe(true);
    expect(Object.isFrozen(instance.props.nested)).toBe(true);

    sourceProps.total = 10;
    sourceProps.nested.value = 10;

    expect(instance.props).toEqual({ total: 1, nested: { value: 1 } });

    await act(async () => {
      rerender(h(RiotMount, { component: dummyWrapper, riotProps: nextProps }));
    });

    expect(instance.props).toEqual({ total: 2, nested: { value: 2 } });
    expect(instance.props).not.toBe(nextProps);

    nextProps.total = 20;
    nextProps.nested.value = 20;

    expect(instance.props).toEqual({ total: 2, nested: { value: 2 } });
    expect(instance.update).toHaveBeenCalledTimes(1);
    vi.doUnmock('riot');
    vi.resetModules();
  });

  it('passes children as Riot slots and remounts when slot markup changes', async () => {
    vi.resetModules();

    const instances: Array<MockMountedRiotInstance<Record<string, unknown>>> = [];
    const metas: Array<{ slots?: RiotSlotData[] } | undefined> = [];
    const mountFn = vi.fn(
      (
        _element: HTMLElement,
        props: Record<string, unknown> = {},
        meta?: { slots?: RiotSlotData[] },
      ) => {
        const instance: MockMountedRiotInstance<Record<string, unknown>> = {
          props,
          update: vi.fn(),
          unmount: vi.fn(),
        };

        instances.push(instance);
        metas.push(meta);
        return instance;
      },
    );

    vi.doMock('riot', () => ({
      component: vi.fn(() => mountFn),
    }));

    const { RiotMount } = await import('../src/RiotMount.js');
    const dummyWrapper = createDummyWrapper();

    let rerender!: ReturnType<typeof render>['rerender'];
    await act(async () => {
      ({ rerender } = render(
        h(
          RiotMount,
          { component: dummyWrapper },
          h('span', null, 'Body'),
          h('strong', { slot: 'title' }, 'Title'),
        ),
      ));
    });

    expect(mountFn).toHaveBeenCalledTimes(1);
    expect(metas[0]?.slots).toEqual([
      { id: 'default', html: '<span>Body</span>', bindings: [] },
      { id: 'title', html: '<strong>Title</strong>', bindings: [] },
    ]);

    await act(async () => {
      rerender(
        h(
          RiotMount,
          { component: dummyWrapper },
          h('span', null, 'Body'),
          h('strong', { slot: 'title' }, 'Title'),
        ),
      );
    });

    expect(mountFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender(
        h(
          RiotMount,
          { component: dummyWrapper },
          h('span', null, 'Updated'),
          h('strong', { slot: 'title' }, 'Title'),
        ),
      );
    });

    expect(mountFn).toHaveBeenCalledTimes(2);
    expect(instances[0].unmount).toHaveBeenCalledWith(true);
    expect(instances[0].update).not.toHaveBeenCalled();
    expect(metas[1]?.slots).toEqual([
      { id: 'default', html: '<span>Updated</span>', bindings: [] },
      { id: 'title', html: '<strong>Title</strong>', bindings: [] },
    ]);
    vi.doUnmock('riot');
    vi.resetModules();
  });
});
