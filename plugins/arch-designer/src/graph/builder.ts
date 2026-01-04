import type {
  ArchitectureGraph,
  AnalyzerResult,
  Component,
  Connection,
  LogicalGroup,
  ProjectMetadata,
  Provider
} from './types';

export class GraphBuilder {
  private nodes: Map<string, Component> = new Map();
  private edges: Map<string, Connection> = new Map();
  private groups: Map<string, LogicalGroup> = new Map();
  private sourceFiles: Set<string> = new Set();
  private techStack: Set<string> = new Set();
  private cloudProvider?: Provider;

  constructor(private projectName: string) {}

  merge(result: AnalyzerResult): void {
    // Merge nodes (later overwrites earlier)
    for (const node of result.nodes) {
      this.nodes.set(node.id, node);
      if (node.provider) {
        this.cloudProvider = node.provider;
      }
      if (node.service) {
        this.techStack.add(node.service);
      }
    }

    // Merge edges
    for (const edge of result.edges) {
      this.edges.set(edge.id, edge);
    }

    // Merge groups
    for (const group of result.groups) {
      this.groups.set(group.id, group);
    }

    // Track source files
    for (const file of result.sourceFiles) {
      this.sourceFiles.add(file);
    }
  }

  addNode(node: Component): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: Connection): void {
    this.edges.set(edge.id, edge);
  }

  addGroup(group: LogicalGroup): void {
    this.groups.set(group.id, group);
  }

  build(): ArchitectureGraph {
    const metadata: ProjectMetadata = {
      projectName: this.projectName,
      techStack: Array.from(this.techStack),
      cloudProvider: this.cloudProvider,
      analyzedAt: new Date().toISOString(),
      sourceFiles: Array.from(this.sourceFiles)
    };

    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      groups: Array.from(this.groups.values()),
      metadata
    };
  }
}
