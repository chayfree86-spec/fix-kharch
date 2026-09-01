import React from 'react';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { GlobalQuickActionModal } from '../modals/GlobalQuickActionModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-warm-beige flex flex-col md:flex-row text-coffee">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Mobile / Shared AppHeader */}
        <AppHeader />

        {/* Page Content Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />

      {/* Global Quick Add Action Modal */}
      <GlobalQuickActionModal />
    </div>
  );
};
