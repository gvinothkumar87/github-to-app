import React from 'react';
import { OfflineIndicator } from './OfflineIndicator';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with offline indicator */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {title && (
          <div className="border-b px-4 py-3">
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        )}
        <OfflineIndicator />
      </header>

      {/* Main content */}
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
};