/**
 * Logger utility for the frontend application.
 * Provides consistent logging across the app with different log levels and
 * the ability to send logs to both console and potentially a backend API.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Configure the minimum log level (adjust as needed)
const MIN_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

// Track API request status
const apiRequests = {};

class Logger {
  constructor(module) {
    this.module = module;
  }

  /**
   * Format log message with timestamp and module
   */
  _formatMessage(message) {
    return `[${new Date().toISOString()}] [${this.module}] ${message}`;
  }

  // Track if we're currently logging to prevent recursive loops
  static _isLogging = false;

  /**
   * Send log to console with recursion protection
   */
  _log(level, message, ...args) {
    if (level < MIN_LOG_LEVEL) return;

    // Skip if we're already logging to prevent recursion
    if (Logger._isLogging) return;

    try {
      Logger._isLogging = true;
      const formattedMessage = this._formatMessage(message);
      
      switch (level) {
        case LOG_LEVELS.DEBUG:
          console.debug(formattedMessage, ...args);
          break;
        case LOG_LEVELS.INFO:
          console.info(formattedMessage, ...args);
          break;
        case LOG_LEVELS.WARN:
          console.warn(formattedMessage, ...args);
          break;
        case LOG_LEVELS.ERROR:
          console.error(formattedMessage, ...args);
          break;
        default:
          console.log(formattedMessage, ...args);
      }
    } finally {
      Logger._isLogging = false;
    }
  }

  debug(message, ...args) {
    this._log(LOG_LEVELS.DEBUG, message, ...args);
  }

  info(message, ...args) {
    this._log(LOG_LEVELS.INFO, message, ...args);
  }

  warn(message, ...args) {
    this._log(LOG_LEVELS.WARN, message, ...args);
  }

  error(message, ...args) {
    this._log(LOG_LEVELS.ERROR, message, ...args);
  }

  // Special method for API request logging
  logApiRequest(method, url, startTime) {
    const requestId = `${method}-${url}-${startTime}`;
    apiRequests[requestId] = { method, url, startTime };
    this.debug(`API Request: ${method} ${url}`);
    return requestId;
  }

  // Log API response with timing and error protection
  logApiResponse(requestId, status, error = null) {
    try {
      const request = apiRequests[requestId];
      if (!request) return;

      const { method, url, startTime } = request;
      const duration = (Date.now() - startTime) / 1000;

      if (error) {
        // For errors, only log a simple message to avoid recursive logging issues
        const errorMessage = error?.message || 'Unknown error';
        const responseData = error?.response?.data ? ` - ${JSON.stringify(error.response.data)}` : '';
        
        this.error(`API Error: ${method} ${url} - Status: ${status} - Time: ${duration.toFixed(2)}s - ${errorMessage}${responseData}`);
      } else {
        this.debug(`API Response: ${method} ${url} - Status: ${status} - Time: ${duration.toFixed(2)}s`);
      }

      // Clean up
      delete apiRequests[requestId];
    } catch (e) {
      // If logging itself fails, use a simple console error
      console.error("Error in logApiResponse:", e);
    }
  }
}

// Create logger factory
export const createLogger = (module) => new Logger(module);

// Default app logger
export const logger = createLogger('App');

export default logger;