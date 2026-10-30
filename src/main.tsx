import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { systemLogger } from './services/systemLogger';

// Initialize global unhandled error and rejection monitoring
systemLogger.initGlobalListeners();

// Register Firebase Cloud Messaging Service Worker for background notifications
if ('serviceWorker' in navigator && !window.location.host.includes('localhost:5173')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('[Service Worker] FCM SW registered successfully:', registration.scope);
      })
      .catch((err) => {
        console.warn('[Service Worker] FCM SW registration failed/skipped:', err?.message || err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  </ErrorBoundary>,
);
