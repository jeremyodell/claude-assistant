export type Provider = 'aws' | 'gcp' | 'azure' | 'generic';

export type ComponentType =
  // Infrastructure components
  | 'frontend'      // React, Vue, mobile apps
  | 'api'           // API Gateway, Load Balancer
  | 'compute'       // Lambda, ECS, EC2
  | 'database'      // DynamoDB, RDS, PostgreSQL
  | 'cache'         // Redis, ElastiCache
  | 'storage'       // S3, EFS
  | 'queue'         // SQS, SNS, EventBridge
  | 'stream'        // Kinesis, Kafka
  | 'cdn'           // CloudFront
  | 'auth'          // Cognito, Auth0
  | 'monitoring'    // CloudWatch, Datadog
  | 'external'      // Third-party APIs
  | 'user'          // End users
  // Plugin structure components
  | 'marketplace'   // Plugin marketplace
  | 'plugin'        // Claude Code plugin
  | 'command'       // Slash command
  | 'skill'         // Plugin skill
  | 'hook'          // Plugin hook
  | 'mcp'           // MCP server
  | 'module';       // Source code module

export type ConnectionType =
  // Infrastructure connections
  | 'http'          // REST API calls
  | 'grpc'          // gRPC calls
  | 'graphql'       // GraphQL queries
  | 'websocket'     // WebSocket connections
  | 'invoke'        // Direct invocation (Lambda)
  | 'query'         // Database queries
  | 'publish'       // Queue/topic publish
  | 'subscribe'     // Queue/topic subscribe
  | 'event'         // Event emission
  | 'stream'        // Data streaming
  | 'sync'          // File/data sync
  // Plugin structure connections
  | 'contains'      // Parent contains child
  | 'triggers'      // Skill/hook triggers command
  | 'validates'     // Hook validates command
  | 'depends-on'    // Plugin depends on another
  | 'exports';      // Plugin exports module

export type GroupType =
  // Infrastructure groups
  | 'vpc'           // AWS VPC
  | 'subnet'        // Network subnet
  | 'region'        // Cloud region
  | 'az'            // Availability zone
  | 'cluster'       // Container cluster
  | 'namespace'     // Kubernetes namespace
  | 'service-boundary'  // Logical service grouping
  | 'security-group'    // Security boundary
  // Plugin structure groups
  | 'marketplace'   // Plugin marketplace container
  | 'plugin';       // Plugin container

export interface Component {
  id: string;
  name: string;
  type: ComponentType;
  provider?: Provider;
  service?: string;       // e.g., 'lambda', 'dynamodb', 'sqs'
  metadata: Record<string, unknown>;
}

export interface Connection {
  id: string;
  from: string;           // Component ID
  to: string;             // Component ID
  type: ConnectionType;
  protocol?: string;      // e.g., 'https', 'tcp'
  label?: string;         // Display label
  metadata?: Record<string, unknown>;
}

export interface LogicalGroup {
  id: string;
  name: string;
  type: GroupType;
  children: string[];     // Component or Group IDs
  parent?: string;        // Parent group ID
  metadata?: Record<string, unknown>;
}

export interface ProjectMetadata {
  projectName: string;
  techStack: string[];
  cloudProvider?: Provider;
  analyzedAt: string;     // ISO timestamp
  sourceFiles?: string[]; // Files that were analyzed
}

export interface ArchitectureGraph {
  nodes: Component[];
  edges: Connection[];
  groups: LogicalGroup[];
  metadata: ProjectMetadata;
}

// Helper type for analyzer results
export interface AnalyzerResult {
  nodes: Component[];
  edges: Connection[];
  groups: LogicalGroup[];
  sourceFiles: string[];
}
