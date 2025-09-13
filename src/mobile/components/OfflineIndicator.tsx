import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';
import { networkService, NetworkStatus } from '../services/network.service';
import { syncService, SyncProgress } from '../services/sync.service';
import { databaseService } from '../services/database.service';

export const OfflineIndicator: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    connected: false,
    connectionType: 'none'
  });
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: false
  });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Initialize network status
    setNetworkStatus(networkService.getStatus());

    // Listen for network changes
    const unsubscribeNetwork = networkService.onStatusChange(setNetworkStatus);

    // Listen for sync progress
    const unsubscribeSync = syncService.onSyncProgress(setSyncProgress);

    // Update pending count
    const updatePendingCount = async () => {
      const stats = await databaseService.getStats();
      setPendingCount(stats.pending);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (networkStatus.connected && !syncProgress.inProgress) {
      try {
        await syncService.startSync();
      } catch (error) {
        console.error('Manual sync failed:', error);
      }
    }
  };

  const getNetworkIcon = () => {
    return networkStatus.connected ? (
      <Wifi className="h-4 w-4" />
    ) : (
      <WifiOff className="h-4 w-4" />
    );
  };

  const getNetworkText = () => {
    if (networkStatus.connected) {
      return `Online (${networkStatus.connectionType})`;
    }
    return 'Offline';
  };

  const getSyncStatus = () => {
    if (syncProgress.inProgress) {
      return `Syncing... ${syncProgress.completed}/${syncProgress.total}`;
    }
    if (pendingCount > 0) {
      return `${pendingCount} pending`;
    }
    return 'All synced';
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-background border-b">
      {/* Network Status */}
      <Badge 
        variant={networkStatus.connected ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {getNetworkIcon()}
        <span className="text-xs">{getNetworkText()}</span>
      </Badge>

      {/* Sync Status */}
      <Badge 
        variant={pendingCount > 0 ? "secondary" : "outline"}
        className="flex items-center gap-1"
      >
        <Database className="h-4 w-4" />
        <span className="text-xs">{getSyncStatus()}</span>
      </Badge>

      {/* Manual Sync Button */}
      {networkStatus.connected && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleManualSync}
          disabled={syncProgress.inProgress}
          className="h-8 px-2"
        >
          <RefreshCw 
            className={`h-4 w-4 ${syncProgress.inProgress ? 'animate-spin' : ''}`} 
          />
        </Button>
      )}

      {/* Sync Progress */}
      {syncProgress.inProgress && (
        <div className="text-xs text-muted-foreground">
          {syncProgress.currentItem}
        </div>
      )}
    </div>
  );
};