import { createElement, useRef, useEffect } from 'react';
import type { JSX } from 'react';
import * as riotRuntime from 'riot';
import type { RiotComponentWrapper, RiotInstance } from '@riot-jsx/base';
import { updateRiotInstance } from '@riot-jsx/base';

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
   * Stabilise this object with `useMemo` to avoid redundant Riot re-renders.
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
 * - **Updated** on every render where `riotProps` has changed.
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
  riotProps = {},
  containerTag = 'div',
  className,
}: RiotMountProps): JSX.Element {
  const containerRef = useRef<HTMLElement | null>(null);
  const instanceRef = useRef<RiotInstance | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const riot = riotRuntime as unknown as RiotModule;
    const mountFn = riot.component(component);
    instanceRef.current = mountFn(container, riotProps);

    return () => {
      if (instanceRef.current) {
        instanceRef.current.unmount(true);
        instanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (instanceRef.current) {
      updateRiotInstance(instanceRef.current, riotProps, true);
    }
  });

  return createElement(containerTag, { ref: containerRef, className });
}
