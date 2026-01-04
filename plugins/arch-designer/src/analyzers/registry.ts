import type { AnalyzerResult } from '../graph/types';
import { BaseAnalyzer } from './base';
import { TerraformAnalyzer } from './terraform';
import { DockerComposeAnalyzer } from './docker-compose';

/**
 * Registry for all infrastructure analyzers.
 * Manages analyzer registration and execution.
 */
export class AnalyzerRegistry {
  private analyzers: BaseAnalyzer[] = [];

  register(analyzer: BaseAnalyzer): void {
    this.analyzers.push(analyzer);
  }

  getAnalyzers(): BaseAnalyzer[] {
    return [...this.analyzers];
  }

  /**
   * Run all applicable analyzers against a project.
   * Returns results only from analyzers that can analyze the project.
   */
  async analyzeAll(projectPath: string): Promise<AnalyzerResult[]> {
    const results: AnalyzerResult[] = [];

    for (const analyzer of this.analyzers) {
      try {
        if (await analyzer.canAnalyze(projectPath)) {
          const result = await analyzer.analyze(projectPath);
          results.push(result);
        }
      } catch {
        // Skip analyzers that fail
      }
    }

    return results;
  }
}

/**
 * Create a registry with all built-in analyzers.
 */
export function createDefaultRegistry(): AnalyzerRegistry {
  const registry = new AnalyzerRegistry();

  registry.register(new TerraformAnalyzer());
  registry.register(new DockerComposeAnalyzer());

  return registry;
}

/**
 * Convenience function to run all analyzers against a project.
 */
export async function runAllAnalyzers(projectPath: string): Promise<AnalyzerResult[]> {
  const registry = createDefaultRegistry();
  return registry.analyzeAll(projectPath);
}
