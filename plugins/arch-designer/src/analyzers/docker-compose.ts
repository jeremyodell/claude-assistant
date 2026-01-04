import * as fs from 'fs/promises';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import { BaseAnalyzer } from './base';
import type { AnalyzerResult, Component, Connection, ComponentType } from '../graph/types';

/**
 * Image patterns to component type mapping
 */
const IMAGE_MAPPINGS: Array<{ pattern: RegExp; type: ComponentType; service: string }> = [
  // Databases
  { pattern: /postgres/i, type: 'database', service: 'postgres' },
  { pattern: /mysql/i, type: 'database', service: 'mysql' },
  { pattern: /mariadb/i, type: 'database', service: 'mariadb' },
  { pattern: /mongo/i, type: 'database', service: 'mongodb' },
  { pattern: /elasticsearch/i, type: 'database', service: 'elasticsearch' },
  { pattern: /cassandra/i, type: 'database', service: 'cassandra' },

  // Cache
  { pattern: /redis/i, type: 'cache', service: 'redis' },
  { pattern: /memcached/i, type: 'cache', service: 'memcached' },

  // Queues
  { pattern: /rabbitmq/i, type: 'queue', service: 'rabbitmq' },
  { pattern: /kafka/i, type: 'stream', service: 'kafka' },
  { pattern: /nats/i, type: 'queue', service: 'nats' },
  { pattern: /activemq/i, type: 'queue', service: 'activemq' },

  // Web servers / CDN
  { pattern: /nginx/i, type: 'cdn', service: 'nginx' },
  { pattern: /traefik/i, type: 'api', service: 'traefik' },
  { pattern: /haproxy/i, type: 'api', service: 'haproxy' },
  { pattern: /caddy/i, type: 'cdn', service: 'caddy' },

  // Monitoring
  { pattern: /prometheus/i, type: 'monitoring', service: 'prometheus' },
  { pattern: /grafana/i, type: 'monitoring', service: 'grafana' },
  { pattern: /jaeger/i, type: 'monitoring', service: 'jaeger' },

  // Auth
  { pattern: /keycloak/i, type: 'auth', service: 'keycloak' },
];

interface ComposeFile {
  services?: Record<string, ComposeService>;
  version?: string;
}

interface ComposeService {
  image?: string;
  build?: string | { context: string };
  depends_on?: string[] | Record<string, { condition?: string }>;
  ports?: string[];
  environment?: Record<string, string> | string[];
}

export class DockerComposeAnalyzer extends BaseAnalyzer {
  name = 'docker-compose';
  protected filePatterns = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];

  async canAnalyze(projectPath: string): Promise<boolean> {
    const composeFiles = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml'
    ];

    for (const file of composeFiles) {
      try {
        await fs.access(path.join(projectPath, file));
        return true;
      } catch {
        // File doesn't exist, try next
      }
    }

    return false;
  }

  async analyze(projectPath: string): Promise<AnalyzerResult> {
    const result = this.createEmptyResult();
    const composeFile = await this.findComposeFile(projectPath);

    if (!composeFile) {
      return result;
    }

    try {
      const content = await fs.readFile(composeFile, 'utf-8');
      const relativePath = path.relative(projectPath, composeFile);
      result.sourceFiles.push(relativePath);

      const compose = parseYaml(content) as ComposeFile;

      if (compose.services) {
        this.extractServices(compose.services, result);
        this.extractDependencies(compose.services, result);
      }
    } catch {
      // Failed to parse compose file
    }

    return result;
  }

  private async findComposeFile(projectPath: string): Promise<string | null> {
    const composeFiles = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml'
    ];

    for (const file of composeFiles) {
      const filePath = path.join(projectPath, file);
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        // File doesn't exist, try next
      }
    }

    return null;
  }

  private extractServices(services: Record<string, ComposeService>, result: AnalyzerResult): void {
    for (const [serviceName, service] of Object.entries(services)) {
      const component = this.createServiceComponent(serviceName, service);
      result.nodes.push(component);
    }
  }

  private createServiceComponent(name: string, service: ComposeService): Component {
    const image = service.image || '';
    const mapping = this.inferTypeFromImage(image);

    return {
      id: this.generateId('docker', name),
      name,
      type: mapping.type,
      provider: 'generic',
      service: mapping.service,
      metadata: {
        image: service.image,
        ports: service.ports
      }
    };
  }

  private inferTypeFromImage(image: string): { type: ComponentType; service: string } {
    for (const mapping of IMAGE_MAPPINGS) {
      if (mapping.pattern.test(image)) {
        return { type: mapping.type, service: mapping.service };
      }
    }

    // Default to compute for unknown images
    return { type: 'compute', service: 'docker' };
  }

  private extractDependencies(services: Record<string, ComposeService>, result: AnalyzerResult): void {
    for (const [serviceName, service] of Object.entries(services)) {
      if (!service.depends_on) continue;

      const dependencies = this.normalizeDependsOn(service.depends_on);

      for (const dep of dependencies) {
        const edge: Connection = {
          id: this.generateId('dep', `${serviceName}-${dep}`),
          from: this.generateId('docker', serviceName),
          to: this.generateId('docker', dep),
          type: 'http', // Default, could be refined based on service types
          label: 'depends_on'
        };
        result.edges.push(edge);
      }
    }
  }

  private normalizeDependsOn(dependsOn: string[] | Record<string, { condition?: string }>): string[] {
    if (Array.isArray(dependsOn)) {
      return dependsOn;
    }

    // Object form: { db: { condition: service_healthy } }
    return Object.keys(dependsOn);
  }
}
