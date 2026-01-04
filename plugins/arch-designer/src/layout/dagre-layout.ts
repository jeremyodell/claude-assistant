import dagre from 'dagre';
import type { ArchitectureGraph, Component, Connection, ComponentType } from '../graph/types';

/**
 * A positioned node with x,y coordinates and dimensions.
 */
export interface PositionedNode extends Component {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A positioned edge with routing points.
 */
export interface PositionedEdge extends Connection {
  points: Array<{ x: number; y: number }>;
}

/**
 * The result of laying out a graph.
 */
export interface LayoutResult {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  width: number;
  height: number;
}

/**
 * Default node dimensions by component type.
 */
const NODE_DIMENSIONS: Record<ComponentType, { width: number; height: number }> = {
  frontend: { width: 140, height: 60 },
  api: { width: 140, height: 60 },
  compute: { width: 140, height: 60 },
  database: { width: 140, height: 60 },
  cache: { width: 120, height: 50 },
  storage: { width: 120, height: 50 },
  queue: { width: 120, height: 50 },
  stream: { width: 120, height: 50 },
  cdn: { width: 120, height: 50 },
  auth: { width: 120, height: 50 },
  monitoring: { width: 120, height: 50 },
  external: { width: 140, height: 60 },
  user: { width: 100, height: 50 }
};

/**
 * Layout an architecture graph using dagre.
 */
export function layoutGraph(graph: ArchitectureGraph): LayoutResult {
  if (graph.nodes.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  // Create dagre graph
  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: 'TB',      // Top to bottom
    nodesep: 60,        // Horizontal spacing between nodes
    ranksep: 80,        // Vertical spacing between ranks
    marginx: 40,
    marginy: 40
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  for (const node of graph.nodes) {
    const dims = NODE_DIMENSIONS[node.type] || { width: 140, height: 60 };
    g.setNode(node.id, {
      label: node.name,
      width: dims.width,
      height: dims.height,
      ...node
    });
  }

  // Add edges
  for (const edge of graph.edges) {
    g.setEdge(edge.from, edge.to, { ...edge });
  }

  // Run layout algorithm
  dagre.layout(g);

  // Extract positioned nodes
  const positionedNodes: PositionedNode[] = graph.nodes.map(node => {
    const layoutNode = g.node(node.id);
    return {
      ...node,
      x: layoutNode.x,
      y: layoutNode.y,
      width: layoutNode.width,
      height: layoutNode.height
    };
  });

  // Extract positioned edges
  const positionedEdges: PositionedEdge[] = graph.edges.map(edge => {
    const layoutEdge = g.edge(edge.from, edge.to);
    return {
      ...edge,
      points: layoutEdge?.points || []
    };
  });

  // Calculate canvas dimensions
  const graphInfo = g.graph();
  const width = graphInfo.width || 800;
  const height = graphInfo.height || 600;

  return {
    nodes: positionedNodes,
    edges: positionedEdges,
    width,
    height
  };
}
