import { useState, useEffect } from 'react';
import { databaseService } from '../services/database.service';
import { networkService } from '../services/network.service';

export function useOfflineData<T>(
  table: string,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeTableName = (tableName: string) => {
    // Remove 'offline_' prefix if it exists to avoid double-prefixing
    return tableName.startsWith('offline_') ? tableName.substring(8) : tableName;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const normalizedTable = normalizeTableName(table);
      const results = await databaseService.findAll(normalizedTable);
      setData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error(`Error loading ${table} data:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, dependencies);

  const create = async (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const normalizedTable = normalizeTableName(table);
      const id = await databaseService.insert(normalizedTable, {
        ...item,
        sync_status: 'pending'
      });
      await loadData(); // Refresh data
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      throw err;
    }
  };

  const update = async (id: string, item: Partial<T>) => {
    try {
      const normalizedTable = normalizeTableName(table);
      await databaseService.update(normalizedTable, id, {
        ...item,
        sync_status: 'pending'
      });
      await loadData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      const normalizedTable = normalizeTableName(table);
      await databaseService.delete(normalizedTable, id);
      await loadData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      throw err;
    }
  };

  const findById = async (id: string): Promise<T | null> => {
    try {
      const normalizedTable = normalizeTableName(table);
      return await databaseService.findById(normalizedTable, id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Find failed');
      return null;
    }
  };

  return {
    data,
    loading,
    error,
    create,
    update,
    remove,
    findById,
    refresh: loadData,
    isOnline: networkService.isOnline()
  };
}