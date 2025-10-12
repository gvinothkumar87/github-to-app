import { useState, useEffect } from 'react';
import { databaseService } from '../services/database.service';
import { networkService } from '../services/network.service';
import { ONLINE_ONLY } from '../config';
import { supabase } from '@/integrations/supabase/client';

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

      if (ONLINE_ONLY) {
        const result = await supabase
          .from(normalizedTable)
          .select('*')
          .order('created_at', { ascending: false });
        if (result.error) throw result.error;
        setData((result.data || []) as T[]);
      } else {
        const results = await databaseService.findAll(normalizedTable);
        setData(results);
      }
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
      if (ONLINE_ONLY) {
        const result = await supabase
          .from(normalizedTable)
          .insert(item as any)
          .select()
          .single();
        if (result.error) throw result.error;
        await loadData();
        return ((result.data as any)?.id as string) || '';
      } else {
        const id = await databaseService.insert(normalizedTable, {
          ...item,
          sync_status: 'pending'
        });
        await loadData();
        return id;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      throw err;
    }
  };

  const update = async (id: string, item: Partial<T>) => {
    try {
      const normalizedTable = normalizeTableName(table);
      if (ONLINE_ONLY) {
        const result = await supabase
          .from(normalizedTable)
          .update(item as any)
          .eq('id', id);
        if (result.error) throw result.error;
        await loadData();
      } else{
        await databaseService.update(normalizedTable, id, {
          ...item,
          sync_status: 'pending'
        });
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      const normalizedTable = normalizeTableName(table);
      if (ONLINE_ONLY) {
        const result = await supabase
          .from(normalizedTable)
          .delete()
          .eq('id', id);
        if (result.error) throw result.error;
        await loadData();
      } else {
        await databaseService.delete(normalizedTable, id);
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      throw err;
    }
  };

  const findById = async (id: string): Promise<T | null> => {
    try {
      const normalizedTable = normalizeTableName(table);
      if (ONLINE_ONLY) {
        const result = await supabase
          .from(normalizedTable)
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (result.error) throw result.error;
        return (result.data as T) || null;
      } else {
        return await databaseService.findById(normalizedTable, id);
      }
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