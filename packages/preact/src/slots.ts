import {
  Fragment,
  h,
  isValidElement,
  toChildArray,
  type ComponentChildren,
  type VNode,
} from 'preact';
import renderToString from 'preact-render-to-string';

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

function stripSlotProp(child: VNode): ComponentChildren {
  const { slot: _slot, children, ...restProps } = child.props as Record<string, unknown>;

  return h(child.type, restProps, children as ComponentChildren);
}

export function serializeRiotSlots(
  children: ComponentChildren,
): SerializedRiotSlots {
  const grouped = new Map<string, ComponentChildren[]>();

  const append = (slotName: string, child: ComponentChildren) => {
    const slotChildren = grouped.get(slotName);

    if (slotChildren) {
      slotChildren.push(child);
      return;
    }

    grouped.set(slotName, [child]);
  };

  const visit = (child: ComponentChildren): void => {
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
        toChildArray(props.children as ComponentChildren).forEach(visit);
        return;
      }

      append(slotName ?? DEFAULT_SLOT_NAME, slotName ? stripSlotProp(child) : child);
      return;
    }

    append(DEFAULT_SLOT_NAME, child);
  };

  toChildArray(children).forEach(visit);

  const slots = Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, slotChildren]) => ({
      id,
      html: renderToString(h(Fragment, null, slotChildren)),
      bindings: [] as [],
    }))
    .filter(({ html }) => html.length > 0);

  return {
    signature: JSON.stringify(slots.map(({ id, html }) => [id, html])),
    slots: slots.length > 0 ? slots : undefined,
  };
}