import { createElement, useEffect, useRef } from 'react';
import type { JSX, ReactNode } from 'react';
import * as riotRuntime from 'riot';
import type { RiotComponentWrapper, RiotInstance } from '@riot-jsx/base';
import { snapshotRiotProps, updateRiotInstance } from '@riot-jsx/base';
import {
  serializeRiotSlots,
  type RiotSlotData,
  type SerializedRiotSlots,
} from './slots.js';

const EMPTY_RIOT_PROPS = Object.freeze({}) as Record<string, never>;
const EMPTY_SLOT_PAYLOAD: SerializedRiotSlots = { signature: '[]' };
const NO_CHILDREN = Symbol('riotmount-no-children');

function hasPotentialSlotChildren(children: ReactNode): boolean {
  return (
    children !== undefined &&
    children !== null &&
    children !== false &&
    children !== true
  );
}

// ---------------------------------------------------------------------------
// Minimal local typings for Riot instances
// ---------------------------------------------------------------------------

interface RiotModule {
  component(
    wrapper: RiotComponentWrapper,
  ): (
    element: HTMLElement,
    props?: object,
    meta?: { slots?: RiotSlotData[] },
  ) => RiotInstance;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface RiotMountProps {
  /** The compiled Riot component wrapper to mount inside this React node. */
  component: RiotComponentWrapper;
  /**
   * Props to forward into the Riot component.
  * Updates are driven by reference equality; stabilise this object with
  * `useMemo` to avoid redundant Riot updates.
   */
  riotProps?: object;
  /**
   * HTML tag to use for the container element.
   * @default "div"
   */
  containerTag?: string;
  /** Optional CSS class name for the container element. */
  className?: string;
  /**
   * Optional JSX children forwarded into Riot slots.
   * Children with a `slot` prop become named slots; all others are rendered
   * into Riot's `default` slot. Updating slot content remounts the Riot
   * component because Riot resolves slot templates only during mount.
   */
  children?: ReactNode;
}

/**
 * A React component that mounts a Riot component into the React tree.
 *
 * Identical in purpose to the Preact `RiotMount`, but implemented with React
 * hooks.  Riot lifecycle follows this component's lifecycle:
 *
 * - **Mounted** once when this React component first appears in the DOM.
 * - **Updated** in place whenever the `riotProps` reference changes.
 * - **Unmounted** when this React component is removed from the tree.
 *
 * ### Peer dependencies
 * `riot` must be installed in the host project.
 *
 * @example
 * ```tsx
 * import { RiotMount } from '@riot-jsx/react';
 * import LegacyTable from './legacy-table.riot';
 *
 * function Dashboard({ rows }: { rows: unknown[] }) {
 *   const riotProps = useMemo(() => ({ rows }), [rows]);
 *   return <RiotMount component={LegacyTable} riotProps={riotProps} />;
 * }
 * ```
 */
export function RiotMount({
  component,
  riotProps,
  containerTag = 'div',
  className,
  children,
}: RiotMountProps): JSX.Element {
  const containerRef = useRef<HTMLElement | null>(null);
  const instanceRef = useRef<RiotInstance | null>(null);
  const lastAppliedPropsRef = useRef<object>(EMPTY_RIOT_PROPS);
  const lastMountedComponentRef = useRef<RiotComponentWrapper | null>(null);
  const lastSerializedChildrenRef = useRef<ReactNode | typeof NO_CHILDREN>(
    NO_CHILDREN,
  );
  const lastSlotPayloadRef = useRef<SerializedRiotSlots>(EMPTY_SLOT_PAYLOAD);
  const lastSlotSignatureRef = useRef('[]');
  const stableRiotProps = riotProps ?? EMPTY_RIOT_PROPS;

  const getSlotPayload = () => {
    if (!hasPotentialSlotChildren(children)) {
      lastSerializedChildrenRef.current = NO_CHILDREN;
      lastSlotPayloadRef.current = EMPTY_SLOT_PAYLOAD;
      return EMPTY_SLOT_PAYLOAD;
    }

    if (lastSerializedChildrenRef.current === children) {
      return lastSlotPayloadRef.current;
    }

    const nextSlotPayload = serializeRiotSlots(children);
    lastSerializedChildrenRef.current = children;
    lastSlotPayloadRef.current = nextSlotPayload.slots
      ? nextSlotPayload
      : EMPTY_SLOT_PAYLOAD;
    return lastSlotPayloadRef.current;
  };

  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        instanceRef.current.unmount(true);
        instanceRef.current = null;
      }

      lastMountedComponentRef.current = null;
      lastSerializedChildrenRef.current = NO_CHILDREN;
      lastSlotPayloadRef.current = EMPTY_SLOT_PAYLOAD;
      lastSlotSignatureRef.current = '[]';
      lastAppliedPropsRef.current = EMPTY_RIOT_PROPS;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const slotPayload = getSlotPayload();
    const shouldRemount =
      instanceRef.current !== null &&
      (lastMountedComponentRef.current !== component ||
        lastSlotSignatureRef.current !== slotPayload.signature);

    if (shouldRemount) {
      instanceRef.current?.unmount(true);
      instanceRef.current = null;
      lastAppliedPropsRef.current = EMPTY_RIOT_PROPS;
    }

    if (instanceRef.current !== null) {
      return;
    }

    const riot = riotRuntime as unknown as RiotModule;
    const mountFn = riot.component(component);
    const initialProps = snapshotRiotProps(stableRiotProps);
    instanceRef.current = slotPayload.slots
      ? mountFn(container, initialProps, { slots: slotPayload.slots })
      : mountFn(container, initialProps);
    lastMountedComponentRef.current = component;
    lastSlotSignatureRef.current = slotPayload.signature;
    lastAppliedPropsRef.current = stableRiotProps;
  }, [component, children]);

  useEffect(() => {
    if (!instanceRef.current) return;
    if (lastAppliedPropsRef.current === stableRiotProps) return;

    updateRiotInstance(instanceRef.current, stableRiotProps, true);
    lastAppliedPropsRef.current = stableRiotProps;
  }, [stableRiotProps]);

  return createElement(containerTag, { ref: containerRef, className });
}
