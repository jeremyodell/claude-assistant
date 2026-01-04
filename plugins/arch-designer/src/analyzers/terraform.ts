import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseAnalyzer } from './base';
import type { AnalyzerResult, Component, LogicalGroup, ComponentType } from '../graph/types';

/**
 * Resource type to component mapping
 */
const RESOURCE_MAPPINGS: Record<string, { type: ComponentType; service: string }> = {
  // Compute
  'aws_lambda_function': { type: 'compute', service: 'lambda' },
  'aws_ecs_service': { type: 'compute', service: 'ecs' },
  'aws_ecs_task_definition': { type: 'compute', service: 'ecs' },
  'aws_instance': { type: 'compute', service: 'ec2' },

  // Database
  'aws_dynamodb_table': { type: 'database', service: 'dynamodb' },
  'aws_rds_instance': { type: 'database', service: 'rds' },
  'aws_rds_cluster': { type: 'database', service: 'rds' },
  'aws_db_instance': { type: 'database', service: 'rds' },

  // Storage
  'aws_s3_bucket': { type: 'storage', service: 's3' },
  'aws_efs_file_system': { type: 'storage', service: 'efs' },

  // Queue/Messaging
  'aws_sqs_queue': { type: 'queue', service: 'sqs' },
  'aws_sns_topic': { type: 'queue', service: 'sns' },
  'aws_eventbridge_rule': { type: 'queue', service: 'eventbridge' },

  // Streaming
  'aws_kinesis_stream': { type: 'stream', service: 'kinesis' },
  'aws_kinesis_firehose_delivery_stream': { type: 'stream', service: 'kinesis' },

  // API
  'aws_apigatewayv2_api': { type: 'api', service: 'apigateway' },
  'aws_api_gateway_rest_api': { type: 'api', service: 'apigateway' },
  'aws_lb': { type: 'api', service: 'alb' },
  'aws_alb': { type: 'api', service: 'alb' },

  // CDN
  'aws_cloudfront_distribution': { type: 'cdn', service: 'cloudfront' },

  // Cache
  'aws_elasticache_cluster': { type: 'cache', service: 'elasticache' },
  'aws_elasticache_replication_group': { type: 'cache', service: 'elasticache' },

  // Auth
  'aws_cognito_user_pool': { type: 'auth', service: 'cognito' },
  'aws_cognito_identity_pool': { type: 'auth', service: 'cognito' },

  // Monitoring
  'aws_cloudwatch_log_group': { type: 'monitoring', service: 'cloudwatch' },
  'aws_cloudwatch_metric_alarm': { type: 'monitoring', service: 'cloudwatch' },
};

/**
 * Resources that should be extracted as groups (infrastructure boundaries)
 */
const GROUP_RESOURCES = ['aws_vpc', 'aws_subnet', 'aws_security_group'];

export class TerraformAnalyzer extends BaseAnalyzer {
  name = 'terraform';
  protected filePatterns = ['*.tf', '*.tfvars'];

  async canAnalyze(projectPath: string): Promise<boolean> {
    return this.hasTfFiles(projectPath, 2);
  }

  private async hasTfFiles(dirPath: string, depth: number): Promise<boolean> {
    if (depth < 0) return false;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.tf')) {
          return true;
        }
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subPath = path.join(dirPath, entry.name);
          if (await this.hasTfFiles(subPath, depth - 1)) {
            return true;
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return false;
  }

  async analyze(projectPath: string): Promise<AnalyzerResult> {
    const result = this.createEmptyResult();
    const tfFiles = await this.findTfFiles(projectPath);

    for (const filePath of tfFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(projectPath, filePath);
        result.sourceFiles.push(relativePath);

        this.extractResources(content, result);
      } catch {
        // Skip files that can't be read
      }
    }

    return result;
  }

  private async findTfFiles(dirPath: string, depth = 3): Promise<string[]> {
    const files: string[] = [];
    if (depth < 0) return files;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isFile() && entry.name.endsWith('.tf')) {
          files.push(fullPath);
        } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.findTfFiles(fullPath, depth - 1);
          files.push(...subFiles);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return files;
  }

  private extractResources(content: string, result: AnalyzerResult): void {
    // Match resource blocks: resource "type" "name" { ... }
    const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"/g;
    let match;

    while ((match = resourceRegex.exec(content)) !== null) {
      const [, resourceType, resourceName] = match;

      // Check if this is a group resource (VPC, subnet, etc.)
      if (GROUP_RESOURCES.includes(resourceType)) {
        const group = this.createGroup(resourceType, resourceName);
        if (group) {
          result.groups.push(group);
        }
        continue;
      }

      // Check if this is a component resource
      const mapping = RESOURCE_MAPPINGS[resourceType];
      if (mapping) {
        const component = this.createComponent(resourceType, resourceName, mapping);
        result.nodes.push(component);
      }
    }
  }

  private createComponent(
    resourceType: string,
    resourceName: string,
    mapping: { type: ComponentType; service: string }
  ): Component {
    return {
      id: this.generateId(mapping.service, resourceName),
      name: resourceName,
      type: mapping.type,
      provider: 'aws',
      service: mapping.service,
      metadata: {
        terraformType: resourceType
      }
    };
  }

  private createGroup(resourceType: string, resourceName: string): LogicalGroup | null {
    if (resourceType === 'aws_vpc') {
      return {
        id: this.generateId('vpc', resourceName),
        name: resourceName,
        type: 'vpc',
        children: []
      };
    }
    if (resourceType === 'aws_subnet') {
      return {
        id: this.generateId('subnet', resourceName),
        name: resourceName,
        type: 'subnet',
        children: []
      };
    }
    if (resourceType === 'aws_security_group') {
      return {
        id: this.generateId('sg', resourceName),
        name: resourceName,
        type: 'security-group',
        children: []
      };
    }
    return null;
  }
}
