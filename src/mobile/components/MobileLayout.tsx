import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator';
import { supabase } from '@/integrations/supabase/client';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  title, 
  action 
}) => {
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header with offline indicator */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {title && (
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{title}</h1>
              </div>
              <div className="flex items-center gap-2">
                {action}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
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