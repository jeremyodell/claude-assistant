import { describe, it, expect } from 'vitest';

// Test that all public API exports are accessible
import {
  // Types
  type Provider,
  type ComponentType,
  type ConnectionType,
  type GroupType,
  type Component,
  type Connection,
  type LogicalGroup,
  type ProjectMetadata,
  type ArchitectureGraph,
  type AnalyzerResult,

  // Graph
  GraphBuilder,

  // Analyzers
  BaseAnalyzer,
  TerraformAnalyzer,
  DockerComposeAnalyzer,
  AnalyzerRegistry,
  createDefaultRegistry,
  runAllAnalyzers,

  // Layout
  type PositionedNode,
  type PositionedEdge,
  type LayoutResult,
  layoutGraph,

  // Renderer
  type RenderOptions,
  type ColorScheme,
  COMPONENT_COLORS,
  CONNECTION_COLORS,
  ANIMATION_COLORS,
  getColorForType,
  getBackgroundColor,
  getBorderColor,
  getTextColor,
  renderToSvg,

  // Convenience
  generateArchitecture
} from './index';

describe('Public API', () => {
  it('should export GraphBuilder', () => {
    const builder = new GraphBuilder('test');
    expect(builder).toBeInstanceOf(GraphBuilder);
  });

  it('should export AnalyzerRegistry and factory', () => {
    const registry = createDefaultRegistry();
    expect(registry).toBeInstanceOf(AnalyzerRegistry);
  });

  it('should export individual analyzers', () => {
    const terraform = new TerraformAnalyzer();
    const docker = new DockerComposeAnalyzer();
    expect(terraform.name).toBe('terraform');
    expect(docker.name).toBe('docker-compose');
  });

  it('should export layout function', () => {
    const result = layoutGraph({ nodes: [], edges: [], groups: [], metadata: { projectName: 'test', techStack: [], analyzedAt: '' } });
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('should export color constants', () => {
    expect(COMPONENT_COLORS.compute.primary).toBe('#50C878');
    expect(CONNECTION_COLORS.default).toBe('#94A3B8');
    expect(ANIMATION_COLORS.flowDot).toBe('#3B82F6');
  });

  it('should export color functions', () => {
    expect(getColorForType('database').primary).toBe('#FF8C42');
    expect(getBackgroundColor('frontend')).toBe('#E8F4FD');
    expect(getBorderColor('api')).toBe('#7B68EE');
    expect(getTextColor('compute')).toBe('#059669');
  });

  it('should export renderToSvg', () => {
    const svg = renderToSvg({ nodes: [], edges: [], width: 100, height: 100 });
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should export generateArchitecture convenience function', () => {
    expect(typeof generateArchitecture).toBe('function');
  });
});

describe('generateArchitecture', () => {
  it('should return complete result with SVG', async () => {
    // Use a path with no matching files - should still work with empty graph
    const result = await generateArchitecture('/nonexistent');

    expect(result.graph).toBeDefined();
    expect(result.layout).toBeDefined();
    expect(result.svg).toBeDefined();
    expect(result.svg).toContain('<svg');
  });
});
