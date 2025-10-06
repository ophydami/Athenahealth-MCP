import winston from 'winston';
import { format } from 'winston';
import { mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Determine project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// The compiled logger.js will be in dist/utils, so we go up two levels
const projectRoot = resolve(__dirname, '..', '..'); 

// Get the absolute path to the logs directory
const logsDir = resolve(projectRoot, 'logs');

// Ensure log directory exists
const ensureLogDirectory = (filepath: string) => {
  try {
    const dir = dirname(filepath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  } catch (error) {
    console.error(`Failed to create log directory for ${filepath}:`, error);
    // Continue without crashing - logs will go to console only
  }
};

// Define sensitive data patterns that should be sanitized
const SENSITIVE_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card numbers
  /\b\d{10,}\b/g, // Phone numbers (10+ digits)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // Date of birth patterns
  /\b\d{4}-\d{2}-\d{2}\b/g, // ISO date patterns
];

// HIPAA-compliant data sanitization
const sanitizeData = (data: any): any => {
  if (typeof data === 'string') {
    let sanitized = data;
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    return sanitized;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Sanitize keys that commonly contain sensitive data
      if (key.toLowerCase().includes('ssn') || 
          key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('authorization') ||
          key.toLowerCase().includes('dob') ||
          key.toLowerCase().includes('birthdate') ||
          key.toLowerCase().includes('phone') ||
          key.toLowerCase().includes('email') ||
          key.toLowerCase().includes('address')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }
  
  return data;
};

// Custom format for HIPAA-compliant logging
const hipaaFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  const sanitizedMeta = sanitizeData(meta);
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...sanitizedMeta,
  });
});

// Ensure log directories exist with absolute paths
ensureLogDirectory(resolve(logsDir, 'error.log'));
ensureLogDirectory(resolve(logsDir, 'combined.log'));
ensureLogDirectory(resolve(logsDir, 'audit.log'));

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    hipaaFormat
  ),
  defaultMeta: {
    service: 'athenahealth-mcp-server',
    version: '1.0.0',
  },
  transports: [
    // Write all logs with importance level of 'error' or higher to error.log
    new winston.transports.File({ 
      filename: resolve(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: resolve(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true,
    }),
    // Write audit logs separately for HIPAA compliance
    new winston.transports.File({ 
      filename: resolve(logsDir, 'audit.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 50, // Keep more audit logs
      tailable: true,
    }),
  ],
  // Exit on error false to prevent crashes
  exitOnError: false,
});

// Add console logging for development
// MCP servers must only output JSON-RPC to stdout, so we log to stderr
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.timestamp(),
      hipaaFormat
    ),
    stderrLevels: ['error', 'warn', 'info', 'debug'] // Send all levels to stderr
  }));
}

// Audit logging function for HIPAA compliance
export const auditLog = (action: string, details: {
  userId?: string;
  patientId?: string;
  resourceType?: string;
  resourceId?: string;
  result?: 'success' | 'failure';
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  error?: string;
}) => {
  const auditEntry = {
    action,
    timestamp: details.timestamp || new Date().toISOString(),
    userId: details.userId || 'system',
    patientId: details.patientId ? '[PATIENT_ID]' : undefined, // Always redact patient IDs
    resourceType: details.resourceType,
    resourceId: details.resourceId ? '[RESOURCE_ID]' : undefined, // Always redact resource IDs
    result: details.result || 'success',
    ipAddress: details.ipAddress ? '[IP_ADDRESS]' : undefined, // Always redact IP addresses
    userAgent: details.userAgent ? '[USER_AGENT]' : undefined, // Always redact user agents
    error: details.error,
  };

  // Remove undefined values
  const cleanedEntry = Object.fromEntries(
    Object.entries(auditEntry).filter(([_, value]) => value !== undefined)
  );

  logger.info('AUDIT', cleanedEntry);
};

// Helper function to log API access
export const logApiAccess = (endpoint: string, method: string, statusCode: number, userId?: string) => {
  auditLog('API_ACCESS', {
    resourceType: 'API_ENDPOINT',
    resourceId: `${method}:${endpoint}`,
    result: statusCode < 400 ? 'success' : 'failure',
    userId,
  });
};

// Helper function to log data access
export const logDataAccess = (resourceType: string, resourceId: string, action: string, userId?: string) => {
  auditLog('DATA_ACCESS', {
    resourceType,
    resourceId,
    userId,
    timestamp: new Date().toISOString(),
  });
};

// Helper function to log authentication events
export const logAuthEvent = (event: string, userId?: string, success: boolean = true) => {
  auditLog('AUTHENTICATION', {
    resourceType: 'AUTH_EVENT',
    resourceId: event,
    userId,
    result: success ? 'success' : 'failure',
  });
};

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

export default logger;