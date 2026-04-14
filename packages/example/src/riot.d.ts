/**
 * TypeScript module declarations for Riot single-file components.
 *
 * The `@riotjs/vite-plugin` transforms `.riot` files into JS modules at build
 * time.  This declaration tells TypeScript to treat any `.riot` import as a
 * `RiotComponentWrapper` so you get correct types without per-file declarations.
 */
declare module '*.riot' {
  const component: (import('@riot-jsx/base').RiotComponentWrapper);
  export default component;
}

/**
 * Type bridge: allow Riot's `register` API to accept wrappers produced by
 * `@riot-jsx/base` without explicit casts in application code.
 */
declare module 'riot' {
  export function register(
    componentName: string,
    wrapper: import('@riot-jsx/base').RiotComponentWrapper,
  ): RegisteredComponentsMap;
}

declare module 'rollup-plugin-riot';
