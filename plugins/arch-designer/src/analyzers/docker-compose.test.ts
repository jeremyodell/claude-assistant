import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DockerComposeAnalyzer } from './docker-compose';
import * as fs from 'fs/promises';

// Mock fs/promises
vi.mock('fs/promises');

describe('DockerComposeAnalyzer', () => {
  const analyzer = new DockerComposeAnalyzer();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have correct name', () => {
    expect(analyzer.name).toBe('docker-compose');
  });

  describe('canAnalyze', () => {
    it('should return true when docker-compose.yml exists', async () => {
      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await analyzer.canAnalyze('/project');
      expect(result).toBe(true);
    });

    it('should return true when docker-compose.yaml exists', async () => {
      vi.mocked(fs.access)
        .mockRejectedValueOnce(new Error('Not found')) // .yml
        .mockResolvedValueOnce(undefined); // .yaml

      const result = await analyzer.canAnalyze('/project');
      expect(result).toBe(true);
    });

    it('should return false when no compose file exists', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('Not found'));

      const result = await analyzer.canAnalyze('/project');
      expect(result).toBe(false);
    });
  });

  describe('analyze', () => {
    it('should extract services as compute nodes', async () => {
      const composeContent = `
services:
  api:
    image: node:18
    ports:
      - "3000:3000"
`;
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(composeContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        name: 'api',
        type: 'compute',
        service: 'docker'
      });
    });

    it('should detect postgres as database', async () => {
      const composeContent = `
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
`;
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(composeContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'database',
        service: 'postgres'
      });
    });

    it('should detect redis as cache', async () => {
      const composeContent = `
services:
  cache:
    image: redis:7-alpine
`;
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(composeContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'cache',
        service: 'redis'
      });
    });

    it('should detect rabbitmq as queue', async () => {
      const composeContent = `
services:
  mq:
    image: rabbitmq:3-management
`;
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(composeContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'queue',
        service: 'rabbitmq'
      });
    });

    it('should extract depends_on as edges', async () => {
      const composeContent = `
services:
  api:
    image: node:18
    depends_on:
      - db
      - cache
  db:
    image: postgres:15
  cache:
    image: redis:7
`;
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(composeContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);
      expect(result.edges).toContainEqual(
        expect.objectContaining({
          from: expect.stringContaining('api'),
          to: expect.stringContaining('db')
        })
      );
    });

    it('should handle depends_on with conditions', async () => {
      const composeContent = `
services:
  api:
    image: node:18
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:15
`;
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(composeContent);

      const result = await analyzer.analyze('/project');

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toMatchObject({
        from: expect.stringContaining('api'),
        to: expect.stringContaining('db')
      });
    });

    it('should extract multiple services', async () => {
      const composeContent = `
services:
  web:
    image: nginx
  api:
    image: node:18
  worker:
    image: python:3.11
  db:
    image: postgres:15
  cache:
    image: redis:7
`;
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(composeContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes).toHaveLength(5);
    });

    it('should detect nginx as frontend/cdn', async () => {
      const composeContent = `
services:
  web:
    image: nginx:alpine
`;
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(composeContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes[0]).toMatchObject({
        type: 'cdn',
        service: 'nginx'
      });
    });

    it('should detect elasticsearch as database', async () => {
      const composeContent = `
services:
  search:
    image: elasticsearch:8.10.0
`;
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(composeContent);

      const result = await analyzer.analyze('/project');

      expect(result.nodes[0]).toMatchObject({
        type: 'database',
        service: 'elasticsearch'
      });
    });
  });
});
