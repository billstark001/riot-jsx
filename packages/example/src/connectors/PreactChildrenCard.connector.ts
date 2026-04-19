/**
 * connector for PreactChildrenCard
 *
 * Wraps a Preact component as a Riot tag and maps Riot default-slot markup
 * into the component's children prop.
 */
import { h } from 'preact';
import { connectRenderer } from '@riot-jsx/base';
import type { RiotScope } from '@riot-jsx/base';
import { createPreactRenderer } from '@riot-jsx/preact';
import {
  PreactChildrenCard,
  type PreactChildrenCardProps,
} from '../components/PreactChildrenCard.js';

interface RiotSlotData {
  id: string;
  html: string | null;
}

interface PreactChildrenScope extends RiotScope<{ title?: string }> {
  readonly slots?: RiotSlotData[];
}

function StaticSlotChildren({ html }: { html: string }) {
  return h('div', {
    class: 'slot-fragment',
    dangerouslySetInnerHTML: { __html: html },
  });
}

function getDefaultSlotHtml(slots: RiotSlotData[] | undefined): string | null {
  return slots?.find((slot) => slot.id === 'default')?.html ?? null;
}

const renderer = createPreactRenderer();

const css = `
  .preact-children-card {
    border: 2px solid #0f766e;
    border-radius: 8px;
    padding: 1rem 1.5rem;
    background: #f0fdfa;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .eyebrow {
    margin: 0;
    color: #115e59;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .badge {
    font-size: 0.7rem;
    background: #0f766e;
    color: #fff;
    padding: 2px 6px;
    border-radius: 99px;
    letter-spacing: 0.05em;
  }

  .title {
    margin: 0;
    color: #134e4a;
    font-size: 1.1rem;
  }

  .content {
    color: #334155;
    line-height: 1.6;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .content ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  .slot-fragment {
    display: contents;
  }

  .hint {
    margin: 0;
    color: #6b7280;
    font-size: 0.85rem;
  }
`;

const PreactChildrenCardWrapper = connectRenderer(PreactChildrenCard, {
  name: 'preact-children-card',
  renderer,
  css,
  propsResolver: (scope: PreactChildrenScope): PreactChildrenCardProps => {
    const defaultSlotHtml = getDefaultSlotHtml(scope.slots);

    return {
      title: scope.props.title,
      children: defaultSlotHtml
        ? h(StaticSlotChildren, { html: defaultSlotHtml })
        : undefined,
    };
  },
});

export default PreactChildrenCardWrapper;