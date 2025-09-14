import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleBackClick = () => {
    if (onBack) {
      onBack();
      return;
    }
    
    // If we're on the home page (/), exit the app
    if (location.pathname === '/') {
      // For mobile/capacitor apps, we can use history.back() to potentially exit
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // If there's no history, we're at the root - this should exit the app
        if (window.navigator && 'app' in window.navigator) {
          // @ts-ignore - Capacitor specific
          window.navigator.app?.exitApp?.();
        }
      }
    } else {
      // For other pages, navigate back to home
      navigate('/');
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header with offline indicator */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {title && (
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showBackButton && (
                  <Button variant="ghost" size="sm" onClick={handleBackClick}>
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