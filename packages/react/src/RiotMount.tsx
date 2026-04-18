import { createElement, useRef, useEffect } from 'react';
import type { JSX } from 'react';
import * as riotRuntime from 'riot';
import type { RiotComponentWrapper, RiotInstance } from '@riot-jsx/base';
import { updateRiotInstance } from '@riot-jsx/base';

const EMPTY_RIOT_PROPS = Object.freeze({}) as Record<string, unknown>;

// ---------------------------------------------------------------------------
// Minimal local typings for Riot instances
// ---------------------------------------------------------------------------

interface RiotModule {
  component(
    wrapper: RiotComponentWrapper,
  ): (
    element: HTMLElement,
    props?: Record<string, unknown>,
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
  riotProps?: Record<string, unknown>;
  /**
   * HTML tag to use for the container element.
   * @default "div"
   */
  containerTag?: string;
  /** Optional CSS class name for the container element. */
  className?: string;
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
}: RiotMountProps): JSX.Element {
  const containerRef = useRef<HTMLElement | null>(null);
  const instanceRef = useRef<RiotInstance | null>(null);
  const lastAppliedPropsRef = useRef<Record<string, unknown>>(EMPTY_RIOT_PROPS);
  const stableRiotProps = riotProps ?? EMPTY_RIOT_PROPS;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const riot = riotRuntime as unknown as RiotModule;
    const mountFn = riot.component(component);
    instanceRef.current = mountFn(container, stableRiotProps);
    lastAppliedPropsRef.current = stableRiotProps;

    return () => {
      if (instanceRef.current) {
        instanceRef.current.unmount(true);
        instanceRef.current = null;
      }
      lastAppliedPropsRef.current = EMPTY_RIOT_PROPS;
    };
  }, [component]);

  useEffect(() => {
    if (!instanceRef.current) return;
    if (lastAppliedPropsRef.current === stableRiotProps) return;

    updateRiotInstance(instanceRef.current, stableRiotProps, true);
    lastAppliedPropsRef.current = stableRiotProps;
  }, [stableRiotProps]);

  return createElement(containerTag, { ref: containerRef, className });
}
