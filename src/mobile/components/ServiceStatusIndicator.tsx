import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMobileServices } from '../providers/MobileServiceProvider';
import { 
  Database, 
  Wifi, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw 
} from 'lucide-react';

export const ServiceStatusIndicator: React.FC = () => {
  const { isReady, status, error, retryInitialization } = useMobileServices();

  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'initializing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Error';
      case 'initializing':
        return 'Loading...';
      default:
        return 'Unknown';
    }
  };

  if (isReady && !error) {
    return null; // Don't show when everything is working
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Service Status</h3>
            {error && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={retryInitialization}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>Database</span>
              {getStatusIcon(status.database)}
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              <span>Network</span>
              {getStatusIcon(status.network)}
            </div>
            <div className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              <span>Sync</span>
              {getStatusIcon(status.sync)}
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-white p-2 rounded border">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!isReady && !error && (
            <div className="text-xs text-blue-600">
              Initializing mobile services...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};