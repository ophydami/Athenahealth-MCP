#!/usr/bin/env node

// MUST be first import - redirects all console output to stderr for MCP compatibility
import './utils/mcp-logger.js';

import { config } from 'dotenv';
import { AthenaHealthMCPServer } from './mcp-server.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the project root
const envPath = join(__dirname, '..', '.env');
config({ path: envPath });

console.error('Loading .env from:', envPath);
console.error('Environment check:', {
  ATHENA_CLIENT_ID: process.env.ATHENA_CLIENT_ID ? 'Set' : 'Not set',
  ATHENA_CLIENT_SECRET: process.env.ATHENA_CLIENT_SECRET ? 'Set' : 'Not set',
  ATHENA_BASE_URL: process.env.ATHENA_BASE_URL ? 'Set' : 'Not set',
  ATHENA_PRACTICE_ID: process.env.ATHENA_PRACTICE_ID ? 'Set' : 'Not set',
});

// Handle graceful shutdown
let server: AthenaHealthMCPServer | null = null;

const gracefulShutdown = async (signal: string) => {
  console.error(`Received ${signal}, shutting down gracefully`);
  
  if (server) {
    try {
      await server.stop();
      console.error('Server stopped successfully');
    } catch (error) {
      console.error('Error during server shutdown:', error);
    }
  }
  
  process.exit(0);
};

// Register shutdown handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message, error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason, promise);
  process.exit(1);
});

// Main function
async function main() {
  try {
    console.error('Starting athenahealth MCP Server');
    
    // Create and initialize server
    server = new AthenaHealthMCPServer();
    await server.initialize();
    
    // Start server
    await server.run();
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Fatal error during server startup:', error);
  process.exit(1);
}); 