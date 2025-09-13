import { useState, useEffect } from 'react';
import { databaseService } from '../services/database.service';
import { networkService } from '../services/network.service';
import { syncService } from '../services/sync.service';
import { useMobileServices } from '../providers/MobileServiceProvider';

interface OfflineDataOptions {
  autoSync?: boolean;
  fallbackData?: any[];
}

export function useEnhancedOfflineData<T>(
  table: string,
  dependencies: any[] = [],
  options: OfflineDataOptions = {}
) {
  const { isReady } = useMobileServices();
  const [data, setData] = useState<T[]>(options.fallbackData || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(networkService.isOnline());

  const loadData = async () => {
    // Don't load if services aren't ready
    if (!isReady) {
      console.log(`Services not ready, skipping ${table} data load`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const results = await databaseService.findAll(table);
      setData(results);
      console.log(`Loaded ${results.length} records from ${table}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error(`Error loading ${table} data:`, err);
      
      // Use fallback data if available
      if (options.fallbackData) {
        console.log(`Using fallback data for ${table}`);
        setData(options.fallbackData);
      }
    } finally {
      setLoading(false);
    }
  };

  const create = async (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isReady) {
      throw new Error('Services not ready');
    }

    try {
      const id = await databaseService.insert(table, {
        ...item,
        sync_status: 'pending'
      });
      
      await loadData(); // Refresh data
      
      // Auto-sync if online and enabled
      if (options.autoSync && networkService.isOnline() && !syncService.isSyncInProgress()) {
        syncService.startSync().catch(syncError => {
          console.warn('Auto-sync failed:', syncError);
        });
      }
      
      return id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Create failed';
      setError(errorMessage);
      throw err;
    }
  };

  const update = async (id: string, item: Partial<T>) => {
    if (!isReady) {
      throw new Error('Services not ready');
    }

    try {
      await databaseService.update(table, id, {
        ...item,
        sync_status: 'pending'
      });
      
      await loadData(); // Refresh data
      
      // Auto-sync if online and enabled
      if (options.autoSync && networkService.isOnline() && !syncService.isSyncInProgress()) {
        syncService.startSync().catch(syncError => {
          console.warn('Auto-sync failed:', syncError);
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed';
      setError(errorMessage);
      throw err;
    }
  };

  const remove = async (id: string) => {
    if (!isReady) {
      throw new Error('Services not ready');
    }

    try {
      await databaseService.delete(table, id);
      await loadData(); // Refresh data
      
      // Auto-sync if online and enabled
      if (options.autoSync && networkService.isOnline() && !syncService.isSyncInProgress()) {
        syncService.startSync().catch(syncError => {
          console.warn('Auto-sync failed:', syncError);
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      throw err;
    }
  };

  const findById = async (id: string): Promise<T | null> => {
    if (!isReady) {
      console.warn('Services not ready, cannot find by ID');
      return null;
    }

    try {
      return await databaseService.findById(table, id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Find failed';
      setError(errorMessage);
      return null;
    }
  };

  // Listen for network status changes
  useEffect(() => {
    const unsubscribe = networkService.onStatusChange((status) => {
      setIsOnline(status.connected);
    });

    return unsubscribe;
  }, []);

  // Load data when services are ready or dependencies change
  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady, ...dependencies]);

  return {
    data,
    loading: loading || !isReady,
    error,
    create,
    update,
    remove,
    findById,
    refresh: loadData,
    isOnline,
    isServicesReady: isReady
  };
}