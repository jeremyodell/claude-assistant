import { describe, it, expect } from 'vitest';
import type {
  Component,
  Connection,
  LogicalGroup,
  ArchitectureGraph,
} from './types';

describe('Graph Types', () => {
  it('should create a valid Component', () => {
    const component: Component = {
      id: 'api-gateway',
      name: 'API Gateway',
      type: 'api',
      provider: 'aws',
      service: 'apigateway',
      metadata: {
        region: 'us-east-1'
      }
    };

    expect(component.id).toBe('api-gateway');
    expect(component.type).toBe('api');
    expect(component.provider).toBe('aws');
  });

  it('should create a valid Connection', () => {
    const connection: Connection = {
      id: 'api-to-lambda',
      from: 'api-gateway',
      to: 'lambda-handler',
      type: 'invoke',
      protocol: 'https',
      label: 'REST API'
    };

    expect(connection.from).toBe('api-gateway');
    expect(connection.to).toBe('lambda-handler');
  });

  it('should create a valid LogicalGroup', () => {
    const group: LogicalGroup = {
      id: 'vpc-main',
      name: 'Production VPC',
      type: 'vpc',
      children: ['subnet-public', 'subnet-private'],
      metadata: {
        cidr: '10.0.0.0/16'
      }
    };

    expect(group.children).toHaveLength(2);
  });

  it('should create a valid ArchitectureGraph', () => {
    const graph: ArchitectureGraph = {
      nodes: [],
      edges: [],
      groups: [],
      metadata: {
        projectName: 'my-app',
        techStack: ['typescript', 'aws'],
        cloudProvider: 'aws',
        analyzedAt: new Date().toISOString()
      }
    };

    expect(graph.metadata.projectName).toBe('my-app');
  });
});
