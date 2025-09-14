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

  const normalizeTableName = (tableName: string) => {
    // Remove 'offline_' prefix if it exists to avoid double-prefixing
    return tableName.startsWith('offline_') ? tableName.substring(8) : tableName;
  };

  const loadData = async () => {
    // Don't load if services aren't ready
    if (!isReady) {
      console.log(`Services not ready, skipping ${table} data load`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const normalizedTable = normalizeTableName(table);
      const results = await databaseService.findAll(normalizedTable);
      setData(results);
      console.log(`Loaded ${results.length} records from ${normalizedTable}`);
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
      const normalizedTable = normalizeTableName(table);
      
      // Validate and convert data types before insertion
      const validatedItem = validateAndConvertData(item);
      
      const id = await databaseService.insert(normalizedTable, {
        ...validatedItem,
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
      const normalizedTable = normalizeTableName(table);
      
      // Validate and convert data types before update
      const validatedItem = validateAndConvertData(item);
      
      await databaseService.update(normalizedTable, id, {
        ...validatedItem,
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
      const normalizedTable = normalizeTableName(table);
      await databaseService.delete(normalizedTable, id);
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
      const normalizedTable = normalizeTableName(table);
      return await databaseService.findById(normalizedTable, id);
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

  // Refresh data when a global offline data update event is dispatched (e.g., after manual sync)
  useEffect(() => {
    const handler = () => {
      loadData();
    };
    window.addEventListener('offline-data-updated', handler as EventListener);
    return () => {
      window.removeEventListener('offline-data-updated', handler as EventListener);
    };
  }, [isReady]);

  // Load data when services are ready or dependencies change
  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady, ...dependencies]);

  // Data validation and type conversion helper
  function validateAndConvertData(data: any): any {
    if (!data) return data;
    
    const converted = { ...data };
    
    // Convert dates to ISO string format
    if (converted.entry_date && typeof converted.entry_date === 'object') {
      converted.entry_date = converted.entry_date.toISOString().split('T')[0];
    }
    if (converted.sale_date && typeof converted.sale_date === 'object') {
      converted.sale_date = converted.sale_date.toISOString().split('T')[0];
    }
    if (converted.receipt_date && typeof converted.receipt_date === 'object') {
      converted.receipt_date = converted.receipt_date.toISOString().split('T')[0];
    }
    if (converted.note_date && typeof converted.note_date === 'object') {
      converted.note_date = converted.note_date.toISOString().split('T')[0];
    }
    
    // Ensure numeric fields are proper numbers
    const numericFields = ['empty_weight', 'load_weight', 'net_weight', 'quantity', 'rate', 'total_amount', 'amount', 'pin_code'];
    numericFields.forEach(field => {
      if (converted[field] !== undefined && converted[field] !== null) {
        const num = typeof converted[field] === 'string' ? parseFloat(converted[field]) : converted[field];
        if (!isNaN(num)) {
          converted[field] = num;
        }
      }
    });
    
    // Convert boolean fields
    const booleanFields = ['is_active', 'is_completed'];
    booleanFields.forEach(field => {
      if (converted[field] !== undefined && converted[field] !== null) {
        converted[field] = Boolean(converted[field]);
      }
    });
    
    // Ensure pin_code is string for consistency with Supabase schema
    if (converted.pin_code !== undefined && converted.pin_code !== null) {
      converted.pin_code = String(converted.pin_code);
    }
    
    return converted;
  }

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