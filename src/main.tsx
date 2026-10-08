import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AsyncOperationsProvider } from './context/AsyncOperationsContext.tsx';
import { AudioNotificationProvider } from './context/AudioNotificationContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { setupPWA } from './pwaRegister';
import './index.css';

// Initialize PWA Service Worker
setupPWA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AsyncOperationsProvider>
        <AuthProvider>
          <ThemeProvider>
            <AudioNotificationProvider>
              <App />
            </AudioNotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </AsyncOperationsProvider>
    </ErrorBoundary>
  </StrictMode>,
);

