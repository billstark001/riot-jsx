/**
 * App — root Preact component for the riot-jsx demo.
 *
 * Layout:
 *   ┌────────────────────────────────────────────────────┐
 *   │  h1: riot-jsx Bridge Demo                          │
 *   ├────────────────────────────────────────────────────┤
 *   │  Section A — direct Preact counter (Redux)         │
 *   │    <PreactCounter />  (rendered directly by Preact)│
 *   ├────────────────────────────────────────────────────┤
 *   │  Section B — Riot component via <RiotMount>        │
 *   │    <RiotMount component={RiotPanel} />             │
 *   │      └── RiotPanel.riot                            │
 *   │            └── <preact-counter />   (Riot wrapper) │
 *   │                  └── PreactCounter (same Redux)    │
 *   └────────────────────────────────────────────────────┘
 *
 * Both counters share a single Redux store, so editing one immediately
 * reflects in the other.
 */
import { RiotMount } from '@riot-jsx/preact';
import { PreactCounter } from './components/PreactCounter.js';
import { store } from './store.js';
import type { RootState } from './store.js';
import { useReducer, useEffect } from 'preact/hooks';

import RiotPanelWrapper from './components/RiotPanel.riot';

// ---------------------------------------------------------------------------
// Mini hook: subscribe to a Redux store slice
// ---------------------------------------------------------------------------

function useSelector<T>(selector: (state: RootState) => T): T {
  const [value, rerender] = useReducer(
    () => selector(store.getState()),
    undefined,
    () => selector(store.getState()),
  );
  useEffect(() => store.subscribe(rerender as any), []);
  return value;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function App() {
  const count = useSelector((s) => s.counter.value);

  return (
    <div class="app">
      <h1>riot-jsx Bridge Demo</h1>
      <p class="intro">
        This page demonstrates <strong>@riot-jsx</strong>: bidirectional nesting
        of Riot and Preact components sharing a single Redux store.
      </p>

      {/* ── Section A: Direct Preact counter ── */}
      <section>
        <h2>A. Preact → Redux (direct)</h2>
        <p class="desc">
          A plain Preact component rendered directly — no Riot involved.
        </p>
        <PreactCounter
          count={count}
          increment={() => store.dispatch({ type: 'counter/increment' })}
          decrement={() => store.dispatch({ type: 'counter/decrement' })}
          reset={() => store.dispatch({ type: 'counter/reset' })}
        />
      </section>

      {/* ── Section B: Riot panel via RiotMount ── */}
      <section>
        <h2>B. Preact → Riot → Preact (nested)</h2>
        <p class="desc">
          A <code>&lt;RiotMount&gt;</code> embeds a genuine Riot component
          (<code>RiotPanel.riot</code>), which itself contains a
          <code>&lt;preact-counter&gt;</code> — a Preact component registered as
          a Riot tag via <code>@riot-jsx/redux</code>.
        </p>
        <RiotMount component={RiotPanelWrapper} />
      </section>

      <footer>
        <p>Both counters share the same Redux state. Edit one → the other updates instantly.</p>
      </footer>
    </div>
  );
}
