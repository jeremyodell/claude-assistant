import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseAnalyzer } from './base';
import type { AnalyzerResult, Component, Connection, LogicalGroup } from '../graph/types';

interface MarketplaceJson {
  name: string;
  plugins?: Array<{ name: string; source: string }>;
}

interface PluginJson {
  name: string;
  version?: string;
  description?: string;
}

interface McpJson {
  mcpServers?: Record<string, unknown>;
}

/**
 * Analyzes Claude Code plugin structure.
 * Discovers plugins, commands, skills, hooks, MCP servers, and source modules.
 */
export class PluginStructureAnalyzer extends BaseAnalyzer {
  readonly name = 'plugin-structure';
  protected filePatterns = ['**/plugin.json', '**/marketplace.json'];

  async canAnalyze(projectPath: string): Promise<boolean> {
    const marketplacePath = path.join(projectPath, '.claude-plugin', 'marketplace.json');
    const pluginPath = path.join(projectPath, '.claude-plugin', 'plugin.json');

    try {
      await fs.access(marketplacePath);
      return true;
    } catch {
      try {
        await fs.access(pluginPath);
        return true;
      } catch {
        return false;
      }
    }
  }

  async analyze(projectPath: string): Promise<AnalyzerResult> {
    const nodes: Component[] = [];
    const edges: Connection[] = [];
    const groups: LogicalGroup[] = [];
    const sourceFiles: string[] = [];

    // Check for marketplace first
    const marketplacePath = path.join(projectPath, '.claude-plugin', 'marketplace.json');
    let isMarketplace = false;

    try {
      const marketplaceContent = await fs.readFile(marketplacePath, 'utf-8');
      const marketplace: MarketplaceJson = JSON.parse(marketplaceContent);
      isMarketplace = true;
      sourceFiles.push(marketplacePath);

      // Create marketplace node
      const marketplaceId = this.generateId('marketplace', marketplace.name);
      nodes.push({
        id: marketplaceId,
        name: marketplace.name,
        type: 'marketplace',
        metadata: {}
      });

      // Analyze each plugin in marketplace
      if (marketplace.plugins) {
        for (const pluginRef of marketplace.plugins) {
          const pluginPath = path.join(projectPath, pluginRef.source);
          const pluginResult = await this.analyzePlugin(pluginPath);

          nodes.push(...pluginResult.nodes);
          edges.push(...pluginResult.edges);
          groups.push(...pluginResult.groups);
          sourceFiles.push(...pluginResult.sourceFiles);

          // Add contains edge from marketplace to plugin
          const pluginNode = pluginResult.nodes.find(n => n.type === 'plugin');
          if (pluginNode) {
            edges.push({
              id: `${marketplaceId}-contains-${pluginNode.id}`,
              from: marketplaceId,
              to: pluginNode.id,
              type: 'contains'
            });
          }
        }
      }
    } catch {
      // Not a marketplace, try single plugin
    }

    // If not a marketplace, try analyzing as a single plugin
    if (!isMarketplace) {
      const pluginResult = await this.analyzePlugin(projectPath);
      nodes.push(...pluginResult.nodes);
      edges.push(...pluginResult.edges);
      groups.push(...pluginResult.groups);
      sourceFiles.push(...pluginResult.sourceFiles);
    }

    return { nodes, edges, groups, sourceFiles };
  }

  private async analyzePlugin(pluginPath: string): Promise<AnalyzerResult> {
    const nodes: Component[] = [];
    const edges: Connection[] = [];
    const groups: LogicalGroup[] = [];
    const sourceFiles: string[] = [];

    // Read plugin.json
    const pluginJsonPath = path.join(pluginPath, '.claude-plugin', 'plugin.json');
    let pluginJson: PluginJson;

    try {
      const content = await fs.readFile(pluginJsonPath, 'utf-8');
      pluginJson = JSON.parse(content);
      sourceFiles.push(pluginJsonPath);
    } catch {
      return this.createEmptyResult();
    }

    const pluginId = this.generateId('plugin', pluginJson.name);
    const childIds: string[] = [];

    // Create plugin node
    nodes.push({
      id: pluginId,
      name: pluginJson.name,
      type: 'plugin',
      metadata: {
        version: pluginJson.version,
        description: pluginJson.description
      }
    });

    // Discover commands
    const commands = await this.discoverCommands(pluginPath);
    for (const cmd of commands) {
      nodes.push(cmd);
      childIds.push(cmd.id);
      edges.push({
        id: `${pluginId}-contains-${cmd.id}`,
        from: pluginId,
        to: cmd.id,
        type: 'contains'
      });
    }

    // Discover skills
    const skills = await this.discoverSkills(pluginPath);
    for (const skill of skills) {
      nodes.push(skill);
      childIds.push(skill.id);
      edges.push({
        id: `${pluginId}-contains-${skill.id}`,
        from: pluginId,
        to: skill.id,
        type: 'contains'
      });
    }

    // Discover hooks
    const hooks = await this.discoverHooks(pluginPath);
    for (const hook of hooks) {
      nodes.push(hook);
      childIds.push(hook.id);
      edges.push({
        id: `${pluginId}-contains-${hook.id}`,
        from: pluginId,
        to: hook.id,
        type: 'contains'
      });
    }

    // Discover MCP servers
    const mcps = await this.discoverMcpServers(pluginPath);
    for (const mcp of mcps) {
      nodes.push(mcp);
      childIds.push(mcp.id);
      edges.push({
        id: `${pluginId}-contains-${mcp.id}`,
        from: pluginId,
        to: mcp.id,
        type: 'contains'
      });
    }

    // Discover source modules
    const modules = await this.discoverModules(pluginPath);
    for (const mod of modules) {
      nodes.push(mod);
      childIds.push(mod.id);
      edges.push({
        id: `${pluginId}-contains-${mod.id}`,
        from: pluginId,
        to: mod.id,
        type: 'contains'
      });
    }

    // Detect relationships between components
    const relationshipEdges = await this.detectRelationships(pluginPath, skills, commands);
    edges.push(...relationshipEdges);

    // Create plugin group
    groups.push({
      id: `group-${pluginId}`,
      name: pluginJson.name,
      type: 'plugin',
      children: childIds
    });

    return { nodes, edges, groups, sourceFiles };
  }

