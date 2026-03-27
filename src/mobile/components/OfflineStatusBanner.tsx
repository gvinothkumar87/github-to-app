import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, CloudOff, AlertCircle } from 'lucide-react';

interface OfflineStatusBannerProps {
  isOnline: boolean;
  isServicesReady: boolean;
  error?: string | null;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({ 
  isOnline, 
  isServicesReady, 
  error 
}) => {
  if (isOnline && isServicesReady && !error) {
    return null; // Don't show banner when everything is working
  }

  const getStatusContent = () => {
    if (error) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        message: "Error: " + error,
        className: "border-red-200 bg-red-50"
      };
    }
    
    if (!isServicesReady) {
      return {
        icon: <CloudOff className="h-4 w-4 text-orange-600" />,
        message: "Services initializing...",
        className: "border-orange-200 bg-orange-50"
      };
    }
    
    if (!isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4 text-blue-600" />,
        message: "Working offline - Data will sync when online",
        className: "border-blue-200 bg-blue-50"
      };
    }
    
    return null;
  };

  const content = getStatusContent();
  if (!content) return null;

  return (
    <Card className={`mb-4 ${content.className}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-sm">
          {content.icon}
          <span>{content.message}</span>
        </div>
      </CardContent>
    </Card>
  );
};