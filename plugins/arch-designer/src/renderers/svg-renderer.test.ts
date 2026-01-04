import { describe, it, expect } from 'vitest';
import { renderToSvg, type RenderOptions } from './svg-renderer';
import type { LayoutResult } from '../layout/dagre-layout';

describe('SVG Renderer', () => {
  const createSimpleLayout = (): LayoutResult => ({
    nodes: [
      { id: 'n1', name: 'API', type: 'api', x: 100, y: 50, width: 140, height: 60, metadata: {} },
      { id: 'n2', name: 'Database', type: 'database', x: 100, y: 150, width: 140, height: 60, metadata: {} }
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2', type: 'query', points: [{ x: 100, y: 80 }, { x: 100, y: 120 }] }
    ],
    width: 300,
    height: 250
  });

  it('should render valid SVG', () => {
    const layout = createSimpleLayout();
    const svg = renderToSvg(layout);

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should include viewBox attribute', () => {
    const layout = createSimpleLayout();
    const svg = renderToSvg(layout);

    expect(svg).toContain('viewBox=');
  });

  it('should render nodes as rectangles', () => {
    const layout = createSimpleLayout();
    const svg = renderToSvg(layout);

    expect(svg).toContain('<rect');
    expect(svg).toContain('API');
    expect(svg).toContain('Database');
  });

  it('should render edges as paths', () => {
    const layout = createSimpleLayout();
    const svg = renderToSvg(layout);

    expect(svg).toContain('<path');
  });

  it('should apply colors based on component type', () => {
    const layout = createSimpleLayout();
    const svg = renderToSvg(layout);

    // API is purple, Database is orange
    expect(svg).toContain('#7B68EE'); // API primary
    expect(svg).toContain('#FF8C42'); // Database primary
  });

  it('should include arrow markers for edges', () => {
    const layout = createSimpleLayout();
    const svg = renderToSvg(layout);

    expect(svg).toContain('<marker');
    expect(svg).toContain('marker-end');
  });

  it('should respect custom dimensions', () => {
    const layout = createSimpleLayout();
    const options: RenderOptions = { width: 800, height: 600 };
    const svg = renderToSvg(layout, options);

    expect(svg).toContain('width="800"');
    expect(svg).toContain('height="600"');
  });

  it('should add animation when enabled', () => {
    const layout = createSimpleLayout();
    const options: RenderOptions = { animate: true };
    const svg = renderToSvg(layout, options);

    expect(svg).toContain('<animate');
  });

  it('should not add animation when disabled', () => {
    const layout = createSimpleLayout();
    const options: RenderOptions = { animate: false };
    const svg = renderToSvg(layout, options);

    expect(svg).not.toContain('<animate');
  });

  it('should render empty graph without errors', () => {
    const layout: LayoutResult = { nodes: [], edges: [], width: 0, height: 0 };
    const svg = renderToSvg(layout);

    expect(svg).toContain('<svg');
  });
});
