// MCP-specific logger configuration
// This ensures all logs go to stderr, keeping stdout clean for JSON-RPC

// Redirect console.log to stderr
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  process.stderr.write(args.join(' ') + '\n');
};

// Ensure console.error goes to stderr (it should by default, but let's be explicit)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  process.stderr.write(args.join(' ') + '\n');
};

// Redirect console.warn to stderr
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  process.stderr.write(args.join(' ') + '\n');
};

// Redirect console.info to stderr
const originalConsoleInfo = console.info;
console.info = (...args: any[]) => {
  process.stderr.write(args.join(' ') + '\n');
};

// Redirect console.debug to stderr
const originalConsoleDebug = console.debug;
console.debug = (...args: any[]) => {
  process.stderr.write(args.join(' ') + '\n');
};

export {
  originalConsoleLog,
  originalConsoleError,
  originalConsoleWarn,
  originalConsoleInfo,
  originalConsoleDebug
};