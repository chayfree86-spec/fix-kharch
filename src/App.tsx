import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { SplashScreen } from './components/ui/SplashScreen';
import { Dashboard } from './pages/Dashboard';
import { StaffScreen } from './pages/StaffScreen';
import { EMIScreen } from './pages/EMIScreen';
import { ShopExpensesScreen } from './pages/ShopExpensesScreen';
import { OtherExpensesScreen } from './pages/OtherExpensesScreen';
import { GenericCategoryScreen } from './pages/GenericCategoryScreen';
import { ReportsScreen } from './pages/ReportsScreen';
import { SettingsScreen } from './pages/SettingsScreen';

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
      <div key={currentTab} className="animate-page-switch">
        {renderScreen()}
      </div>
    </AppLayout>
  );
};

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AppProvider>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <MainContent />
    </AppProvider>
  );
};

export default App;
