import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { THEME_KEY, normalizeTheme, revealRadius } from '../lib/theme/theme.js';
import { CHART_PALETTE } from '../lib/theme/palette.js';

describe('lib/theme/theme.js', () => {
  test('THEME_KEY is upvalor_theme', () => {
    assert.equal(THEME_KEY, 'upvalor_theme');
  });

  test('normalizeTheme returns light only for "light"', () => {
    assert.equal(normalizeTheme('light'), 'light');
    assert.equal(normalizeTheme('dark'), 'dark');
    assert.equal(normalizeTheme(null), 'dark');
    assert.equal(normalizeTheme(undefined), 'dark');
    assert.equal(normalizeTheme(''), 'dark');
    assert.equal(normalizeTheme('blue'), 'dark');
    assert.equal(normalizeTheme(123), 'dark');
    assert.equal(normalizeTheme({}), 'dark');
  });

  test('revealRadius calculates max distance to corners', () => {
    assert.equal(revealRadius(0, 0, 300, 400), 500);
    assert.equal(revealRadius(300, 400, 300, 400), 500);
    assert.equal(revealRadius(150, 200, 300, 400), 250);
  });
});

describe('lib/theme/palette.js', () => {
  test('CHART_PALETTE has dark and light palettes with all required keys', () => {
    const expectedKeys = [
      'pos',
      'neg',
      'warn',
      'traffic',
      'accent',
      'grid',
      'axis',
      'tooltipBg',
      'tooltipBorder',
      'tooltipFg',
    ];

    assert.ok(CHART_PALETTE.dark, 'CHART_PALETTE.dark must be defined');
    assert.ok(CHART_PALETTE.light, 'CHART_PALETTE.light must be defined');

    for (const key of expectedKeys) {
      assert.ok(CHART_PALETTE.dark[key], `dark palette missing key ${key}`);
      assert.ok(CHART_PALETTE.light[key], `light palette missing key ${key}`);
    }

    assert.equal(CHART_PALETTE.dark.pos, '#34d399');
    assert.equal(CHART_PALETTE.dark.neg, '#fb7185');
    assert.equal(CHART_PALETTE.dark.warn, '#fb923c');
    assert.equal(CHART_PALETTE.dark.traffic, '#c084fc');
    assert.equal(CHART_PALETTE.dark.accent, '#3b82f6');
    assert.equal(CHART_PALETTE.dark.grid, 'rgba(255,255,255,0.06)');
    assert.equal(CHART_PALETTE.dark.axis, '#8c96a9');
    assert.equal(CHART_PALETTE.dark.tooltipBg, '#1c202b');
    assert.equal(CHART_PALETTE.dark.tooltipBorder, 'rgba(255,255,255,0.14)');
    assert.equal(CHART_PALETTE.dark.tooltipFg, '#f1f5f9');

    assert.equal(CHART_PALETTE.light.pos, '#047857');
    assert.equal(CHART_PALETTE.light.neg, '#be123c');
    assert.equal(CHART_PALETTE.light.warn, '#c2410c');
    assert.equal(CHART_PALETTE.light.traffic, '#7e22ce');
    assert.equal(CHART_PALETTE.light.accent, '#2563eb');
    assert.equal(CHART_PALETTE.light.grid, '#e2e7f0');
    assert.equal(CHART_PALETTE.light.axis, '#5f6b7d');
    assert.equal(CHART_PALETTE.light.tooltipBg, '#ffffff');
    assert.equal(CHART_PALETTE.light.tooltipBorder, '#cbd3e1');
    assert.equal(CHART_PALETTE.light.tooltipFg, '#0f172a');
  });
});
