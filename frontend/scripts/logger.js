#!/usr/bin/env node

/**
 * Frontend Logger CLI
 * 
 * A simple utility to format and colorize frontend console logs coming from
 * the browser console. This helps in monitoring frontend logs in the terminal
 * with proper formatting and colors for different log levels.
 */

const readline = require('readline');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Log level formatting
const logLevels = {
  debug: { color: colors.cyan, prefix: 'DEBUG' },
  info: { color: colors.green, prefix: 'INFO ' },
  warn: { color: colors.yellow, prefix: 'WARN ' },
  error: { color: colors.red, prefix: 'ERROR' },
  log: { color: colors.white, prefix: 'LOG  ' }
};

// Create interface for reading stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Print banner
console.log(`${colors.bgCyan}${colors.black}${colors.bright} FRONTEND LOGGER ${colors.reset}`);
console.log(`${colors.dim}Monitoring for frontend logs...${colors.reset}\n`);

// Listen for log lines
rl.on('line', (line) => {
  try {
    // Try to parse as JSON (for structured logs)
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (e) {
      // Not JSON, treat as plain text
      console.log(line);
      return;
    }

    // Extract log level and format accordingly
    const { level = 'info', message, timestamp, module, ...rest } = parsed;
    const formatter = logLevels[level.toLowerCase()] || logLevels.log;
    
    // Format timestamp
    const time = timestamp ? new Date(timestamp).toISOString().split('T')[1].slice(0, 12) : new Date().toISOString().split('T')[1].slice(0, 12);
    
    // Build log line
    let logLine = `${colors.dim}${time}${colors.reset} ${formatter.color}${formatter.prefix}${colors.reset}`;
    
    // Add module name if available
    if (module) {
      logLine += ` ${colors.magenta}[${module}]${colors.reset}`;
    }
    
    // Add message
    logLine += ` ${message}`;
    
    // Add additional data if present
    if (Object.keys(rest).length > 0) {
      logLine += ` ${colors.dim}${JSON.stringify(rest)}${colors.reset}`;
    }
    
    console.log(logLine);
  } catch (error) {
    // Fallback for any parsing errors
    console.log(line);
  }
});

// Handle ctrl+c
process.on('SIGINT', () => {
  console.log(`\n${colors.dim}Logger terminated${colors.reset}`);
  process.exit(0);
});