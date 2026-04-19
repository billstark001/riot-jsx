import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render } from '@testing-library/react';
import React from 'react';
import { connectRenderer } from '@riot-jsx/base';
import type { RiotComponentWrapper, RiotInstance, RiotScope } from '@riot-jsx/base';
import { createReact18Renderer } from '../src/renderer.js';
import type { RiotSlotData } from '../src/slots.js';

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

// ---------------------------------------------------------------------------
// Tests: React 18 renderer
// ---------------------------------------------------------------------------

describe('createReact18Renderer', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  interface ReactScoreProps {
    n: number;
  }

  it('mounts a component into the container', async () => {
    const renderer = createReact18Renderer();

    function Tag({ label }: { label: string }) {
      return React.createElement('span', { 'data-testid': 'tag' }, label);
    }

    await act(async () => {
      renderer.mount(container, Tag, { label: 'Hello React 18' });
    });

    expect(container.querySelector('[data-testid="tag"]')?.textContent).toBe('Hello React 18');
  });

  it('update patches the component with new props', async () => {
    const renderer = createReact18Renderer();

    function Score({ n }: ReactScoreProps) {
      return React.createElement('p', null, String(n));
    }

    let root: ReturnType<ReturnType<typeof createReact18Renderer>['mount']>;
    await act(async () => {
      root = renderer.mount(container, Score, { n: 0 });
    });

    expect(container.textContent).toBe('0');

    await act(async () => {
      renderer.update(root, Score, { n: 99 });
    });

    expect(container.textContent).toBe('99');
  });

  it('unmount removes the component tree', async () => {
    const renderer = createReact18Renderer();

    function Chip() {
      return React.createElement('div', { 'data-testid': 'chip' }, 'chip');
    }

    let root: ReturnType<ReturnType<typeof createReact18Renderer>['mount']>;
    await act(async () => {
      root = renderer.mount(container, Chip, {});
    });

    expect(container.querySelector('[data-testid="chip"]')).not.toBeNull();

    await act(async () => {
      renderer.unmount(root);
    });

    expect(container.querySelector('[data-testid="chip"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Integration: connectRenderer + createReact18Renderer
// ---------------------------------------------------------------------------

describe('connectRenderer + createReact18Renderer (integration)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders a React component through the Riot wrapper pipeline', async () => {
    function Pill({ color }: { color: string }) {
      return React.createElement('span', { 'data-testid': 'pill', style: { color } }, color);
    }

    const wrapper = connectRenderer(Pill, {
      name: 'test-pill',
      renderer: createReact18Renderer(),
    });

    const template = wrapper.template();
    const scope = { props: { color: 'blue' }, state: {}, update: vi.fn() };

    await act(async () => {
      template.mount(container, scope);
    });

    expect(container.querySelector('[data-testid="pill"]')?.textContent).toBe('blue');
  });
});

// ---------------------------------------------------------------------------
// Tests: RiotMount component (mount slot renders container element)
// ---------------------------------------------------------------------------

describe('RiotMount (React)', () => {
  it('renders a container element to the DOM', async () => {
    const { RiotMount } = await import('../src/RiotMount.js');
    const dummyWrapper = createDummyWrapper();

    const { container } = render(
      React.createElement(RiotMount, { component: dummyWrapper }),
    );

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
      return React.createElement(
        'div',
        null,
        React.createElement('span', null, String(tick)),
        React.createElement(RiotMount, { component: dummyWrapper }),
      );
    }

    let rerender!: ReturnType<typeof render>['rerender'];
    await act(async () => {
      ({ rerender } = render(React.createElement(Host, { tick: 0 })));
    });

    expect(mountFn).toHaveBeenCalledTimes(1);
    expect(instance.update).not.toHaveBeenCalled();

    await act(async () => {
      rerender(React.createElement(Host, { tick: 1 }));
    });

    await act(async () => {
      rerender(React.createElement(Host, { tick: 2 }));
    });

    expect(instance.update).not.toHaveBeenCalled();
    vi.doUnmock('riot');
    vi.resetModules();
  });

  it('updates the mounted Riot instance only when riotProps identity changes', async () => {
    vi.resetModules();

    interface TitleProps {
      title: string;
    }

    const initialProps: TitleProps = { title: 'one' };
    const nextProps: TitleProps = { title: 'two' };
    const instance: MockMountedRiotInstance<TitleProps> = {
      props: initialProps,
      update: vi.fn(),
      unmount: vi.fn(),
    };
    const mountFn = vi.fn((_element: HTMLElement, props: TitleProps) => {
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
      ({ rerender } = render(
        React.createElement(RiotMount, { component: dummyWrapper, riotProps: initialProps }),
      ));
    });

    expect(mountFn).toHaveBeenCalledTimes(1);
    expect(instance.update).not.toHaveBeenCalled();

    await act(async () => {
      rerender(React.createElement(RiotMount, { component: dummyWrapper, riotProps: initialProps }));
    });

    expect(instance.update).not.toHaveBeenCalled();

    await act(async () => {
      rerender(React.createElement(RiotMount, { component: dummyWrapper, riotProps: nextProps }));
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
      ({ rerender } = render(
        React.createElement(RiotMount, { component: dummyWrapper, riotProps: sourceProps }),
      ));
    });

    expect(instance.props).toEqual({ total: 1, nested: { value: 1 } });
    expect(instance.props).not.toBe(sourceProps);
    expect(Object.isFrozen(instance.props)).toBe(true);
    expect(Object.isFrozen(instance.props.nested)).toBe(true);

    sourceProps.total = 10;
    sourceProps.nested.value = 10;

    expect(instance.props).toEqual({ total: 1, nested: { value: 1 } });

    await act(async () => {
      rerender(React.createElement(RiotMount, { component: dummyWrapper, riotProps: nextProps }));
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

    const view = (label: string) => React.createElement(
      RiotMount,
      { component: dummyWrapper },
      React.createElement('span', null, label),
      React.createElement('strong', { slot: 'title' }, 'Title'),
    );

    let rerender!: ReturnType<typeof render>['rerender'];
    await act(async () => {
      ({ rerender } = render(view('Body')));
    });

    expect(mountFn).toHaveBeenCalledTimes(1);
    expect(metas[0]?.slots).toEqual([
      { id: 'default', html: '<span>Body</span>', bindings: [] },
      { id: 'title', html: '<strong>Title</strong>', bindings: [] },
    ]);

    await act(async () => {
      rerender(view('Body'));
    });

    expect(mountFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      rerender(view('Updated'));
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
