import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from 'sonner';
import logger from './lib/logger';

// Performance monitoring for app startup
const startTime = performance.now();

// Log app initialization
logger.info('Application starting...');

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
      <Toaster position="top-right" richColors />
    </React.StrictMode>
  );
  
  // Log successful render
  const renderTime = (performance.now() - startTime).toFixed(2);
  logger.info(`Application rendered successfully in ${renderTime}ms`);
  
  // Report performance to console
  if (process.env.NODE_ENV !== 'production') {
    console.log(`%c✨ App rendered in ${renderTime}ms`, 'color: green; font-weight: bold;');
  }
} catch (error) {
  // Log critical errors during initialization
  logger.error('Critical error during application initialization:', error);
}
