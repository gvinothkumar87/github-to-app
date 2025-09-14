import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  title, 
  showBackButton, 
  onBack, 
  action 
}) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with offline indicator */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {title && (
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showBackButton && onBack && (
                  <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <h1 className="text-lg font-semibold">{title}</h1>
              </div>
              {action}
            </div>
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