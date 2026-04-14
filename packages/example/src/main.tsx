/**
 * Application entry point.
 *
 * Registration order:
 *   1. Register Preact-backed Riot tags.
 *   2. Render the root Preact application.
 */
import { render, h } from 'preact';
import { register } from 'riot';
import PreactCounterWrapper from './connectors/PreactCounter.connector.js';
import ColorPickerWrapper from './connectors/ColorPicker.connector.js';
import { App } from './App.js';

// Register Preact components as Riot tags.
register('preact-counter', PreactCounterWrapper);
register('color-picker', ColorPickerWrapper);

// Mount the Preact application tree.
const root = document.getElementById('app');
if (!root) throw new Error('#app element not found');
render(h(App, {}), root);
