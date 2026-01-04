import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { PluginStructureAnalyzer } from './plugin-structure';

describe('PluginStructureAnalyzer', () => {
  let analyzer: PluginStructureAnalyzer;
  let tempDir: string;

  beforeEach(async () => {
    analyzer = new PluginStructureAnalyzer();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'plugin-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('canAnalyze', () => {
    it('should return false for empty directory', async () => {
      expect(await analyzer.canAnalyze(tempDir)).toBe(false);
    });

    it('should return true for directory with marketplace.json', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'marketplace.json'),
        JSON.stringify({ name: 'test', plugins: [] })
      );

      expect(await analyzer.canAnalyze(tempDir)).toBe(true);
    });

    it('should return true for directory with plugin.json', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'test-plugin' })
      );

      expect(await analyzer.canAnalyze(tempDir)).toBe(true);
    });
  });

  describe('analyze - single plugin', () => {
    it('should create plugin node from plugin.json', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'my-plugin', version: '1.0.0', description: 'Test plugin' })
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'plugin',
        name: 'my-plugin',
        metadata: { version: '1.0.0', description: 'Test plugin' }
      });
    });

    it('should discover commands from commands/*.md', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'commands'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'my-plugin' })
      );
      await fs.writeFile(
        path.join(tempDir, 'commands', 'generate.md'),
        '# /my:generate\n\nGenerate something.'
      );
      await fs.writeFile(
        path.join(tempDir, 'commands', 'build.md'),
        '# /my:build\n\nBuild something.'
      );

      const result = await analyzer.analyze(tempDir);

      const commands = result.nodes.filter(n => n.type === 'command');
      expect(commands).toHaveLength(2);
      expect(commands.map(c => c.name)).toContain('/my:generate');
      expect(commands.map(c => c.name)).toContain('/my:build');
    });

    it('should discover skills from skills/*/SKILL.md', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'skills', 'my-skill'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'my-plugin' })
      );
      await fs.writeFile(
        path.join(tempDir, 'skills', 'my-skill', 'SKILL.md'),
        '---\nname: my-skill\ndescription: A test skill\n---\n\n# My Skill'
      );

      const result = await analyzer.analyze(tempDir);

      const skills = result.nodes.filter(n => n.type === 'skill');
      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('my-skill');
    });

    it('should discover hooks from hooks/*.md', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'hooks'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'my-plugin' })
      );
      await fs.writeFile(
        path.join(tempDir, 'hooks', 'pre-push.md'),
        '---\nevent: PreToolUse\n---\n\n# Pre-push hook'
      );

      const result = await analyzer.analyze(tempDir);

      const hooks = result.nodes.filter(n => n.type === 'hook');
      expect(hooks).toHaveLength(1);
      expect(hooks[0].name).toBe('pre-push');
    });

    it('should discover MCP servers from .mcp.json', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'my-plugin' })
      );
      await fs.writeFile(
        path.join(tempDir, '.mcp.json'),
        JSON.stringify({
          mcpServers: {
            linear: { command: 'npx', args: ['linear-mcp'] }
          }
        })
      );

      const result = await analyzer.analyze(tempDir);

      const mcps = result.nodes.filter(n => n.type === 'mcp');
      expect(mcps).toHaveLength(1);
      expect(mcps[0].name).toBe('linear');
    });

    it('should discover source modules from src/*/', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'src', 'analyzers'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'src', 'renderers'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'my-plugin' })
      );
      await fs.writeFile(path.join(tempDir, 'src', 'analyzers', 'base.ts'), '');
      await fs.writeFile(path.join(tempDir, 'src', 'renderers', 'svg.ts'), '');

      const result = await analyzer.analyze(tempDir);

      const modules = result.nodes.filter(n => n.type === 'module');
      expect(modules).toHaveLength(2);
      expect(modules.map(m => m.name)).toContain('analyzers');
      expect(modules.map(m => m.name)).toContain('renderers');
    });

    it('should create contains edges from plugin to components', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'commands'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'my-plugin' })
      );
      await fs.writeFile(
        path.join(tempDir, 'commands', 'test.md'),
        '# /my:test\n\nTest.'
      );

      const result = await analyzer.analyze(tempDir);

      const containsEdges = result.edges.filter(e => e.type === 'contains');
      expect(containsEdges.length).toBeGreaterThan(0);

      const plugin = result.nodes.find(n => n.type === 'plugin');
      const command = result.nodes.find(n => n.type === 'command');
      expect(containsEdges.some(e => e.from === plugin?.id && e.to === command?.id)).toBe(true);
    });
  });

  describe('analyze - marketplace', () => {
    it('should create marketplace node from marketplace.json', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'marketplace.json'),
        JSON.stringify({
          name: 'my-marketplace',
          plugins: []
        })
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({
        type: 'marketplace',
        name: 'my-marketplace'
      });
    });

    it('should discover plugins listed in marketplace', async () => {
      // Create marketplace
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'marketplace.json'),
        JSON.stringify({
          name: 'my-marketplace',
          plugins: [
            { name: 'plugin-a', source: './plugins/plugin-a' },
            { name: 'plugin-b', source: './plugins/plugin-b' }
          ]
        })
      );

      // Create plugin directories
      await fs.mkdir(path.join(tempDir, 'plugins', 'plugin-a', '.claude-plugin'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'plugins', 'plugin-b', '.claude-plugin'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'plugins', 'plugin-a', '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'plugin-a' })
      );
      await fs.writeFile(
        path.join(tempDir, 'plugins', 'plugin-b', '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'plugin-b' })
      );

      const result = await analyzer.analyze(tempDir);

      const marketplace = result.nodes.find(n => n.type === 'marketplace');
      const plugins = result.nodes.filter(n => n.type === 'plugin');

      expect(marketplace).toBeDefined();
      expect(plugins).toHaveLength(2);

      // Should have contains edges from marketplace to plugins
      const containsEdges = result.edges.filter(e => e.type === 'contains');
      expect(containsEdges.filter(e => e.from === marketplace?.id)).toHaveLength(2);
    });
  });

  describe('relationship detection', () => {
    it('should detect triggers relationship from skill to command', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'commands'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'skills', 'my-skill'), { recursive: true });

      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'my-plugin' })
      );
      await fs.writeFile(
        path.join(tempDir, 'commands', 'generate.md'),
        '# /my:generate\n\nGenerate.'
      );
      await fs.writeFile(
        path.join(tempDir, 'skills', 'my-skill', 'SKILL.md'),
        '---\nname: my-skill\n---\n\nUse /my:generate to create files.'
      );

      const result = await analyzer.analyze(tempDir);

      const triggersEdges = result.edges.filter(e => e.type === 'triggers');
      expect(triggersEdges).toHaveLength(1);

      const skill = result.nodes.find(n => n.type === 'skill');
      const command = result.nodes.find(n => n.type === 'command');
      expect(triggersEdges[0].from).toBe(skill?.id);
      expect(triggersEdges[0].to).toBe(command?.id);
    });
  });

  describe('groups', () => {
    it('should create plugin group containing its components', async () => {
      await fs.mkdir(path.join(tempDir, '.claude-plugin'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'commands'), { recursive: true });

      await fs.writeFile(
        path.join(tempDir, '.claude-plugin', 'plugin.json'),
        JSON.stringify({ name: 'my-plugin' })
      );
      await fs.writeFile(
        path.join(tempDir, 'commands', 'test.md'),
        '# /my:test\n\nTest.'
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].type).toBe('plugin');
      expect(result.groups[0].name).toBe('my-plugin');

      const command = result.nodes.find(n => n.type === 'command');
      expect(result.groups[0].children).toContain(command?.id);
    });
  });
});
