import { describe, it, expect } from 'vitest';
import { layoutGraph, type LayoutResult, type PositionedNode, type PositionedEdge } from './dagre-layout';
import type { ArchitectureGraph } from '../graph/types';

describe('layoutGraph', () => {
  it('should return empty layout for empty graph', () => {
    const graph: ArchitectureGraph = {
      nodes: [],
      edges: [],
      groups: [],
      metadata: {
        projectName: 'test',
        techStack: [],
        analyzedAt: new Date().toISOString()
      }
    };

    const result = layoutGraph(graph);

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('should position nodes with x,y coordinates', () => {
    const graph: ArchitectureGraph = {
      nodes: [
        { id: 'n1', name: 'Node1', type: 'compute', metadata: {} },
        { id: 'n2', name: 'Node2', type: 'database', metadata: {} }
      ],
      edges: [
        { id: 'e1', from: 'n1', to: 'n2', type: 'query' }
      ],
      groups: [],
      metadata: {
        projectName: 'test',
        techStack: [],
        analyzedAt: new Date().toISOString()
      }
    };

    const result = layoutGraph(graph);

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0]).toHaveProperty('x');
    expect(result.nodes[0]).toHaveProperty('y');
    expect(result.nodes[0]).toHaveProperty('width');
    expect(result.nodes[0]).toHaveProperty('height');
  });

  it('should position edges with points', () => {
    const graph: ArchitectureGraph = {
      nodes: [
        { id: 'n1', name: 'Node1', type: 'compute', metadata: {} },
        { id: 'n2', name: 'Node2', type: 'database', metadata: {} }
      ],
      edges: [
        { id: 'e1', from: 'n1', to: 'n2', type: 'query' }
      ],
      groups: [],
      metadata: {
        projectName: 'test',
        techStack: [],
        analyzedAt: new Date().toISOString()
      }
    };

    const result = layoutGraph(graph);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toHaveProperty('points');
    expect(result.edges[0].points.length).toBeGreaterThan(0);
  });

  it('should include original node data', () => {
    const graph: ArchitectureGraph = {
      nodes: [
        { id: 'n1', name: 'Lambda', type: 'compute', provider: 'aws', service: 'lambda', metadata: { runtime: 'nodejs18.x' } }
      ],
      edges: [],
      groups: [],
      metadata: {
        projectName: 'test',
        techStack: [],
        analyzedAt: new Date().toISOString()
      }
    };

    const result = layoutGraph(graph);

    expect(result.nodes[0].id).toBe('n1');
    expect(result.nodes[0].name).toBe('Lambda');
    expect(result.nodes[0].type).toBe('compute');
    expect(result.nodes[0].service).toBe('lambda');
  });

  it('should return canvas dimensions', () => {
    const graph: ArchitectureGraph = {
      nodes: [
        { id: 'n1', name: 'Node1', type: 'compute', metadata: {} },
        { id: 'n2', name: 'Node2', type: 'database', metadata: {} }
      ],
      edges: [],
      groups: [],
      metadata: {
        projectName: 'test',
        techStack: [],
        analyzedAt: new Date().toISOString()
      }
    };

    const result = layoutGraph(graph);

    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it('should handle graph with multiple connections', () => {
    const graph: ArchitectureGraph = {
      nodes: [
        { id: 'api', name: 'API', type: 'api', metadata: {} },
        { id: 'fn1', name: 'Function1', type: 'compute', metadata: {} },
        { id: 'fn2', name: 'Function2', type: 'compute', metadata: {} },
        { id: 'db', name: 'Database', type: 'database', metadata: {} }
      ],
      edges: [
        { id: 'e1', from: 'api', to: 'fn1', type: 'invoke' },
        { id: 'e2', from: 'api', to: 'fn2', type: 'invoke' },
        { id: 'e3', from: 'fn1', to: 'db', type: 'query' },
        { id: 'e4', from: 'fn2', to: 'db', type: 'query' }
      ],
      groups: [],
      metadata: {
        projectName: 'test',
        techStack: [],
        analyzedAt: new Date().toISOString()
      }
    };

    const result = layoutGraph(graph);

    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(4);
  });
});
