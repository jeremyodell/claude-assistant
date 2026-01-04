import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TerraformAnalyzer } from './terraform';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs/promises
vi.mock('fs/promises');

describe('TerraformAnalyzer', () => {
  const analyzer = new TerraformAnalyzer();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have correct name', () => {
    expect(analyzer.name).toBe('terraform');
  });

  describe('canAnalyze', () => {
    it('should return true when .tf files exist', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'main.tf', isFile: () => true, isDirectory: () => false } as any
      ]);

      const result = await analyzer.canAnalyze('/project');
      expect(result).toBe(true);
    });

    it('should return false when no .tf files exist', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'README.md', isFile: () => true, isDirectory: () => false } as any
      ]);

      const result = await analyzer.canAnalyze('/project');
      expect(result).toBe(false);
    });

    it('should check subdirectories for .tf files', async () => {
      vi.mocked(fs.readdir).mockImplementation(async (dirPath: any) => {
        if (dirPath === '/project') {
          return [
            { name: 'infra', isFile: () => false, isDirectory: () => true } as any
          ];
        }
        if (dirPath === '/project/infra') {
          return [
            { name: 'main.tf', isFile: () => true, isDirectory: () => false } as any
          ];
        }
        return [];
      });

      const result = await analyzer.canAnalyze('/project');
      expect(result).toBe(true);
    });
  });

  describe('analyze', () => {
    it('should extract Lambda functions', async () => {
      const tfContent = `
resource "aws_lambda_function" "handler" {
  function_name = "my-handler"
  runtime       = "nodejs18.x"
  handler       = "index.handler"
}
`;
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'main.tf', isFile: () => true, isDirectory: () => false } as any
      ]);
      vi.mocked(fs.readFile).mockResolvedValue(tfContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'compute',
        provider: 'aws',
        service: 'lambda'
      });
      expect(result.sourceFiles).toContain('main.tf');
    });

    it('should extract DynamoDB tables', async () => {
      const tfContent = `
resource "aws_dynamodb_table" "users" {
  name           = "users-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
}
`;
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'main.tf', isFile: () => true, isDirectory: () => false } as any
      ]);
      vi.mocked(fs.readFile).mockResolvedValue(tfContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'database',
        provider: 'aws',
        service: 'dynamodb'
      });
    });

    it('should extract S3 buckets', async () => {
      const tfContent = `
resource "aws_s3_bucket" "assets" {
  bucket = "my-assets-bucket"
}
`;
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'main.tf', isFile: () => true, isDirectory: () => false } as any
      ]);
      vi.mocked(fs.readFile).mockResolvedValue(tfContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'storage',
        provider: 'aws',
        service: 's3'
      });
    });

    it('should extract SQS queues', async () => {
      const tfContent = `
resource "aws_sqs_queue" "tasks" {
  name = "task-queue"
}
`;
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'main.tf', isFile: () => true, isDirectory: () => false } as any
      ]);
      vi.mocked(fs.readFile).mockResolvedValue(tfContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'queue',
        provider: 'aws',
        service: 'sqs'
      });
    });

    it('should extract API Gateway', async () => {
      const tfContent = `
resource "aws_apigatewayv2_api" "main" {
  name          = "main-api"
  protocol_type = "HTTP"
}
`;
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'main.tf', isFile: () => true, isDirectory: () => false } as any
      ]);
      vi.mocked(fs.readFile).mockResolvedValue(tfContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'api',
        provider: 'aws',
        service: 'apigateway'
      });
    });

    it('should extract VPC as a group', async () => {
      const tfContent = `
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "main-vpc"
  }
}
`;
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'main.tf', isFile: () => true, isDirectory: () => false } as any
      ]);
      vi.mocked(fs.readFile).mockResolvedValue(tfContent);

      const result = await analyzer.analyze('/project');

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0]).toMatchObject({
        type: 'vpc',
        name: 'main'
      });
    });

    it('should extract multiple resources from single file', async () => {
      const tfContent = `
resource "aws_lambda_function" "handler" {
  function_name = "handler"
}

resource "aws_dynamodb_table" "data" {
  name = "data"
}

resource "aws_sqs_queue" "jobs" {
  name = "jobs"
}
`;
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'main.tf', isFile: () => true, isDirectory: () => false } as any
      ]);
      vi.mocked(fs.readFile).mockResolvedValue(tfContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(3);
    });
  });
});
