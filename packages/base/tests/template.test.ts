import { describe, it, expect, vi } from 'vitest';
import { makeTemplateFactory } from '../src/template.js';
import type { RendererAdapter, ComponentType, RiotScope } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeScope<Props extends Record<string, unknown>>(
  props: Props,
): RiotScope<Props> {
  return {
    props,
    state: {},
    update: vi.fn(),
  };
}

function makeRenderer() {
  // Use mutable counters captured by closures so reads and writes stay in sync
  let mountCount = 0;
  let updateCount = 0;
  let unmountCount = 0;
  let lastProps: Record<string, unknown> | null = null;

  const adapter = {
    mount(
      container: HTMLElement,
      _Component: ComponentType,
      props: Record<string, unknown>,
    ): HTMLElement {
      mountCount++;
      lastProps = props;
      return container;
    },
    update(
      _root: HTMLElement,
      _Component: ComponentType,
      props: Record<string, unknown>,
    ): void {
      updateCount++;
      lastProps = props;
    },
    unmount(_root: HTMLElement): void {
      unmountCount++;
    },
    get mountCount() { return mountCount; },
    get updateCount() { return updateCount; },
    get unmountCount() { return unmountCount; },
    get lastProps() { return lastProps; },
  };

  return adapter;
}

const noop: ComponentType = () => null;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('makeTemplateFactory', () => {
  it('returns a factory function', () => {
    const renderer = makeRenderer();
    const factory = makeTemplateFactory(renderer, noop, (s) => s.props);
    expect(typeof factory).toBe('function');
  });

  it('factory call returns an object with mount/update/unmount/clone', () => {
    const renderer = makeRenderer();
    const template = makeTemplateFactory(renderer, noop, (s) => s.props)();
    expect(typeof template.mount).toBe('function');
    expect(typeof template.update).toBe('function');
    expect(typeof template.unmount).toBe('function');
    expect(typeof template.clone).toBe('function');
  });

  it('mount delegates to renderer.mount', () => {
    const renderer = makeRenderer();
    const template = makeTemplateFactory(renderer, noop, (s) => s.props)();
    const el = document.createElement('div');
    template.mount(el, makeScope({}));
    expect(renderer.mountCount).toBe(1);
  });

  it('mount returns the template instance (fluent API)', () => {
    const renderer = makeRenderer();
    const template = makeTemplateFactory(renderer, noop, (s) => s.props)();
    const el = document.createElement('div');
    const ret = template.mount(el, makeScope({}));
    expect(ret).toBe(template);
  });

  it('update delegates to renderer.update after mount', () => {
    const renderer = makeRenderer();
    const template = makeTemplateFactory(renderer, noop, (s) => s.props)();
    const el = document.createElement('div');
    template.mount(el, makeScope({}));
    template.update(makeScope({}));
    expect(renderer.updateCount).toBe(1);
  });

  it('update is a no-op when called before mount', () => {
    const renderer = makeRenderer();
    const template = makeTemplateFactory(renderer, noop, (s) => s.props)();
    // Should not throw
    template.update(makeScope());
    expect(renderer.updateCount).toBe(0);
  });

  it('unmount delegates to renderer.unmount and clears root', () => {
    const renderer = makeRenderer();
    const template = makeTemplateFactory(renderer, noop, (s) => s.props)();
    const el = document.createElement('div');
    template.mount(el, makeScope({}));
    template.unmount(makeScope({}));
    expect(renderer.unmountCount).toBe(1);
    // A second unmount must be a no-op (root is already null)
    template.unmount(makeScope({}));
    expect(renderer.unmountCount).toBe(1);
  });

  it('clone returns a fully independent template instance', () => {
    const renderer = makeRenderer();
    const template = makeTemplateFactory(renderer, noop, (s) => s.props)();
    const clone = template.clone();
    expect(clone).not.toBe(template);

    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    template.mount(el1, makeScope({}));
    clone.mount(el2, makeScope({}));
    // Each mount goes through the renderer independently
    expect(renderer.mountCount).toBe(2);

    // Unmounting one should not affect the other
    template.unmount(makeScope({}));
    expect(renderer.unmountCount).toBe(1);
    clone.update(makeScope({})); // clone is still mounted
    expect(renderer.updateCount).toBe(1);
  });

  it('supports Riot createDOM().clone() flow for each-style template cloning', () => {
    const renderer = makeRenderer();
    const template = makeTemplateFactory(renderer, noop, (s) => s.props)();
    const host = document.createElement('div');

    expect(template.createDOM(host)).toBe(template);

    const firstClone = template.clone();
    const secondClone = template.clone();
    const firstElement = document.createElement('div');
    const secondElement = document.createElement('div');

    firstClone.mount(firstElement, makeScope({ id: 1 }));
    secondClone.mount(secondElement, makeScope({ id: 2 }));

    expect(renderer.mountCount).toBe(2);

    firstClone.unmount(makeScope({}));
    secondClone.update(makeScope({ id: 3 }));

    expect(renderer.unmountCount).toBe(1);
    expect(renderer.updateCount).toBe(1);
  });

  it('resolveProps is called on mount and passed to renderer', () => {
    const renderer = makeRenderer();
    const resolveProps = vi.fn((scope: RiotScope<{ x: number }>) => ({
      doubled: scope.props.x * 2,
    }));
    const template = makeTemplateFactory(renderer, noop, resolveProps)();
    const el = document.createElement('div');
    template.mount(el, makeScope({ x: 5 }));
    expect(resolveProps).toHaveBeenCalledOnce();
    expect(renderer.lastProps).toEqual({ doubled: 10 });
  });

  it('resolveProps is called on each update', () => {
    const renderer = makeRenderer();
    const resolveProps = vi.fn((scope: RiotScope) => scope.props);
    const template = makeTemplateFactory(renderer, noop, resolveProps)();
    const el = document.createElement('div');
    template.mount(el, makeScope({ n: 1 }));
    template.update(makeScope({ n: 2 }));
    template.update(makeScope({ n: 3 }));
    expect(resolveProps).toHaveBeenCalledTimes(3);
  });
});
