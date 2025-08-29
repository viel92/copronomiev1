import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Marketing from './pages/Marketing';
import Login from './pages/Login';
import Billing from './pages/Billing';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './components/AuthProvider';
import * as Sentry from '@sentry/react';
import { logtail } from './lib/logging';

Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });

logtail.info('App starting');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Une erreur est survenue</p>}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Marketing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
            <Route path="/app" element={<PrivateRoute><App /></PrivateRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
