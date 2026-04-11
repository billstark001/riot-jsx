import { describe, it, expect } from 'vitest';
import { createPreactRenderer } from '../src/renderer.js';
import { h } from 'preact';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simple stateless Preact component for testing */
function Greeting({ name }: { name: string }) {
  return h('span', { 'data-testid': 'greeting' }, `Hello, ${name}!`);
}

function Counter({ count }: { count: number }) {
  return h('p', { 'data-testid': 'count' }, String(count));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createPreactRenderer', () => {
  it('mounts a component and renders it into the container', () => {
    const renderer = createPreactRenderer();
    const container = document.createElement('div');
    document.body.appendChild(container);

    renderer.mount(container, Greeting, { name: 'World' });

    expect(container.textContent).toBe('Hello, World!');
    document.body.removeChild(container);
  });

  it('returns the container element as the root handle', () => {
    const renderer = createPreactRenderer();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root = renderer.mount(container, Greeting, { name: 'Test' });

    expect(root).toBe(container);
    document.body.removeChild(container);
  });

  it('update re-renders the component with new props (incremental patch)', () => {
    const renderer = createPreactRenderer();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root = renderer.mount(container, Counter, { count: 0 });
    expect(container.textContent).toBe('0');

    renderer.update(root, Counter, { count: 42 });
    expect(container.textContent).toBe('42');

    renderer.update(root, Counter, { count: -1 });
    expect(container.textContent).toBe('-1');

    document.body.removeChild(container);
  });

  it('unmount removes the rendered content from the container', () => {
    const renderer = createPreactRenderer();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root = renderer.mount(container, Greeting, { name: 'Bye' });
    expect(container.textContent).toContain('Bye');

    renderer.unmount(root);
    // After unmount the container should have no meaningful text content
    expect(container.textContent).toBe('');

    document.body.removeChild(container);
  });

  it('update works correctly after multiple mount/unmount cycles', () => {
    const renderer = createPreactRenderer();
    const container = document.createElement('div');
    document.body.appendChild(container);

    renderer.mount(container, Counter, { count: 1 });
    renderer.unmount(container);

    renderer.mount(container, Counter, { count: 99 });
    expect(container.textContent).toBe('99');

    document.body.removeChild(container);
  });
});
