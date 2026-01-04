/**
 * Arch Designer - Code-first architecture diagramming
 *
 * Generates ByteByteGo-quality diagrams from infrastructure-as-code.
 *
 * @example
 * ```typescript
 * import { generateArchitecture } from 'arch-designer';
 *
 * const result = await generateArchitecture('./my-project');
 * console.log(result.svg); // Animated SVG string
 * ```
 */

// Types
export type {
  Provider,
  ComponentType,
  ConnectionType,
  GroupType,
  Component,
  Connection,
  LogicalGroup,
  ProjectMetadata,
  ArchitectureGraph,
  AnalyzerResult
} from './graph/types';

// Graph
export { GraphBuilder } from './graph/builder';

// Analyzers
export { BaseAnalyzer } from './analyzers/base';
export { TerraformAnalyzer } from './analyzers/terraform';
export { DockerComposeAnalyzer } from './analyzers/docker-compose';
export { PluginStructureAnalyzer } from './analyzers/plugin-structure';
export {
  AnalyzerRegistry,
  createDefaultRegistry,
  runAllAnalyzers
} from './analyzers/registry';

// Layout
export type {
  PositionedNode,
  PositionedEdge,
  LayoutResult
} from './layout/dagre-layout';
export { layoutGraph } from './layout/dagre-layout';

// Renderer
export type { RenderOptions } from './renderers/svg-renderer';
export { renderToSvg } from './renderers/svg-renderer';
export type { ColorScheme } from './renderers/colors';
export {
  COMPONENT_COLORS,
  CONNECTION_COLORS,
  ANIMATION_COLORS,
  getColorForType,
  getBackgroundColor,
  getBorderColor,
  getTextColor
} from './renderers/colors';

// Convenience types
import type { ArchitectureGraph } from './graph/types';
import type { LayoutResult } from './layout/dagre-layout';

/**
 * Result of generating architecture from a codebase.
 */
export interface GenerateResult {
  /** The architecture graph model */
  graph: ArchitectureGraph;
  /** The positioned layout ready for rendering */
  layout: LayoutResult;
  /** The rendered SVG string */
  svg: string;
}

/**
 * Options for architecture generation.
 */
export interface GenerateOptions {
  /** Project name for metadata (defaults to directory name) */
  projectName?: string;
  /** Whether to animate flow in SVG (default: true) */
  animate?: boolean;
}

// Internal imports for convenience function
import { GraphBuilder } from './graph/builder';
import { runAllAnalyzers } from './analyzers/registry';
import { layoutGraph } from './layout/dagre-layout';
import { renderToSvg } from './renderers/svg-renderer';
import path from 'node:path';

/**
 * Generate architecture diagrams from a codebase.
 *
 * This is the main convenience function that runs the full pipeline:
 * 1. Runs all analyzers to discover infrastructure
 * 2. Builds a unified architecture graph
 * 3. Applies layout algorithm
 * 4. Renders to SVG
 *
 * @param projectPath - Path to the project root
 * @param options - Generation options
 * @returns The graph, layout, and rendered SVG
 *
 * @example
 * ```typescript
 * const { svg, graph } = await generateArchitecture('./my-app');
 *
 * // Save the SVG
 * await fs.writeFile('architecture.svg', svg);
 *
 * // Inspect discovered components
 * console.log(`Found ${graph.nodes.length} components`);
 * ```
 */
export async function generateArchitecture(
  projectPath: string,
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const projectName = options.projectName || path.basename(projectPath);

  // Run all analyzers
  const analyzerResults = await runAllAnalyzers(projectPath);

  // Build unified graph
  const builder = new GraphBuilder(projectName);
  for (const result of analyzerResults) {
    builder.merge(result);
  }
  const graph = builder.build();

  // Apply layout
  const layout = layoutGraph(graph);

  // Render to SVG
  const svg = renderToSvg(layout, {
    animate: options.animate ?? true
  });

  return { graph, layout, svg };
}
