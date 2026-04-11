import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render } from '@testing-library/react';
import React from 'react';
import { connectRenderer } from '@riot-jsx/base';
import { createReact18Renderer } from '../src/renderer.js';

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

    function Score({ n }: { n: number }) {
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

    const dummyWrapper = {
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

    const { container } = render(
      React.createElement(RiotMount, { component: dummyWrapper }),
    );

    expect(container.firstElementChild?.tagName.toLowerCase()).toBe('div');
  });
});
