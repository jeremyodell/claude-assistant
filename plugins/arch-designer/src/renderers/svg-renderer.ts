import type { LayoutResult, PositionedNode, PositionedEdge } from '../layout/dagre-layout';
import { getBackgroundColor, getBorderColor, getTextColor, CONNECTION_COLORS, ANIMATION_COLORS } from './colors';

export interface RenderOptions {
  width?: number;
  height?: number;
  animate?: boolean;
  padding?: number;
}

const DEFAULT_OPTIONS: Required<RenderOptions> = {
  width: 800,
  height: 600,
  animate: true,
  padding: 40
};

/**
 * Render a laid-out graph to SVG string.
 */
export function renderToSvg(layout: LayoutResult, options: RenderOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, animate, padding } = opts;

  const viewBoxWidth = layout.width + padding * 2 || width;
  const viewBoxHeight = layout.height + padding * 2 || height;

  const parts: string[] = [];

  // SVG header
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">`);

  // Defs (markers, gradients)
  parts.push(renderDefs());

  // Styles
  parts.push(renderStyles());

  // Background
  parts.push(`<rect width="100%" height="100%" fill="#FAFAFA"/>`);

  // Content group with padding offset
  parts.push(`<g transform="translate(${padding}, ${padding})">`);

  // Render edges first (behind nodes)
  for (const edge of layout.edges) {
    parts.push(renderEdge(edge, animate));
  }

  // Render nodes
  for (const node of layout.nodes) {
    parts.push(renderNode(node));
  }

  parts.push('</g>');
  parts.push('</svg>');

  return parts.join('\n');
}

function renderDefs(): string {
  return `
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="${CONNECTION_COLORS.default}"/>
    </marker>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/>
    </filter>
  </defs>`;
}

function renderStyles(): string {
  return `
  <style>
    .node-rect { rx: 8; ry: 8; }
    .node-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 500; }
    .node-badge { font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .edge-path { fill: none; stroke-width: 2; }
  </style>`;
}

function renderNode(node: PositionedNode): string {
  const x = node.x - node.width / 2;
  const y = node.y - node.height / 2;

  const bgColor = getBackgroundColor(node.type);
  const borderColor = getBorderColor(node.type);
  const textColor = getTextColor(node.type);

  const serviceBadge = node.service
    ? `<text x="${node.x}" y="${y + node.height - 8}" text-anchor="middle" class="node-badge" fill="${borderColor}">${node.service.toUpperCase()}</text>`
    : '';

  return `
  <g class="node" data-id="${node.id}">
    <rect class="node-rect" x="${x}" y="${y}" width="${node.width}" height="${node.height}"
          fill="${bgColor}" stroke="${borderColor}" stroke-width="2" filter="url(#shadow)"/>
    <text x="${node.x}" y="${node.y + 4}" text-anchor="middle" class="node-text" fill="${textColor}">${escapeXml(node.name)}</text>
    ${serviceBadge}
  </g>`;
}

function renderEdge(edge: PositionedEdge, animate: boolean): string {
  if (edge.points.length < 2) return '';

  const pathData = createPathFromPoints(edge.points);
  const animation = animate ? renderFlowAnimation(edge.points) : '';

  return `
  <g class="edge" data-id="${edge.id}">
    <path class="edge-path" d="${pathData}" stroke="${CONNECTION_COLORS.default}" marker-end="url(#arrowhead)"/>
    ${animation}
  </g>`;
}

function createPathFromPoints(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';

  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;

  for (const point of rest) {
    d += ` L ${point.x} ${point.y}`;
  }

  return d;
}

function renderFlowAnimation(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return '';

  const pathData = createPathFromPoints(points);

  return `
    <circle r="4" fill="${ANIMATION_COLORS.flowDot}">
      <animateMotion dur="2s" repeatCount="indefinite" path="${pathData}"/>
    </circle>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
