import { describe, it, expect } from 'vitest';
import {
  getColorForType,
  getBackgroundColor,
  getBorderColor,
  getTextColor,
  COMPONENT_COLORS,
  type ColorScheme
} from './colors';

describe('Color Palette', () => {
  describe('COMPONENT_COLORS', () => {
    it('should have colors for all component types', () => {
      const requiredTypes = [
        'frontend',
        'api',
        'compute',
        'database',
        'cache',
        'storage',
        'queue',
        'stream',
        'cdn',
        'auth',
        'monitoring',
        'external',
        'user'
      ];

      for (const type of requiredTypes) {
        expect(COMPONENT_COLORS[type as keyof typeof COMPONENT_COLORS]).toBeDefined();
      }
    });

    it('should have valid hex color values', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

      for (const [type, colors] of Object.entries(COMPONENT_COLORS)) {
        expect(colors.primary).toMatch(hexColorRegex);
        expect(colors.light).toMatch(hexColorRegex);
        expect(colors.dark).toMatch(hexColorRegex);
      }
    });
  });

  describe('getColorForType', () => {
    it('should return color scheme for known types', () => {
      const colors = getColorForType('database');

      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('light');
      expect(colors).toHaveProperty('dark');
    });

    it('should return default colors for unknown types', () => {
      const colors = getColorForType('unknown' as any);

      expect(colors).toHaveProperty('primary');
    });
  });

  describe('getBackgroundColor', () => {
    it('should return light color for backgrounds', () => {
      const bg = getBackgroundColor('compute');

      expect(bg).toBe(COMPONENT_COLORS.compute.light);
    });
  });

  describe('getBorderColor', () => {
    it('should return primary color for borders', () => {
      const border = getBorderColor('database');

      expect(border).toBe(COMPONENT_COLORS.database.primary);
    });
  });

  describe('getTextColor', () => {
    it('should return dark color for text', () => {
      const text = getTextColor('api');

      expect(text).toBe(COMPONENT_COLORS.api.dark);
    });
  });
});
