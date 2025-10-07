# Logging System Documentation

This document outlines the logging infrastructure implemented in both the frontend and backend of our recruitment platform application.

## Frontend Logging

### Overview

The frontend logging system provides consistent logging across the application with different log levels. It includes:

- Structured logging with contextual information (timestamp, module, etc.)
- Different log levels (DEBUG, INFO, WARN, ERROR)
- API request/response tracking
- Route change logging
- Authentication event logging
- Performance metrics
- Global error handling

### Usage

#### Basic Usage

```javascript
import { createLogger } from '../lib/logger';

// Create a logger for your component or module
const logger = createLogger('MyComponent');

// Log at different levels
logger.debug('Detailed information for debugging');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error message', errorObject);
```

#### API Request Logging

The API service automatically logs all requests and responses with timing information.

#### Running with Enhanced Logging

To run the frontend with the enhanced terminal logger:

```bash
# In the frontend directory
npm run start:log
# or
yarn start:log
```

### Implementation Details

- `frontend/src/lib/logger.js` - Main logger utility
- `frontend/src/services/api.js` - API service with request/response logging
- `frontend/src/contexts/AuthContext.js` - Authentication event logging
- `frontend/src/App.js` - Route change and application logging
- `frontend/src/components/ErrorBoundary.js` - React error boundary for catching component errors

## Backend Logging

### Overview

The backend logging system provides comprehensive logging for the FastAPI application. It includes:

- File and console logging
- Custom formatting with timestamps and log levels
- Request logging middleware for HTTP requests
- Automatic log file rotation (daily)

### Usage

#### Basic Usage

```python
from utils.logger import get_logger

# Create a logger for your module
logger = get_logger("my_module")

# Log at different levels
logger.debug("Debug message")
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")
logger.exception("Exception with traceback", exc_info=True)
```

#### Request Logging

All HTTP requests are automatically logged by the middleware in `server.py`.

### Implementation Details

- `backend/utils/logger.py` - Main logger utility
- `backend/server.py` - FastAPI middleware for request logging

## Running the Application with Logging

### Frontend

```bash
cd frontend
npm run start:log
# or
yarn start:log
```

### Backend

```bash
cd backend
python server.py
```

The logs will be displayed in the terminal and also stored in log files for the backend.