import React, { useState } from 'react';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { MoreMenu } from './MoreMenu';
import { GlobalQuickActionModal } from '../modals/GlobalQuickActionModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-warm-beige flex flex-col md:flex-row text-coffee">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
        {/* Mobile / Shared AppHeader */}
        <AppHeader />

        {/* Page Content Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-3 py-3.5 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation onMoreClick={() => setIsMoreOpen(true)} isMoreOpen={isMoreOpen} />
      <MoreMenu isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />

      {/* Global Quick Add Action Modal */}
      <GlobalQuickActionModal />
    </div>
  );
};
