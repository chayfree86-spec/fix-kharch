import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { SplashScreen } from './components/ui/SplashScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { FullScreenLoader } from './components/ui/Loader';
import { PWAInstallPrompt } from './components/pwa/PWAInstallPrompt';
import { Dashboard } from './pages/Dashboard';
import { StaffScreen } from './pages/StaffScreen';
import { EMIScreen } from './pages/EMIScreen';
import { ShopExpensesScreen } from './pages/ShopExpensesScreen';
import { OtherExpensesScreen } from './pages/OtherExpensesScreen';
import { GenericCategoryScreen } from './pages/GenericCategoryScreen';
import { ReportsScreen } from './pages/ReportsScreen';
import { SettingsScreen } from './pages/SettingsScreen';
import { PageMaskTransition } from './components/ui/PageMaskTransition';

const MainContent: React.FC = () => {
  const { currentTab, categories } = useApp();

  // Automatically scroll to top whenever a new tab/page is opened
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentTab]);

  const renderScreen = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'staff':
        return <StaffScreen />;
      case 'emi':
        return <EMIScreen />;
      case 'shop':
        return <ShopExpensesScreen />;
      case 'other':
        return <OtherExpensesScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default: {
        const foundCategory = categories.find(c => c.id === currentTab);
        if (foundCategory) {
          return <GenericCategoryScreen category={foundCategory} />;
        }
        return <Dashboard />;
      }
    }
  };

  return (
    <AppLayout>
      <PageMaskTransition pageKey={currentTab}>
        {renderScreen()}
      </PageMaskTransition>
    </AppLayout>
  );
};

const Root: React.FC = () => {
  const { authStatus } = useApp();
  const [splashDone, setSplashDone] = useState(false);

  // 1. Branded splash first — always shown at startup, before anything else.
  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  // 2. Splash finished but the session check is still running (slow network) —
  //    show a theme loader instead of a blank screen.
  if (authStatus === 'loading') {
    return <FullScreenLoader label="Getting things ready…" />;
  }

  // 3. Not logged in → login screen (appears AFTER the splash, not before it).
  if (authStatus === 'unauthenticated') {
    return <AuthScreen />;
  }

  // 4. Logged in → the app. No second splash after login.
  return <MainContent />;
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <Root />
      <PWAInstallPrompt />
    </AppProvider>
  );
};

export default App;
