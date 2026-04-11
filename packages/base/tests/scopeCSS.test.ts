import { describe, it, expect } from 'vitest';
import { scopeCSSNative } from '../src/scopeCSS.js';

const SCOPE = '[is="my-tag"]';

describe('scopeCSSNative', () => {
  it('prefixes a simple class selector', () => {
    const result = scopeCSSNative('.btn { color: red; }', SCOPE);
    expect(result).toContain(`${SCOPE} .btn`);
  });

  it('prefixes multiple comma-separated selectors', () => {
    const result = scopeCSSNative('.a, .b { color: red; }', SCOPE);
    expect(result).toContain(`${SCOPE} .a`);
    expect(result).toContain(`${SCOPE} .b`);
  });

  it('replaces :host with the scope selector', () => {
    const result = scopeCSSNative(':host { display: block; }', SCOPE);
    expect(result).toBe(`${SCOPE} { display: block; }`);
  });

  it('replaces :root with the scope selector', () => {
    const result = scopeCSSNative(':root { --color: red; }', SCOPE);
    expect(result).toBe(`${SCOPE} { --color: red; }`);
  });

  it('inserts scope after html/body tags', () => {
    const result = scopeCSSNative('body { margin: 0; }', SCOPE);
    expect(result).toContain(`body ${SCOPE}`);
    expect(result).not.toContain(`${SCOPE} body`);
  });

  it('does not prefix @keyframes frame selectors', () => {
    const css = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    const result = scopeCSSNative(css, SCOPE);
    expect(result).toContain('from');
    expect(result).toContain('to');
    // Frame selectors should not be prefixed
    expect(result).not.toContain(`${SCOPE} from`);
    expect(result).not.toContain(`${SCOPE} to`);
  });

  it('preserves @keyframes header (at-rule) unchanged', () => {
    const css = '@keyframes spin { from {} }';
    const result = scopeCSSNative(css, SCOPE);
    expect(result).toContain('@keyframes spin');
  });

  it('strips CSS comments before processing', () => {
    const css = '/* .ignored { } */ .real { color: blue; }';
    const result = scopeCSSNative(css, SCOPE);
    expect(result).not.toContain('.ignored');
    expect(result).toContain(`${SCOPE} .real`);
  });

  it('handles element selectors', () => {
    const result = scopeCSSNative('p { line-height: 1.5; }', SCOPE);
    expect(result).toContain(`${SCOPE} p`);
  });

  it('handles attribute selectors', () => {
    const result = scopeCSSNative('[data-active] { opacity: 1; }', SCOPE);
    expect(result).toContain(`${SCOPE} [data-active]`);
  });

  it('handles pseudo-class selectors', () => {
    const result = scopeCSSNative('a:hover { text-decoration: none; }', SCOPE);
    expect(result).toContain(`${SCOPE} a:hover`);
  });

  it('returns empty string for empty input', () => {
    expect(scopeCSSNative('', SCOPE)).toBe('');
  });
});
