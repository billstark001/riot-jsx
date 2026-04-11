/**
 * CSS scoping utilities for riot-jsx.
 *
 * ## Background
 *
 * Riot's built-in CSS manager already handles scoping for flat CSS: it reads
 * the `css` field of a component wrapper and automatically prefixes every rule
 * with `[is="<tag-name>"]` before injecting a `<style>` element.
 *
 * **If your component CSS uses only flat selectors you do NOT need these
 * utilities** — just pass the raw CSS string in the `css` field and Riot
 * handles the rest.
 *
 * These utilities are needed when:
 * 1. You use `&` nesting syntax (e.g. `& .child { }`) which Riot's CSS manager
 *    does not understand.
 * 2. You want to inject styles yourself (bypassing Riot's CSS manager) and need
 *    full control over the generated selectors.
 *
 * In both cases call the utility with the tag's scope selector
 * (`[is="my-tag"]`) to obtain flat, prefixed CSS that you can inject into a
 * `<style>` element directly.  Do **not** pass this pre-scoped output back
 * through Riot's `css` field — Riot would add a second `[is="…"]` prefix.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A function that transforms a raw CSS string by adding a scope prefix. */
export type CSSTransformer = (css: string, scopeSelector: string) => string;

/**
 * Minimal typing for a `stylis`-compatible module (optional peer dependency).
 * See https://github.com/thysultan/stylis
 */
export interface StylisModule {
  compile(css: string): unknown[];
  // stylis serializer plugins are functions; typed as `never` here to keep the
  // interface dependency-free while still allowing correct call-site typing.
  serialize(ast: unknown[], ...plugins: unknown[]): string;
  stringify: unknown;
}

// ---------------------------------------------------------------------------
// Native (built-in) implementation
// ---------------------------------------------------------------------------

/**
 * Scope a flat CSS string by prepending every selector with `scopeSelector`.
 *
 * Rules:
 * - `:host` / `:root` → replaced by `scopeSelector` itself
 * - `html` / `body` prefixes → scope is inserted after the tag
 * - `@keyframes` frame selectors (`from`, `to`, percentages) → preserved
 * - `@`-rule headers (e.g. `@media`, `@keyframes`) → preserved; inner flat
 *   rules are matched and prefixed via the same regex pass
 * - CSS comments → stripped before processing
 *
 * **Limitations:** does not handle `&` nesting syntax.  Use
 * {@link scopeCSSWithStylis} for that.
 *
 * @param css           - Raw flat CSS string
 * @param scopeSelector - Selector to prepend, e.g. `[is="my-tag"]`
 * @returns CSS with every rule anchored to `scopeSelector`
 *
 * @example
 * ```ts
 * scopeCSSNative('.btn { color: red }', '[is="my-tag"]');
 * // → '[is="my-tag"] .btn { color: red }'
 * ```
 */
export function scopeCSSNative(css: string, scopeSelector: string): string {
  // Remove CSS comments first so they cannot contain fake rule blocks
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');

  return stripped.replace(
    /([^{}]+)\{([^{}]*)\}/g,
    (match, selector: string, body: string) => {
      const trimmed = selector.trim();

      // Preserve @keyframes frame-selectors: from · to · 0% · 33.3% · etc.
      if (/^(from|to|\d+(\.\d+)?%?)$/.test(trimmed)) return match;

      // Preserve @-rule headers (their inner rules are caught by the regex too)
      if (/^@/.test(trimmed)) return match;

      const prefixed = trimmed
        .split(',')
        .map((s) => {
          const t = s.trim();
          if (!t) return t;
          if (t === ':host' || t === ':root') return scopeSelector;
          if (/^(html|body)\b/.test(t))
            return t.replace(/^(html|body)\b/, `$& ${scopeSelector}`);
          return `${scopeSelector} ${t}`;
        })
        .join(', ');

      return `${prefixed} {${body}}`;
    },
  );
}

// ---------------------------------------------------------------------------
// Stylis-backed implementation (optional peer dependency)
// ---------------------------------------------------------------------------

/**
 * Scope a CSS string — including `&`-nested rules — using `stylis`.
 *
 * `stylis` must be passed explicitly as the `stylisModule` argument.  This
 * keeps the function environment-agnostic and lets
 * bundlers tree-shake stylis when this function is not used.
 *
 * Install: `npm i stylis`
 *
 * @param css           - Raw CSS string, may use `&` nesting
 * @param scopeSelector - Selector to anchor styles to, e.g. `[is="my-tag"]`
 * @param stylisModule  - The imported `stylis` module
 * @returns Flat, fully prefixed CSS string
 *
 * @example
 * ```ts
 * import * as stylis from 'stylis';
 *
 * const scoped = scopeCSSWithStylis(`
 *   & { display: flex; }
 *   & .title { font-size: 1.5rem; }
 * `, '[is="my-tag"]', stylis);
 * ```
 */
export function scopeCSSWithStylis(
  css: string,
  scopeSelector: string,
  stylisModule: StylisModule,
): string {
  const { compile, serialize, stringify } = stylisModule;
  // Wrap CSS in the scope selector so `&` resolves to the component root
  return serialize(compile(`${scopeSelector}{${css}}`), stringify);
}
