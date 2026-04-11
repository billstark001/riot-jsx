import { describe, it, expect, vi } from 'vitest';
import { connectRenderer } from '../src/connector.js';
import type { RendererAdapter, RiotScope } from '../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRenderer(): RendererAdapter<HTMLElement> {
  return {
    mount: vi.fn((container: HTMLElement) => container),
    update: vi.fn(),
    unmount: vi.fn(),
  };
}

function stubScope(props: Record<string, unknown> = {}): RiotScope {
  return { props, state: {}, update: vi.fn() };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('connectRenderer', () => {
  it('returns a wrapper with correct name and template factory', () => {
    const renderer = makeRenderer();
    const wrapper = connectRenderer(() => null, { name: 'my-widget', renderer });
    expect(wrapper.name).toBe('my-widget');
    expect(typeof wrapper.template).toBe('function');
    expect(wrapper.exports).toBeDefined();
  });

  it('passes css through to the wrapper unchanged', () => {
    const renderer = makeRenderer();
    const css = '.foo { color: red; }';
    const wrapper = connectRenderer(() => null, { name: 'my-widget', renderer, css });
    expect(wrapper.css).toBe(css);
  });

  it('defaults css to null when not provided', () => {
    const renderer = makeRenderer();
    const wrapper = connectRenderer(() => null, { name: 'my-widget', renderer });
    expect(wrapper.css).toBeNull();
  });

  it('throws when name has no hyphen', () => {
    const renderer = makeRenderer();
    expect(() =>
      connectRenderer(() => null, { name: 'widget', renderer }),
    ).toThrow(/hyphen/);
  });

  it('throws when name is empty', () => {
    const renderer = makeRenderer();
    expect(() =>
      connectRenderer(() => null, { name: '', renderer }),
    ).toThrow();
  });

  it('throws when renderer is missing', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connectRenderer(() => null, { name: 'my-widget', renderer: undefined as any }),
    ).toThrow(/renderer/);
  });

  it('template factory returns an object with the four lifecycle methods', () => {
    const renderer = makeRenderer();
    const wrapper = connectRenderer(() => null, { name: 'my-widget', renderer });
    const template = wrapper.template();
    expect(typeof template.mount).toBe('function');
    expect(typeof template.update).toBe('function');
    expect(typeof template.unmount).toBe('function');
    expect(typeof template.clone).toBe('function');
  });

  it('default propsResolver forwards scope.props to the renderer', () => {
    const renderer = makeRenderer();
    const wrapper = connectRenderer(() => null, { name: 'my-widget', renderer });
    const template = wrapper.template();
    const el = document.createElement('div');
    template.mount(el, stubScope({ color: 'blue' }));
    expect(renderer.mount).toHaveBeenCalledWith(el, expect.any(Function), { color: 'blue' });
  });

  it('custom propsResolver is used to transform props', () => {
    const renderer = makeRenderer();
    const propsResolver = vi.fn((scope: RiotScope) => ({
      value: (scope.props['x'] as number) * 3,
    }));
    const wrapper = connectRenderer(() => null, {
      name: 'my-widget',
      renderer,
      propsResolver,
    });
    const template = wrapper.template();
    const el = document.createElement('div');
    template.mount(el, stubScope({ x: 4 }));
    expect(propsResolver).toHaveBeenCalledOnce();
    expect(renderer.mount).toHaveBeenCalledWith(el, expect.any(Function), { value: 12 });
  });

  it('exports is an empty object by default', () => {
    const renderer = makeRenderer();
    const wrapper = connectRenderer(() => null, { name: 'my-widget', renderer });
    expect(wrapper.exports).toEqual({});
  });
});
