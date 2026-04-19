import {
  Children,
  Fragment,
  createElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const DEFAULT_SLOT_NAME = 'default';

export interface RiotSlotData {
  id: string;
  html: string;
  bindings: [];
}

export interface SerializedRiotSlots {
  signature: string;
  slots?: RiotSlotData[];
}

function stripSlotProp(
  child: ReactElement<Record<string, unknown>>,
): ReactNode {
  const { slot: _slot, children, ...restProps } = child.props;

  return createElement(child.type, restProps, children as ReactNode);
}

export function serializeRiotSlots(children: ReactNode): SerializedRiotSlots {
  const grouped = new Map<string, ReactNode[]>();

  const append = (slotName: string, child: ReactNode) => {
    const slotChildren = grouped.get(slotName);

    if (slotChildren) {
      slotChildren.push(child);
      return;
    }

    grouped.set(slotName, [child]);
  };

  const visit = (child: ReactNode): void => {
    if (child == null || typeof child === 'boolean') {
      return;
    }

    if (isValidElement(child)) {
      const props = child.props as Record<string, unknown>;
      const slotName =
        typeof props.slot === 'string' && props.slot.length > 0
          ? props.slot
          : null;

      if (child.type === Fragment && slotName === null) {
        Children.toArray(props.children as ReactNode).forEach(visit);
        return;
      }

      append(
        slotName ?? DEFAULT_SLOT_NAME,
        slotName ? stripSlotProp(child as ReactElement<Record<string, unknown>>) : child,
      );
      return;
    }

    append(DEFAULT_SLOT_NAME, child);
  };

  Children.toArray(children).forEach(visit);

  const slots = Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, slotChildren]) => ({
      id,
      html: renderToStaticMarkup(createElement(Fragment, null, ...slotChildren)),
      bindings: [] as [],
    }))
    .filter(({ html }) => html.length > 0);

  return {
    signature: JSON.stringify(slots.map(({ id, html }) => [id, html])),
    slots: slots.length > 0 ? slots : undefined,
  };
}