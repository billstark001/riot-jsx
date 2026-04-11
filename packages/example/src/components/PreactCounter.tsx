/**
 * PreactCounter — a pure Preact component that displays a counter.
 *
 * Props are supplied by the Redux connector; this component is intentionally
 * unaware of Redux, making it fully testable in isolation.
 */

export interface PreactCounterProps {
  /** Current counter value from the Redux store. */
  count: number;
  /** Callback to increment the counter. */
  increment: () => void;
  /** Callback to decrement the counter. */
  decrement: () => void;
  /** Callback to reset the counter to zero. */
  reset: () => void;
}

export function PreactCounter({ count, increment, decrement, reset }: PreactCounterProps) {
  return (
    <div class="preact-counter">
      <p class="label">
        Preact Counter <span class="badge">Preact</span>
      </p>
      <div class="controls">
        <button class="btn" onClick={decrement}>−</button>
        <span class="value">{count}</span>
        <button class="btn" onClick={increment}>+</button>
      </div>
      <button class="btn-reset" onClick={reset}>Reset</button>
    </div>
  );
}
