/**
 * Application entry point.
 *
 * Registration order:
 *   1. Register Preact-backed Riot tags.
 *   2. Render the root Preact application.
 */
import { render, h } from 'preact';
import { App } from './App.js';

// Mount the Preact application tree.
const root = document.getElementById('app');
if (!root) throw new Error('#app element not found');
render(h(App, {}), root);
