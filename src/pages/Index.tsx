import React, { useState, useEffect } from 'react';
import { TransitLogbook } from '@/components/TransitLogbook';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Smartphone, X } from 'lucide-react';

const Index = () => {
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user is on mobile and hasn't dismissed the prompt
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasDismissed = localStorage.getItem('mobile-app-prompt-dismissed') === 'true';
    
    if (isMobile && !hasDismissed && !dismissed) {
      setShowMobilePrompt(true);
    }
  }, [dismissed]);

  const handleDismiss = () => {
    setShowMobilePrompt(false);
    setDismissed(true);
    localStorage.setItem('mobile-app-prompt-dismissed', 'true');
  };

  const openMobileApp = () => {
    window.open('/mobile-index.html', '_blank');
  };

  return (
    <div className="relative">
      {showMobilePrompt && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Smartphone className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="flex-1 mr-4">
              For a better mobile experience, try our dedicated mobile app with offline capabilities.
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={openMobileApp}>
                Open Mobile App
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <TransitLogbook />
      
      {/* Footer with mobile app link */}
      <div className="fixed bottom-4 right-4 md:hidden">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={openMobileApp}
          className="shadow-lg"
        >
          <Smartphone className="h-4 w-4 mr-2" />
          Mobile App
        </Button>
      </div>
    </div>
  );
};

export default Index;
