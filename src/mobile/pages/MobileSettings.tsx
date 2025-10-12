import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { MobileLayout } from '../components/MobileLayout';
import { useToast } from '@/hooks/use-toast';
import { databaseService } from '../services/database.service';
import { syncService } from '../services/sync.service';
import { networkService } from '../services/network.service';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ONLINE_ONLY } from '../config';
import { 
  Wifi, 
  WifiOff,
  Database, 
  RefreshCw, 
  Trash2, 
  Settings as SettingsIcon,
  Smartphone,
  Cloud,
  HardDrive,
  Globe
} from 'lucide-react';

const MobileSettings: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [tableCounts, setTableCounts] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [forceDownloading, setForceDownloading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadStats();
    checkNetworkStatus();
    
    // Listen for network changes
    const unsubscribe = networkService.onStatusChange((status) => {
      setIsOnline(status.connected);
    });

    return unsubscribe;
  }, []);

  const loadStats = async () => {
    try {
      const [stats, counts] = await Promise.all([
        databaseService.getStats(),
        databaseService.getTableCounts()
      ]);
      setDbStats(stats);
      setTableCounts(counts);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkNetworkStatus = () => {
    setIsOnline(networkService.isOnline());
  };

  const handleSync = async () => {
    if (!isOnline) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'No Connection' : 'இணைப்பு இல்லை',
        description: language === 'english' ? 'Connect to internet to sync data' : 'தரவு ஒத்திசைக்க இணையத்துடன் இணைக்கவும்',
      });
      return;
    }

    setSyncing(true);
    try {
      // Upload local changes first
      await syncService.startSync();
      // Then download latest data from server
      await syncService.downloadLatestData();
      await loadStats();
      toast({
        title: language === 'english' ? 'Sync Complete' : 'ஒத்திசைவு முடிந்தது',
        description: language === 'english' ? 'All data synced successfully' : 'அனைத்து தரவுகளும் வெற்றிகரமாக ஒத்திசைக்கப்பட்டன',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Sync Failed' : 'ஒத்திசைவு தோல்வி',
        description: error.message,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleForceRedownload = async () => {
    if (!isOnline) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'No Connection' : 'இணைப்பு இல்லை',
        description: language === 'english' ? 'Connect to internet to download data' : 'தரவு பதிவிறக்க இணையத்துடன் இணைக்கவும்',
      });
      return;
    }

    setForceDownloading(true);
    try {
      await syncService.forceRedownload();
      await loadStats();
      toast({
        title: language === 'english' ? 'Download Complete' : 'பதிவிறக்கம் முடிந்தது',
        description: language === 'english' ? 'Latest data downloaded successfully' : 'சமீபத்திய தரவு வெற்றிகரமாக பதிவிறக்கப்பட்டது',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Download Failed' : 'பதிவிறக்கம் தோல்வி',
        description: error.message,
      });
    } finally {
      setForceDownloading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm(language === 'english' 
      ? 'Reset the entire offline database? This will delete ALL local data and cannot be undone!' 
      : 'முழு ஆஃப்லைன் தரவுத்தளத்தையும் மீட்டமைக்கவா? இது அனைத்து உள்ளூர் தரவையும் நீக்கும் மற்றும் இதை மாற்ற முடியாது!')) {
      return;
    }

    setResetting(true);
    try {
      await databaseService.resetDatabase();
      await loadStats();
      toast({
        title: language === 'english' ? 'Database Reset' : 'தரவுத்தளம் மீட்டமைக்கப்பட்டது',
        description: language === 'english' ? 'Database reset successfully. Download data to begin.' : 'தரவுத்தளம் வெற்றிகரமாக மீட்டமைக்கப்பட்டது. தொடங்க தரவை பதிவிறக்கவும்.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Reset Failed' : 'மீட்டமைப்பு தோல்வி',
        description: error.message,
      });
    } finally {
      setResetting(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm(language === 'english' 
      ? 'Are you sure you want to clear all offline data? This cannot be undone.' 
      : 'அனைத்து ஆஃப்லைன் தரவுகளையும் அழிக்க விரும்புகிறீர்களா? இதை மாற்ற முடியாது.')) {
      return;
    }

    try {
      await databaseService.clearSyncedItems();
      await loadStats();
      toast({
        title: language === 'english' ? 'Data Cleared' : 'தரவு அழிக்கப்பட்டது',
        description: language === 'english' ? 'Synced data cleared successfully' : 'ஒத்திசைக்கப்பட்ட தரவு வெற்றிகரமாக அழிக்கப்பட்டது',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'english' ? 'Error' : 'பிழை',
        description: error.message,
      });
    }
  };

  return (
    <MobileLayout title="Settings">
      <div className="space-y-4">

        {/* Network Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5" />
              {language === 'english' ? 'Network Status' : 'நெட்வொர்க் நிலை'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                  {isOnline 
                    ? (language === 'english' ? 'Online' : 'ஆன்லைன்')
                    : (language === 'english' ? 'Offline' : 'ஆஃப்லைன்')
                  }
                </span>
              </div>
              <Badge variant={isOnline ? 'default' : 'secondary'}>
                {isOnline ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Database Statistics */}
        {dbStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-5 w-5" />
                {language === 'english' ? 'Database Statistics' : 'தரவுத்தள புள்ளிவிவரங்கள்'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Queue Stats */}
              <div>
                <h4 className="text-sm font-medium mb-2">Upload Queue</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{dbStats.pending}</div>
                    <div className="text-blue-700">Pending Upload</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{dbStats.synced}</div>
                    <div className="text-green-700">Upload Synced</div>
                  </div>
                </div>
                {dbStats.failed > 0 && (
                  <div className="text-center p-3 bg-red-50 rounded mt-2">
                    <div className="text-2xl font-bold text-red-600">{dbStats.failed}</div>
                    <div className="text-red-700">Upload Failed</div>
                  </div>
                )}
                
                {/* Show breakdown of pending items by table */}
                {dbStats.pending > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <h5 className="text-xs font-medium mb-2 text-gray-700">Pending Items Breakdown:</h5>
                    <div className="text-xs space-y-1">
                      {dbStats.pendingByTable && Object.entries(dbStats.pendingByTable).map(([table, count]) => (
                        <div key={table} className="flex justify-between">
                          <span className="capitalize">{table.replace('_', ' ')}:</span>
                          <span className="font-medium">{String(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Local Data Counts */}
              {tableCounts && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Local Data</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Customers:</span>
                      <span className="font-medium">{tableCounts.customers}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Items:</span>
                      <span className="font-medium">{tableCounts.items}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Outward Entries:</span>
                      <span className="font-medium">{tableCounts.outward_entries}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Sales:</span>
                      <span className="font-medium">{tableCounts.sales}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Receipts:</span>
                      <span className="font-medium">{tableCounts.receipts}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span>Customer Ledger:</span>
                      <span className="font-medium">{tableCounts.customer_ledger}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sync Actions - hidden in online-only mode */}
        {!ONLINE_ONLY && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cloud className="h-5 w-5" />
                {language === 'english' ? 'Data Synchronization' : 'தரவு ஒத்திசைவு'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleSync}
                disabled={!isOnline || syncing || forceDownloading || resetting}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing 
                  ? (language === 'english' ? 'Syncing...' : 'ஒத்திசைக்கிறது...')
                  : (language === 'english' ? 'Full Sync (Upload + Download)' : 'முழு ஒத்திசைவு (பதிவேற்று + பதிவிறக்கு)')
                }
              </Button>

              <Button 
                onClick={handleForceRedownload}
                disabled={!isOnline || syncing || forceDownloading || resetting}
                variant="secondary"
                className="w-full"
              >
                <Cloud className={`h-4 w-4 mr-2 ${forceDownloading ? 'animate-pulse' : ''}`} />
                {forceDownloading 
                  ? (language === 'english' ? 'Downloading...' : 'பதிவிறக்குகிறது...')
                  : (language === 'english' ? 'Force Re-download' : 'வலுக்கட்டாயமாக மீண்டும் பதிவிறக்கு')
                }
              </Button>
              
              <Button 
                onClick={handleClearData}
                variant="outline"
                disabled={syncing || forceDownloading || resetting}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {language === 'english' ? 'Clear Synced Upload Queue' : 'ஒத்திசைக்கப்பட்ட பதிவேற்ற வரிசையை அழிக்கவும்'}
              </Button>

              <Button 
                onClick={handleResetDatabase}
                variant="destructive"
                disabled={syncing || forceDownloading || resetting}
                className="w-full"
              >
                <HardDrive className={`h-4 w-4 mr-2 ${resetting ? 'animate-pulse' : ''}`} />
                {resetting 
                  ? (language === 'english' ? 'Resetting...' : 'மீட்டமைக்கிறது...')
                  : (language === 'english' ? 'Reset Offline Database' : 'ஆஃப்லைன் தரவுத்தளத்தை மீட்டமைக்கவும்')
                }
              </Button>
            </CardContent>
          </Card>
        )}

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SettingsIcon className="h-5 w-5" />
              {language === 'english' ? 'App Settings' : 'ஆப் அமைப்புகள்'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'english' ? 'Language / மொழி' : 'மொழி / Language'}
              </label>
              <LanguageToggle />
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-5 w-5" />
              {language === 'english' ? 'App Information' : 'ஆப் தகவல்'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">App Name:</span>
                <span>GRM Sales Mobile</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform:</span>
                <span>Mobile PWA</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};

export default MobileSettings;