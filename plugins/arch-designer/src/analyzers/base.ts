import type { AnalyzerResult } from '../graph/types';

/**
 * Base class for all infrastructure analyzers.
 * Each analyzer scans specific file types (Terraform, Docker, etc.)
 * and extracts architecture components.
 */
export abstract class BaseAnalyzer {
  /** Human-readable name for this analyzer */
  abstract readonly name: string;

  /** File patterns this analyzer handles (e.g., ['*.tf', '*.tfvars']) */
  protected abstract filePatterns: string[];

  /**
   * Check if this analyzer can process the given project.
   * Typically checks for presence of relevant files.
   */
  abstract canAnalyze(projectPath: string): Promise<boolean>;

  /**
   * Analyze the project and extract architecture components.
   * Returns nodes, edges, groups found in the codebase.
   */
  abstract analyze(projectPath: string): Promise<AnalyzerResult>;

  /**
   * Create an empty result - useful for early returns.
   */
  createEmptyResult(): AnalyzerResult {
    return {
      nodes: [],
      edges: [],
      groups: [],
      sourceFiles: []
    };
  }

  /**
   * Generate a unique ID for a component based on type and name.
   */
  protected generateId(type: string, name: string): string {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${type}-${sanitized}`;
  }
}
