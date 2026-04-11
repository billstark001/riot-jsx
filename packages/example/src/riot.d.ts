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
