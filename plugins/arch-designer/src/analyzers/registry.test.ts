import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyzerRegistry, runAllAnalyzers } from './registry';
import { BaseAnalyzer } from './base';
import type { AnalyzerResult } from '../graph/types';

// Mock analyzer for testing
class MockAnalyzer extends BaseAnalyzer {
  name = 'mock';
  protected filePatterns = ['*.mock'];

  constructor(
    private canAnalyzeResult: boolean,
    private analyzeResult: AnalyzerResult
  ) {
    super();
  }

  async canAnalyze(): Promise<boolean> {
    return this.canAnalyzeResult;
  }

  async analyze(): Promise<AnalyzerResult> {
    return this.analyzeResult;
  }
}

describe('AnalyzerRegistry', () => {
  let registry: AnalyzerRegistry;

  beforeEach(() => {
    registry = new AnalyzerRegistry();
  });

  it('should register analyzers', () => {
    const analyzer = new MockAnalyzer(true, { nodes: [], edges: [], groups: [], sourceFiles: [] });
    registry.register(analyzer);

    expect(registry.getAnalyzers()).toHaveLength(1);
  });

  it('should register multiple analyzers', () => {
    const analyzer1 = new MockAnalyzer(true, { nodes: [], edges: [], groups: [], sourceFiles: [] });
    const analyzer2 = new MockAnalyzer(true, { nodes: [], edges: [], groups: [], sourceFiles: [] });

    registry.register(analyzer1);
    registry.register(analyzer2);

    expect(registry.getAnalyzers()).toHaveLength(2);
  });

  it('should run only applicable analyzers', async () => {
    const applicableAnalyzer = new MockAnalyzer(true, {
      nodes: [{ id: 'n1', name: 'Node1', type: 'compute', metadata: {} }],
      edges: [],
      groups: [],
      sourceFiles: ['file1.mock']
    });

    const notApplicableAnalyzer = new MockAnalyzer(false, {
      nodes: [{ id: 'n2', name: 'Node2', type: 'database', metadata: {} }],
      edges: [],
      groups: [],
      sourceFiles: ['file2.mock']
    });

    registry.register(applicableAnalyzer);
    registry.register(notApplicableAnalyzer);

    const results = await registry.analyzeAll('/project');

    expect(results).toHaveLength(1);
    expect(results[0].nodes[0].id).toBe('n1');
  });

  it('should return empty array when no analyzers are applicable', async () => {
    const analyzer = new MockAnalyzer(false, { nodes: [], edges: [], groups: [], sourceFiles: [] });
    registry.register(analyzer);

    const results = await registry.analyzeAll('/project');

    expect(results).toHaveLength(0);
  });
});

describe('runAllAnalyzers', () => {
  it('should return combined results from all analyzers', async () => {
    const result = await runAllAnalyzers('/project');

    // Should return an array of AnalyzerResult
    expect(Array.isArray(result)).toBe(true);
  });
});
