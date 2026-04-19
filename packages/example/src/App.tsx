/**
 * App — root Preact component for the riot-jsx demo.
 *
 * Layout:
 *   A. Preact → Redux (direct)
 *      Plain PreactCounter rendered directly, connected to the Redux store.
 *
 *   B. Preact → Riot → Preact (nested, Redux)
 *      RiotMount embeds RiotPanel.riot, which hosts <preact-counter />.
 *      Both sections share the same Redux store — editing one updates the other.
 *
 *   C. Riot → Preact, no Redux (pure local state)
 *      RiotPanel2.riot hosts <color-picker />, a Preact component that manages
 *      its own state with useState — no store involved.
 *
 *   D. Preact → Riot (lifecycle & reactive riotProps)
 *      RiotMount embeds RiotTimer.riot, a countdown timer written in pure Riot.
 *      The initial seconds are controlled by a Preact <input type="range">,
 *      demonstrating how Preact drives a Riot component through riotProps.
 *
 *   E. Preact → Riot → Preact (Riot injects children)
 *      RiotMount embeds RiotSlotCard.riot, which renders a wrapped Preact
 *      component and injects Riot-authored default-slot markup into its children.
 *
 *   F. Preact → Riot named slots
 *      RiotMount embeds RiotNamedSlots.riot and maps `slot="..."` children
 *      into Riot named slots.
 */
import { RiotMount } from '@riot-jsx/preact';
import { PreactCounter } from './components/PreactCounter.js';
import { store } from './store.js';
import type { RootState } from './store.js';
import { useReducer, useEffect, useState, useMemo } from 'preact/hooks';

import RiotPanelWrapper from './components/RiotPanel.riot';
import RiotPanel2Wrapper from './components/RiotPanel2.riot';
import RiotSlotCardWrapper from './components/RiotSlotCard.riot';
import RiotNamedSlotsWrapper from './components/RiotNamedSlots.riot';
import RiotTimerWrapper from './components/RiotTimer.riot';

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

  // Section D: slider controls how many seconds the Riot timer starts with
  const [timerSeconds, setTimerSeconds] = useState(10);
  const timerProps = useMemo(() => ({ seconds: timerSeconds }), [timerSeconds]);
  const [slotVariant, setSlotVariant] = useState<'draft' | 'review'>('draft');
  const slotCardProps = useMemo(
    () => ({
      title: slotVariant === 'draft' ? 'Draft summary' : 'Review summary',
    }),
    [slotVariant],
  );

  return (
    <div class="app">
      <h1>riot-jsx Bridge Demo</h1>
      <p class="intro">
        Demonstrates <strong>@riot-jsx</strong>: bidirectional nesting of Riot
        and Preact components, with and without Redux.
      </p>

      {/* ── Section A: Direct Preact counter (Redux) ── */}
      <section>
        <h2>A. Preact → Redux (direct)</h2>
        <p class="desc">
          A plain Preact component rendered directly inside the Preact tree.
          Its state lives in a shared Redux store.
        </p>
        <PreactCounter
          count={count}
          increment={() => store.dispatch({ type: 'counter/increment' })}
          decrement={() => store.dispatch({ type: 'counter/decrement' })}
          reset={() => store.dispatch({ type: 'counter/reset' })}
        />
      </section>

      {/* ── Section B: Riot panel → Preact counter (Redux, nested) ── */}
      <section>
        <h2>B. Preact → Riot → Preact (nested, shared Redux)</h2>
        <p class="desc">
          A <code>&lt;RiotMount&gt;</code> embeds <code>RiotPanel.riot</code>,
          which itself contains <code>&lt;preact-counter /&gt;</code> — a Preact
          component registered as a Riot tag via <code>@riot-jsx/redux</code>.
          Both counters share the same Redux store; editing one updates the other.
        </p>
        <RiotMount component={RiotPanelWrapper} />
      </section>

      {/* ── Section C: Riot → Preact (no Redux, local state) ── */}
      <section>
        <h2>C. Riot → Preact (no Redux, local Preact state)</h2>
        <p class="desc">
          <code>RiotPanel2.riot</code> hosts <code>&lt;color-picker /&gt;</code>,
          a Preact component wrapped with <code>connectRenderer</code> (no Redux).
          The component manages its own state with <code>useState</code> — no
          store involved.
        </p>
        <RiotMount component={RiotPanel2Wrapper} />
      </section>

      {/* ── Section D: Riot lifecycle + reactive riotProps ── */}
      <section>
        <h2>D. Preact → Riot (lifecycle hooks & reactive riotProps)</h2>
        <p class="desc">
          <code>RiotTimer.riot</code> is a pure Riot component: it uses{' '}
          <code>onMounted</code> / <code>onUnmounted</code> lifecycle hooks and{' '}
          <code>setInterval</code> to count down. The starting value is driven
          by a Preact slider — a live example of Preact passing reactive props
          into an embedded Riot component via <code>riotProps</code>.
        </p>
        <div class="slider-row">
          <label for="seconds-slider">Start seconds: <strong>{timerSeconds}</strong></label>
          <input
            id="seconds-slider"
            type="range"
            min={3}
            max={30}
            value={timerSeconds}
            onInput={(e) => setTimerSeconds(Number((e.target as HTMLInputElement).value))}
          />
        </div>
        <RiotMount component={RiotTimerWrapper} riotProps={timerProps} />
      </section>

      <section>
        <h2>E. Preact → Riot → Preact (Riot injects children)</h2>
        <p class="desc">
          <code>RiotSlotCard.riot</code> renders a wrapped
          <code>&lt;preact-children-card /&gt;</code> tag. The body content is
          authored by Riot between the opening and closing tags and forwarded
          into the Preact child component as static <code>children</code>
          markup.
        </p>
        <div class="slider-row">
          <button
            type="button"
            onClick={() => setSlotVariant((current) => current === 'draft' ? 'review' : 'draft')}
          >
            Toggle Riot prop title
          </button>
        </div>
        <RiotMount component={RiotSlotCardWrapper} riotProps={slotCardProps} />
      </section>

      <section>
        <h2>F. Preact → Riot (named slots)</h2>
        <p class="desc">
          <code>RiotNamedSlots.riot</code> consumes both named slots and a default
          body slot. In JSX, pass a <code>slot</code> prop on children to target the
          corresponding Riot slot by name.
        </p>
        <RiotMount component={RiotNamedSlotsWrapper}>
          <span slot="eyebrow">Named slot demo</span>
          <strong slot="title">Weekly release checklist</strong>
          <ul>
            <li>Named slot content is rendered as static HTML, not a live JSX subtree.</li>
            <li>Use this for layout/content composition, not for interactive child islands.</li>
          </ul>
        </RiotMount>
      </section>

      <footer>
        <p>
          Sections A &amp; B share Redux state — edit one, the other updates instantly.
          Sections C through F are independent demos of local state, root props,
          and Riot slot composition.
        </p>
      </footer>
    </div>
  );
}
