/**
 * connector for PreactCounter
 *
 * Wraps the pure Preact component as a first-class Riot component:
 *   - tag name: "preact-counter"
 *   - connected to the Redux store via @riot-jsx/redux
 *   - scoped CSS injected via Riot's built-in CSS manager
 */
import { connectRedux } from '@riot-jsx/redux';
import { createPreactRenderer } from '@riot-jsx/preact';
import { PreactCounter } from '../components/PreactCounter.js';
import { getStore } from '../store.js';
import type { RootState } from '../store.js';

const renderer = createPreactRenderer();

/** Scoped CSS — Riot will prefix every rule with [is="preact-counter"] */
const css = `
  .preact-counter {
    border: 2px solid #7c3aed;
    border-radius: 8px;
    padding: 1rem 1.5rem;
    background: #faf5ff;
    display: inline-flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
  }

  .label {
    font-weight: 600;
    color: #4c1d95;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .badge {
    font-size: 0.7rem;
    background: #7c3aed;
    color: #fff;
    padding: 2px 6px;
    border-radius: 99px;
    letter-spacing: 0.05em;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .value {
    font-size: 2rem;
    font-weight: 700;
    min-width: 3ch;
    text-align: center;
    color: #1d1d1f;
  }

  .btn {
    font-size: 1.25rem;
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    border-radius: 50%;
    background: #7c3aed;
    color: #fff;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn:hover { background: #6d28d9; }

  .btn-reset {
    font-size: 0.8rem;
    padding: 4px 12px;
    border: 1px solid #7c3aed;
    border-radius: 4px;
    background: transparent;
    color: #7c3aed;
    cursor: pointer;
  }

  .btn-reset:hover { background: #ede9fe; }
`;

/**
 * A Riot component wrapper for {@link PreactCounter}.
 * Register once via `riot.register('preact-counter', PreactCounterWrapper)`.
 */
const PreactCounterWrapper = connectRedux(PreactCounter, {
  name: 'preact-counter',
  renderer,
  css,
  getStore,
  mapStateToProps: (state: RootState) => ({
    count: state.counter.value,
  }),
  mapDispatchToProps: (dispatch) => ({
    increment: () => dispatch({ type: 'counter/increment' }),
    decrement: () => dispatch({ type: 'counter/decrement' }),
    reset:     () => dispatch({ type: 'counter/reset' }),
  }),
});

export default PreactCounterWrapper;
