import { describe, it, expect } from 'vitest';
import { GraphBuilder } from './builder';
import type { AnalyzerResult } from './types';

describe('GraphBuilder', () => {
  it('should create an empty graph', () => {
    const builder = new GraphBuilder('test-project');
    const graph = builder.build();

    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
    expect(graph.metadata.projectName).toBe('test-project');
  });

  it('should merge analyzer results', () => {
    const builder = new GraphBuilder('test-project');

    const terraformResult: AnalyzerResult = {
      nodes: [
        { id: 'lambda-1', name: 'Handler', type: 'compute', provider: 'aws', service: 'lambda', metadata: {} }
      ],
      edges: [],
      groups: [],
      sourceFiles: ['main.tf']
    };

    const appResult: AnalyzerResult = {
      nodes: [
        { id: 'db-1', name: 'Users DB', type: 'database', provider: 'aws', service: 'dynamodb', metadata: {} }
      ],
      edges: [
        { id: 'e1', from: 'lambda-1', to: 'db-1', type: 'query' }
      ],
      groups: [],
      sourceFiles: ['handler.ts']
    };

    builder.merge(terraformResult);
    builder.merge(appResult);

    const graph = builder.build();

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.metadata.sourceFiles).toContain('main.tf');
    expect(graph.metadata.sourceFiles).toContain('handler.ts');
  });

  it('should deduplicate nodes by id', () => {
    const builder = new GraphBuilder('test-project');

    const result1: AnalyzerResult = {
      nodes: [{ id: 'svc-1', name: 'Service', type: 'compute', metadata: {} }],
      edges: [],
      groups: [],
      sourceFiles: []
    };

    const result2: AnalyzerResult = {
      nodes: [{ id: 'svc-1', name: 'Service Updated', type: 'compute', metadata: { extra: true } }],
      edges: [],
      groups: [],
      sourceFiles: []
    };

    builder.merge(result1);
    builder.merge(result2);

    const graph = builder.build();

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].name).toBe('Service Updated'); // Later wins
  });

  it('should add nodes and edges manually', () => {
    const builder = new GraphBuilder('test-project');

    builder.addNode({
      id: 'user',
      name: 'User',
      type: 'user',
      metadata: {}
    });

    builder.addEdge({
      id: 'user-to-api',
      from: 'user',
      to: 'api',
      type: 'http'
    });

    const graph = builder.build();

    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(1);
  });

  it('should merge groups from analyzer results', () => {
    const builder = new GraphBuilder('test-project');

    const result: AnalyzerResult = {
      nodes: [],
      edges: [],
      groups: [
        { id: 'vpc-1', name: 'Main VPC', type: 'vpc', children: ['subnet-1'] }
      ],
      sourceFiles: ['network.tf']
    };

    builder.merge(result);
    const graph = builder.build();

    expect(graph.groups).toHaveLength(1);
    expect(graph.groups[0].name).toBe('Main VPC');
  });

  it('should track tech stack from services', () => {
    const builder = new GraphBuilder('test-project');

    const result: AnalyzerResult = {
      nodes: [
        { id: 'fn-1', name: 'Function', type: 'compute', provider: 'aws', service: 'lambda', metadata: {} },
        { id: 'db-1', name: 'Database', type: 'database', provider: 'aws', service: 'dynamodb', metadata: {} }
      ],
      edges: [],
      groups: [],
      sourceFiles: []
    };

    builder.merge(result);
    const graph = builder.build();

    expect(graph.metadata.techStack).toContain('lambda');
    expect(graph.metadata.techStack).toContain('dynamodb');
    expect(graph.metadata.cloudProvider).toBe('aws');
  });
});
