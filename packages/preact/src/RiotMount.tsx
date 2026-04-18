import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import type { JSX, Ref } from 'preact';
import * as riotRuntime from 'riot';
import type { RiotComponentWrapper, RiotInstance } from '@riot-jsx/base';
import { updateRiotInstance } from '@riot-jsx/base';

const EMPTY_RIOT_PROPS = Object.freeze({}) as Record<string, unknown>;

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
  /** The compiled Riot component wrapper to mount inside this Preact node. */
  component: RiotComponentWrapper;
  /**
   * Props to forward into the Riot component.
  * Updates are driven by reference equality; pass a stable object
  * (for example via `useMemo`) to avoid unnecessary Riot updates.
   */
  riotProps?: Record<string, unknown>;
  /**
   * HTML tag to use for the container element that wraps the Riot component.
   * @default "div"
   */
  containerTag?: string;
  /** Optional CSS class name for the container element. */
  class?: string;
}

/**
 * A Preact component that mounts a Riot component into the Preact tree.
 *
 * This is the "entry point" for embedding legacy (or simply Riot-authored)
 * components inside a modern Preact application.  The Riot component is:
 *
 * - **Mounted** once, when this Preact component first appears in the DOM.
 * - **Updated** in place whenever the `riotProps` reference changes.
 * - **Unmounted** cleanly when this Preact component is removed from the tree.
 *
 * ### Peer dependencies
 * `riot` must be installed in the host project.
 *
 * @example
 * ```tsx
 * import { RiotMount } from '@riot-jsx/preact';
 * import LegacyChart from './legacy-chart.riot';
 *
 * function Dashboard({ data }: { data: unknown[] }) {
 *   return (
 *     <div>
 *       <RiotMount component={LegacyChart} riotProps={{ data, theme: 'dark' }} />
 *     </div>
 *   );
 * }
 * ```
 */
export function RiotMount({
  component,
  riotProps,
  containerTag = 'div',
  class: className,
}: RiotMountProps): JSX.Element {
  const containerRef = useRef<HTMLElement | null>(null);
  const instanceRef = useRef<RiotInstance | null>(null);
  const lastAppliedPropsRef = useRef<Record<string, unknown>>(EMPTY_RIOT_PROPS);
  const stableRiotProps = riotProps ?? EMPTY_RIOT_PROPS;

  // Mount once per wrapper instance — lifecycle tied to this Preact component.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const riot = riotRuntime as unknown as RiotModule;
    const mountFn = riot.component(component);
    instanceRef.current = mountFn(container, stableRiotProps);
    lastAppliedPropsRef.current = stableRiotProps;

    return () => {
      if (instanceRef.current) {
        // keepRootElement=true: leave the container in place so Preact does not
        // lose track of the DOM node during its own cleanup pass.
        instanceRef.current.unmount(true);
        instanceRef.current = null;
      }
      lastAppliedPropsRef.current = EMPTY_RIOT_PROPS;
    };
  }, [component]);

  // Only sync Riot props when the caller provides a new props object.
  useEffect(() => {
    if (!instanceRef.current) return;
    if (lastAppliedPropsRef.current === stableRiotProps) return;

    updateRiotInstance(instanceRef.current, stableRiotProps, true);
    lastAppliedPropsRef.current = stableRiotProps;
  }, [stableRiotProps]);

  // Use h() directly to avoid the over-broad JSX union type on dynamic tags
  return h(containerTag, {
    ref: containerRef as Ref<HTMLElement>,
    class: className,
  }) as JSX.Element;
}
