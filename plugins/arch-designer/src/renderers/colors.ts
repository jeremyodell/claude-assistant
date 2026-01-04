import type { ComponentType } from '../graph/types';

/**
 * Color scheme for a component type.
 */
export interface ColorScheme {
  primary: string;   // Main color (borders, icons)
  light: string;     // Background fill
  dark: string;      // Text, emphasis
}

/**
 * ByteByteGo-inspired color palette for architecture components.
 * Colors are semantic - each category has a distinct, recognizable hue.
 */
export const COMPONENT_COLORS: Record<ComponentType, ColorScheme> = {
  // Frontend - Blue (trust, stability)
  frontend: {
    primary: '#4A90D9',
    light: '#E8F4FD',
    dark: '#2563EB'
  },

  // API Layer - Purple (gateway, orchestration)
  api: {
    primary: '#7B68EE',
    light: '#F0EDFF',
    dark: '#5B4ACF'
  },

  // Compute - Green (action, processing)
  compute: {
    primary: '#50C878',
    light: '#E8FAF0',
    dark: '#059669'
  },

  // Database - Orange (data, persistence)
  database: {
    primary: '#FF8C42',
    light: '#FFF4EC',
    dark: '#EA580C'
  },

  // Cache - Light Blue (speed, ephemeral)
  cache: {
    primary: '#38BDF8',
    light: '#E0F7FF',
    dark: '#0284C7'
  },

  // Storage - Amber (files, objects)
  storage: {
    primary: '#F59E0B',
    light: '#FFFBEB',
    dark: '#D97706'
  },

  // Queue/Messaging - Gold (events, async)
  queue: {
    primary: '#FFD700',
    light: '#FFFCE8',
    dark: '#B8860B'
  },

  // Streaming - Teal (flow, continuous)
  stream: {
    primary: '#14B8A6',
    light: '#E6FFFC',
    dark: '#0D9488'
  },

  // CDN - Sky Blue (distribution, edge)
  cdn: {
    primary: '#0EA5E9',
    light: '#E0F2FE',
    dark: '#0369A1'
  },

  // Auth/Security - Red (protection, critical)
  auth: {
    primary: '#DC143C',
    light: '#FEE2E2',
    dark: '#B91C1C'
  },

  // Monitoring - Indigo (observability)
  monitoring: {
    primary: '#6366F1',
    light: '#EEF2FF',
    dark: '#4338CA'
  },

  // External Services - Gray (third-party)
  external: {
    primary: '#6B7280',
    light: '#F3F4F6',
    dark: '#374151'
  },

  // Users - Slate (people, actors)
  user: {
    primary: '#64748B',
    light: '#F1F5F9',
    dark: '#334155'
  }
};

/**
 * Default color scheme for unknown types.
 */
const DEFAULT_COLORS: ColorScheme = {
  primary: '#6B7280',
  light: '#F3F4F6',
  dark: '#374151'
};

/**
 * Get the full color scheme for a component type.
 */
export function getColorForType(type: ComponentType): ColorScheme {
  return COMPONENT_COLORS[type] || DEFAULT_COLORS;
}

/**
 * Get the background color for a component type.
 */
export function getBackgroundColor(type: ComponentType): string {
  return getColorForType(type).light;
}

/**
 * Get the border color for a component type.
 */
export function getBorderColor(type: ComponentType): string {
  return getColorForType(type).primary;
}

/**
 * Get the text color for a component type.
 */
export function getTextColor(type: ComponentType): string {
  return getColorForType(type).dark;
}

/**
 * Connection line colors.
 */
export const CONNECTION_COLORS = {
  default: '#94A3B8',
  active: '#3B82F6',
  error: '#EF4444',
  success: '#22C55E'
};

/**
 * Animation colors for flow effects.
 */
export const ANIMATION_COLORS = {
  flowDot: '#3B82F6',
  pulse: '#60A5FA',
  highlight: '#FCD34D'
};
