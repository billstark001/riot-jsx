/**
 * ColorPicker — a standalone Preact component with local state only.
 * No Redux involved — demonstrates that wrapped components don't need a store.
 */
import { useState } from 'preact/hooks';

const COLORS = [
  { label: 'Violet', value: '#7c3aed' },
  { label: 'Sky', value: '#0284c7' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Emerald', value: '#059669' },
];

export function ColorPicker() {
  const [selected, setSelected] = useState(COLORS[0]);
  const [clicks, setClicks] = useState(0);

  function pick(color: (typeof COLORS)[0]) {
    setSelected(color);
    setClicks((n) => n + 1);
  }

  return (
    <div class="color-picker">
      <p class="label">
        Color Picker <span class="badge">Preact</span>
      </p>
      <p class="desc">Local state only — no Redux. {clicks} pick{clicks !== 1 ? 's' : ''} so far.</p>
      <div class="swatches">
        {COLORS.map((c) => (
          <button
            key={c.value}
            class={`swatch${selected.value === c.value ? ' active' : ''}`}
            style={{ background: c.value }}
            title={c.label}
            onClick={() => pick(c)}
          />
        ))}
      </div>
      <div class="preview" style={{ background: selected.value }}>
        {selected.label}
      </div>
    </div>
  );
}
