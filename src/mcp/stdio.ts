#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GoalsApiClient } from './client';
import { createGoalsMcpServer } from './server';

async function main(): Promise<void> {
  const api = new GoalsApiClient(process.env.GOALS_API_URL?.trim() ?? '', process.env.GOALS_API_TOKEN?.trim() ?? '');
  const server = createGoalsMcpServer(api);
  try { await server.connect(new StdioServerTransport()); }
  catch (error) { await server.close(); throw error; }
  const close = () => { void server.close(); };
  process.once('SIGTERM', close);
  process.once('SIGINT', close);
  process.stdin.once('end', close);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Goals MCP could not start.');
  process.exitCode = 1;
});
