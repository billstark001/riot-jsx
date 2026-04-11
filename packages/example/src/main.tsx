/**
 * Application entry point.
 *
 * Registration order:
 *   1. Register `preact-counter` with Riot so that RiotPanel.riot can use it.
 *   2. Render the root Preact application.
 */
import { render, h } from 'preact';
import { register } from 'riot';
import PreactCounterWrapper from './connectors/PreactCounter.connector.js';
import { App } from './App.js';

// Register the Preact-backed counter as a Riot component.
// Any .riot file that contains <preact-counter /> will resolve to it.
register('preact-counter', PreactCounterWrapper);

// Mount the Preact application tree
const root = document.getElementById('app');
if (!root) throw new Error('#app element not found');
render(h(App, {}), root);
