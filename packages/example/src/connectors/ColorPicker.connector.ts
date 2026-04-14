/**
 * connector for ColorPicker
 *
 * Wraps the pure Preact ColorPicker as a Riot tag (no Redux).
 * Demonstrates connectRenderer without any store connection.
 */
import { connectRenderer } from '@riot-jsx/base';
import { createPreactRenderer } from '@riot-jsx/preact';
import { ColorPicker } from '../components/ColorPicker.js';

const renderer = createPreactRenderer();

const ColorPickerWrapper = connectRenderer(ColorPicker, {
  name: 'color-picker',
  renderer,
});

export default ColorPickerWrapper;
