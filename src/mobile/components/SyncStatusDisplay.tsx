import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { syncService, SyncProgress } from '../services/sync.service';
import { databaseService } from '../services/database.service';
import { networkService } from '../services/network.service';
import { useMobileServices } from '../providers/MobileServiceProvider';

interface SyncStatusDisplayProps {
  showProgress?: boolean;
  compact?: boolean;
}

export const SyncStatusDisplay: React.FC<SyncStatusDisplayProps> = ({ 
  showProgress = true, 
  compact = false 
}) => {
  const [syncProgress, setSyncProgress] = React.useState<SyncProgress | null>(null);
  const [isOnline, setIsOnline] = React.useState(networkService.isOnline());
  const [stats, setStats] = React.useState({ pending: 0, failed: 0, synced: 0 });
  const [tableCounts, setTableCounts] = React.useState<any>(null);
  const { isReady } = useMobileServices();

  React.useEffect(() => {
    // Listen for sync progress updates
    const unsubscribeSync = syncService.onSyncProgress((progress) => {
      setSyncProgress(progress);
    });

    // Listen for network status changes
    const unsubscribeNetwork = networkService.onStatusChange((status) => {
      setIsOnline(status.connected);
    });

    // Load initial stats
    loadStats();
    const statsInterval = setInterval(loadStats, 5000); // Update stats every 5 seconds

    return () => {
      unsubscribeSync();
      unsubscribeNetwork();
      clearInterval(statsInterval);
    };
  }, []);

  const loadStats = async () => {
    try {
      const [newStats, counts] = await Promise.all([
        syncService.getSyncStats(),
        databaseService.getTableCounts()
      ]);
      setStats(newStats);
      setTableCounts(counts);
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline || !isReady) return;
    
    try {
      // Upload local changes first
      await syncService.startSync();
      // Then download latest data from server
      await syncService.downloadLatestData();
      // Notify the app that offline data has updated
      window.dispatchEvent(new CustomEvent('offline-data-updated', { detail: { source: 'manual-sync' } }));
      // Refresh stats after sync
      await loadStats();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {isOnline ? (
          <Wifi className="h-3 w-3 text-green-600" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-600" />
        )}
        
        {stats.pending > 0 && (
          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
            {stats.pending} pending
          </span>
        )}
        
        {stats.failed > 0 && (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
            {stats.failed} failed
          </span>
        )}

        {syncProgress?.inProgress && (
          <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
        )}
      </div>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Offline</span>
              </>
            )}
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            disabled={!isOnline || !isReady || syncProgress?.inProgress}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${syncProgress?.inProgress ? 'animate-spin' : ''}`} />
            {syncProgress?.inProgress ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        {/* Sync Progress */}
        {syncProgress?.inProgress && showProgress && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Syncing Data...</span>
              <span className="text-xs text-muted-foreground">
                {syncProgress.completed}/{syncProgress.total}
              </span>
            </div>
            
            <Progress 
              value={(syncProgress.completed / syncProgress.total) * 100} 
              className="h-2 mb-2"
            />
            
            {syncProgress.currentItem && (
              <div className="text-xs text-muted-foreground">
                {syncProgress.currentItem}
              </div>
            )}

            {syncProgress.failed > 0 && (
              <div className="text-xs text-red-600 mt-1">
                ⚠️ {syncProgress.failed} items failed (conflicts resolved automatically)
              </div>
            )}
          </div>
        )}

        {/* Upload Queue Stats */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Upload Queue</h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center">
              {stats.pending > 0 ? (
                <AlertTriangle className="h-5 w-5 text-orange-600 mb-1" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600 mb-1" />
              )}
              <div className="text-sm font-medium">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            
            <div className="flex flex-col items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mb-1" />
              <div className="text-sm font-medium">{stats.synced}</div>
              <div className="text-xs text-muted-foreground">Synced</div>
            </div>
            
            <div className="flex flex-col items-center">
              {stats.failed > 0 ? (
                <XCircle className="h-5 w-5 text-red-600 mb-1" />
              ) : (
                <CheckCircle className="h-5 w-5 text-gray-400 mb-1" />
              )}
              <div className="text-sm font-medium">{stats.failed}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
          </div>
        </div>

        {/* Local Data Counts */}
        {tableCounts && (
          <div>
            <h4 className="text-sm font-medium mb-2">Local Data</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>Customers:</span>
                <span className="font-medium">{tableCounts.customers}</span>
              </div>
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>Items:</span>
                <span className="font-medium">{tableCounts.items}</span>
              </div>
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>Outward:</span>
                <span className="font-medium">{tableCounts.outward_entries}</span>
              </div>
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>Sales:</span>
                <span className="font-medium">{tableCounts.sales}</span>
              </div>
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>Receipts:</span>
                <span className="font-medium">{tableCounts.receipts}</span>
              </div>
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>Ledger:</span>
                <span className="font-medium">{tableCounts.customer_ledger}</span>
              </div>
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>Credit Notes:</span>
                <span className="font-medium">{tableCounts.credit_notes || 0}</span>
              </div>
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>Debit Notes:</span>
                <span className="font-medium">{tableCounts.debit_notes || 0}</span>
              </div>
              <div className="flex justify-between bg-muted p-2 rounded">
                <span>Settings:</span>
                <span className="font-medium">{tableCounts.company_settings || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        {stats.pending > 0 && (
          <div className="mt-3 p-2 bg-orange-50 rounded border-l-4 border-orange-200">
            <div className="text-xs text-orange-800">
              📊 <strong>Multi-device conflict protection:</strong> Serial numbers and bill numbers 
              will be automatically re-ordered when syncing to prevent conflicts between devices.
            </div>
          </div>
        )}

        {stats.failed > 0 && (
          <div className="mt-2 p-2 bg-red-50 rounded border-l-4 border-red-200">
            <div className="text-xs text-red-800">
              Some items failed to sync. Check your connection and try again.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};