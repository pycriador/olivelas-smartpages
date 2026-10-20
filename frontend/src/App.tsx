import React, { useEffect, useState } from 'react';
import { CopanThemeProvider } from './theme/CopanThemeProvider';
import { useAuthStore } from './stores/useAuthStore';
import { useProjectStore } from './stores/useProjectStore';
import { LandingPage } from './features/landing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorsManager } from './features/errors/ErrorsManager';
import { resolveSectionFromPathname, syncRouteAndParams } from './utils/urlState';

export const App: React.FC = () => {
  const { isAuthenticated, showLogin, setShowLogin, token, refreshUser } = useAuthStore();
  const { activeSection, setActiveSection } = useProjectStore();
  const [currentRoute, setCurrentRoute] = useState(() =>
    typeof window !== 'undefined' ? resolveSectionFromPathname(window.location.pathname) : 'landing'
  );

  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, []);

  useEffect(() => {
    const handleLocationSync = () => {
      const resolved = resolveSectionFromPathname(window.location.pathname);
      setCurrentRoute(resolved);
      if (resolved === 'login') {
        setShowLogin(true);
      } else if (resolved === 'landing') {
        setShowLogin(false);
      } else {
        setShowLogin(false);
        if (resolved !== activeSection) {
          setActiveSection(resolved, false);
        }
      }
    };

    handleLocationSync();
    window.addEventListener('popstate', handleLocationSync);
    window.addEventListener('opspages:urlchange', handleLocationSync);
    return () => {
      window.removeEventListener('popstate', handleLocationSync);
      window.removeEventListener('opspages:urlchange', handleLocationSync);
    };
  }, [activeSection]);

  useEffect(() => {
    if (isAuthenticated && (window.location.pathname === '/' || window.location.pathname === '/login')) {
      syncRouteAndParams(`/${activeSection || 'dashboard'}`, { page: 1, page_size: 10 }, false);
    } else if (!isAuthenticated && showLogin && window.location.pathname !== '/login') {
      syncRouteAndParams('/login', {}, true);
    }
  }, [isAuthenticated, showLogin]);

  const renderRootView = () => {
    if (isAuthenticated) {
      return <AppLayout />;
    }
    if (currentRoute === 'errors') {
      return (
        <ErrorsManager
          standalone
          onBackToHome={() => {
            setShowLogin(false);
            syncRouteAndParams('/', { page: 1, page_size: 10 }, true);
          }}
        />
      );
    }
    if (showLogin || currentRoute === 'login') {
      return <LoginPage />;
    }
    return <LandingPage />;
  };

  return <CopanThemeProvider>{renderRootView()}</CopanThemeProvider>;
};

export default App;