  private async discoverCommands(pluginPath: string): Promise<Component[]> {
    const commands: Component[] = [];
    const commandsDir = path.join(pluginPath, 'commands');

    try {
      const files = await fs.readdir(commandsDir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = path.join(commandsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');

        // Extract command name from header (# /prefix:name)
        const match = content.match(/^#\s+(\/[\w:-]+)/m);
        const commandName = match ? match[1] : `/${file.replace('.md', '')}`;

        commands.push({
          id: this.generateId('command', commandName),
          name: commandName,
          type: 'command',
          metadata: { file }
        });
      }
    } catch {
      // No commands directory
    }

    return commands;
  }

  private async discoverSkills(pluginPath: string): Promise<Component[]> {
    const skills: Component[] = [];
    const skillsDir = path.join(pluginPath, 'skills');

    try {
      const dirs = await fs.readdir(skillsDir);
      for (const dir of dirs) {
        const skillPath = path.join(skillsDir, dir, 'SKILL.md');
        try {
          const content = await fs.readFile(skillPath, 'utf-8');

          // Extract name from frontmatter
          const nameMatch = content.match(/^---[\s\S]*?name:\s*(.+?)[\s\n]/m);
          const skillName = nameMatch ? nameMatch[1].trim() : dir;

          skills.push({
            id: this.generateId('skill', skillName),
            name: skillName,
            type: 'skill',
            metadata: { directory: dir, content }
          });
        } catch {
          // No SKILL.md in this directory
        }
      }
    } catch {
      // No skills directory
    }

    return skills;
  }

  private async discoverHooks(pluginPath: string): Promise<Component[]> {
    const hooks: Component[] = [];
    const hooksDir = path.join(pluginPath, 'hooks');

    try {
      const files = await fs.readdir(hooksDir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const hookName = file.replace('.md', '');
        hooks.push({
          id: this.generateId('hook', hookName),
          name: hookName,
          type: 'hook',
          metadata: { file }
        });
      }
    } catch {
      // No hooks directory
    }

    return hooks;
  }

  private async discoverMcpServers(pluginPath: string): Promise<Component[]> {
    const mcps: Component[] = [];
    const mcpPath = path.join(pluginPath, '.mcp.json');

    try {
      const content = await fs.readFile(mcpPath, 'utf-8');
      const mcpJson: McpJson = JSON.parse(content);

      if (mcpJson.mcpServers) {
        for (const serverName of Object.keys(mcpJson.mcpServers)) {
          mcps.push({
            id: this.generateId('mcp', serverName),
            name: serverName,
            type: 'mcp',
            metadata: { config: mcpJson.mcpServers[serverName] }
          });
        }
      }
    } catch {
      // No .mcp.json
    }

    return mcps;
  }

  private async discoverModules(pluginPath: string): Promise<Component[]> {
    const modules: Component[] = [];
    const srcDir = path.join(pluginPath, 'src');

    try {
      const entries = await fs.readdir(srcDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          modules.push({
            id: this.generateId('module', entry.name),
            name: entry.name,
            type: 'module',
            metadata: {}
          });
        }
      }
    } catch {
      // No src directory
    }

    return modules;
  }

  private async detectRelationships(
    pluginPath: string,
    skills: Component[],
    commands: Component[]
  ): Promise<Connection[]> {
    const edges: Connection[] = [];

    // Check skills for command references
    for (const skill of skills) {
      const content = skill.metadata.content as string | undefined;
      if (!content) continue;

      for (const command of commands) {
        // Look for command references like /prefix:name
        if (content.includes(command.name)) {
          edges.push({
            id: `${skill.id}-triggers-${command.id}`,
            from: skill.id,
            to: command.id,
            type: 'triggers'
          });
        }
      }
    }

    return edges;
  }
}
