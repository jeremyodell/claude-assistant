import { describe, it, expect } from 'vitest';
import { BaseAnalyzer } from './base';
import type { AnalyzerResult } from '../graph/types';

// Concrete implementation for testing
class TestAnalyzer extends BaseAnalyzer {
  name = 'test-analyzer';

  protected filePatterns = ['*.test'];

  async canAnalyze(projectPath: string): Promise<boolean> {
    // For testing, check if path starts with '/valid'
    return projectPath.startsWith('/valid');
  }

  async analyze(projectPath: string): Promise<AnalyzerResult> {
    return {
      nodes: [
        { id: 'test-node', name: 'Test Node', type: 'compute', metadata: { path: projectPath } }
      ],
      edges: [],
      groups: [],
      sourceFiles: ['test.file']
    };
  }
}

describe('BaseAnalyzer', () => {
  it('should have a name property', () => {
    const analyzer = new TestAnalyzer();
    expect(analyzer.name).toBe('test-analyzer');
  });

  it('should implement canAnalyze', async () => {
    const analyzer = new TestAnalyzer();

    expect(await analyzer.canAnalyze('/valid/project')).toBe(true);
    expect(await analyzer.canAnalyze('/invalid/project')).toBe(false);
  });

  it('should implement analyze', async () => {
    const analyzer = new TestAnalyzer();
    const result = await analyzer.analyze('/some/project');

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('test-node');
    expect(result.sourceFiles).toContain('test.file');
  });

  it('should return empty result from base createEmptyResult', () => {
    const analyzer = new TestAnalyzer();
    const empty = analyzer.createEmptyResult();

    expect(empty.nodes).toHaveLength(0);
    expect(empty.edges).toHaveLength(0);
    expect(empty.groups).toHaveLength(0);
    expect(empty.sourceFiles).toHaveLength(0);
  });
});
