import { h } from 'preact';
import type { ComponentChildren } from 'preact';

export interface PreactChildrenCardProps {
  title?: string;
  children?: ComponentChildren;
}

export function PreactChildrenCard({
  title = 'Embedded note',
  children,
}: PreactChildrenCardProps) {
  return (
    <article class="preact-children-card">
      <p class="eyebrow">
        Preact Children <span class="badge">Preact</span>
      </p>

      <h3 class="title">{title}</h3>

      <div class="content">{children}</div>

      <p class="hint">
        The shell is rendered by Preact; the body content is authored by the
        parent Riot component.
      </p>
    </article>
  );
}