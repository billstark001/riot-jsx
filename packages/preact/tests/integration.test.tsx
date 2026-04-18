import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/preact';
import { h } from 'preact';
import { connectRenderer } from '@riot-jsx/base';
import { createPreactRenderer } from '../src/renderer.js';

// ---------------------------------------------------------------------------
// Helpers: minimal Riot mock
// ---------------------------------------------------------------------------

/**
 * Creates a minimal Riot-like orchestrator to exercise the full
 * connectRenderer + createPreactRenderer pipeline without requiring an
 * actual Riot installation in the test environment.
 */
function createMockRiotMount(wrapper: ReturnType<typeof connectRenderer>) {
  const template = wrapper.template();
  let mounted = false;

  return {
    mount(element: HTMLElement, props: Record<string, unknown> = {}) {
      const scope = {
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
    update(scope: ReturnType<ReturnType<typeof createMockRiotMount>['mount']>, props: Record<string, unknown>) {
      Object.assign(scope.props, props);
      template.update(scope);
    },
    unmount(scope: ReturnType<ReturnType<typeof createMockRiotMount>['mount']>) {
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

    const riotLike = createMockRiotMount(wrapper);
    let scope!: ReturnType<ReturnType<typeof createMockRiotMount>['mount']>;
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

    const riotLike = createMockRiotMount(wrapper);
    let scope!: ReturnType<ReturnType<typeof createMockRiotMount>['mount']>;
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
      propsResolver: (scope) => ({ value: (scope.props['n'] as number) * 2 }),
    });

    const riotLike = createMockRiotMount(wrapper);
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

    const dummyWrapper: ReturnType<typeof connectRenderer> = {
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

    // Without riot installed the component should still render the container
    const { container } = render(h(RiotMount, { component: dummyWrapper }));
    expect(container.firstElementChild?.tagName.toLowerCase()).toBe('div');
  });

  it('does not update the mounted Riot instance when parent rerenders without riotProps', async () => {
    vi.resetModules();

    const instance = {
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

    const dummyWrapper: ReturnType<typeof connectRenderer> = {
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

    const initialProps = { seconds: 10 };
    const nextProps = { seconds: 20 };
    const instance = {
      props: initialProps,
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

    const dummyWrapper: ReturnType<typeof connectRenderer> = {
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

    expect(instance.props).toBe(nextProps);
    expect(instance.update).toHaveBeenCalledTimes(1);
    vi.doUnmock('riot');
    vi.resetModules();
  });
});
