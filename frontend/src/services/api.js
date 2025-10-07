import axios from 'axios';
import Cookies from 'js-cookie';
import { createLogger } from '../lib/logger';

const logger = createLogger('API');
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests and log requests
api.interceptors.request.use((config) => {
  // Log request
  const requestId = logger.logApiRequest(
    config.method.toUpperCase(),
    `${config.baseURL}${config.url}`,
    Date.now()
  );
  
  // Store requestId for response logging
  config.metadata = { requestId };
  
  // Add auth token
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  logger.debug('Request headers:', config.headers);
  return config;
}, (error) => {
  logger.error('Request error:', error);
  return Promise.reject(error);
});

// Log responses and errors
api.interceptors.response.use(
  (response) => {
    const { config } = response;
    const requestId = config.metadata?.requestId;
    logger.logApiResponse(requestId, response.status);
    
    return response;
  },
  (error) => {
    const { config, response } = error;
    const requestId = config?.metadata?.requestId;
    const status = response?.status || 'NETWORK_ERROR';
    
    logger.logApiResponse(requestId, status, error);
    
    return Promise.reject(error);
  }
);

export default api;

export { API_BASE_URL };
