import { supabase } from '@/integrations/supabase/client';
import { databaseService, OfflineRecord } from './database.service';
import { networkService } from './network.service';

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
  currentItem?: string;
}

export class SyncService {
  private isSyncing = false;
  private syncListeners: ((progress: SyncProgress) => void)[] = [];
  private autoSyncEnabled = true;

  async initialize(): Promise<void> {
    // Listen for network changes and auto-sync when online
    networkService.onStatusChange((status) => {
      if (status.connected && this.autoSyncEnabled && !this.isSyncing) {
        this.startSync();
      }
    });

    console.log('Sync service initialized');
  }

  async startSync(): Promise<SyncProgress> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return this.getCurrentProgress();
    }

    if (!networkService.isOnline()) {
      console.log('Cannot sync: offline');
      throw new Error('Cannot sync while offline');
    }

    this.isSyncing = true;
    const pendingItems = await databaseService.getPendingSyncItems();
    
    const progress: SyncProgress = {
      total: pendingItems.length,
      completed: 0,
      failed: 0,
      inProgress: true
    };

    this.notifyListeners(progress);

    console.log(`Starting sync of ${pendingItems.length} items`);

    for (const item of pendingItems) {
      try {
        progress.currentItem = `${item.operation} ${item.table_name}`;
        this.notifyListeners(progress);

        await this.syncItem(item);
        await databaseService.markSyncCompleted(item.id);
        progress.completed++;
        
        console.log(`Synced: ${item.operation} ${item.table_name} (${item.data.id})`);
      } catch (error) {
        console.error(`Sync failed for ${item.operation} ${item.table_name}:`, error);
        await databaseService.markSyncFailed(item.id);
        progress.failed++;
      }

      this.notifyListeners(progress);
    }

    // Clean up synced items
    await databaseService.clearSyncedItems();

    progress.inProgress = false;
    progress.currentItem = undefined;
    this.isSyncing = false;

    this.notifyListeners(progress);
    console.log(`Sync completed: ${progress.completed} successful, ${progress.failed} failed`);

    return progress;
  }

  private async syncItem(item: OfflineRecord): Promise<void> {
    const { table_name, operation, data } = item;

    switch (table_name) {
      case 'customers':
        await this.syncCustomer(operation, data);
        break;
      case 'items':
        await this.syncItems(operation, data);
        break;
      case 'outward_entries':
        await this.syncOutwardEntry(operation, data);
        break;
      case 'receipts':
        await this.syncReceipt(operation, data);
        break;
      case 'sales':
        await this.syncSale(operation, data);
        break;
      default:
        throw new Error(`Unknown table: ${table_name}`);
    }
  }

  private async syncCustomer(operation: string, data: any): Promise<void> {
    const table = supabase.from('customers');

    switch (operation) {
      case 'CREATE':
        const { error: insertError } = await table.insert({
          id: data.id,
          name_english: data.name_english,
          name_tamil: data.name_tamil,
          code: data.code,
          contact_person: data.contact_person,
          phone: data.phone,
          email: data.email,
          address_english: data.address_english,
          address_tamil: data.address_tamil,
          gstin: data.gstin,
          pin_code: data.pin_code,
          state_code: data.state_code,
          place_of_supply: data.place_of_supply,
          is_active: data.is_active
        });
        if (insertError) throw insertError;
        break;

      case 'UPDATE':
        const { error: updateError } = await table
          .update({
            name_english: data.name_english,
            name_tamil: data.name_tamil,
            code: data.code,
            contact_person: data.contact_person,
            phone: data.phone,
            email: data.email,
            address_english: data.address_english,
            address_tamil: data.address_tamil,
            gstin: data.gstin,
            pin_code: data.pin_code,
            state_code: data.state_code,
            place_of_supply: data.place_of_supply,
            is_active: data.is_active
          })
          .eq('id', data.id);
        if (updateError) throw updateError;
        break;

      case 'DELETE':
        const { error: deleteError } = await table.delete().eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async syncItems(operation: string, data: any): Promise<void> {
    const table = supabase.from('items');

    switch (operation) {
      case 'CREATE':
        const { error: insertError } = await table.insert({
          id: data.id,
          name_english: data.name_english,
          name_tamil: data.name_tamil,
          code: data.code,
          unit: data.unit,
          hsn_no: data.hsn_no,
          gst_percentage: data.gst_percentage,
          description_english: data.description_english,
          description_tamil: data.description_tamil,
          is_active: data.is_active
        });
        if (insertError) throw insertError;
        break;

      case 'UPDATE':
        const { error: updateError } = await table
          .update({
            name_english: data.name_english,
            name_tamil: data.name_tamil,
            code: data.code,
            unit: data.unit,
            hsn_no: data.hsn_no,
            gst_percentage: data.gst_percentage,
            description_english: data.description_english,
            description_tamil: data.description_tamil,
            is_active: data.is_active
          })
          .eq('id', data.id);
        if (updateError) throw updateError;
        break;

      case 'DELETE':
        const { error: deleteError } = await table.delete().eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async syncReceipt(operation: string, data: any): Promise<void> {
    const table = supabase.from('receipts');

    switch (operation) {
      case 'CREATE':
        const { error: insertError } = await table.insert({
          id: data.id,
          receipt_no: data.receipt_no,
          customer_id: data.customer_id,
          amount: data.amount,
          receipt_date: data.receipt_date,
          payment_method: data.payment_method,
          remarks: data.remarks,
          created_by: data.created_by
        });
        if (insertError) throw insertError;
        break;

      case 'UPDATE':
        const { error: updateError } = await table
          .update({
            receipt_no: data.receipt_no,
            customer_id: data.customer_id,
            amount: data.amount,
            receipt_date: data.receipt_date,
            payment_method: data.payment_method,
            remarks: data.remarks
          })
          .eq('id', data.id);
        if (updateError) throw updateError;
        break;

      case 'DELETE':
        const { error: deleteError } = await table.delete().eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async syncOutwardEntry(operation: string, data: any): Promise<void> {
    const table = supabase.from('outward_entries');

    switch (operation) {
      case 'CREATE':
        const { error: insertError } = await table.insert({
          id: data.id,
          entry_date: data.entry_date,
          customer_id: data.customer_id,
          item_id: data.item_id,
          lorry_no: data.lorry_no,
          driver_mobile: data.driver_mobile,
          empty_weight: data.empty_weight,
          load_weight: data.load_weight,
          net_weight: data.net_weight,
          remarks: data.remarks,
          loading_place: data.loading_place,
          is_completed: data.is_completed
        });
        if (insertError) throw insertError;
        break;

      case 'UPDATE':
        const { error: updateError } = await table
          .update({
            entry_date: data.entry_date,
            customer_id: data.customer_id,
            item_id: data.item_id,
            lorry_no: data.lorry_no,
            driver_mobile: data.driver_mobile,
            empty_weight: data.empty_weight,
            load_weight: data.load_weight,
            net_weight: data.net_weight,
            remarks: data.remarks,
            loading_place: data.loading_place,
            is_completed: data.is_completed
          })
          .eq('id', data.id);
        if (updateError) throw updateError;
        break;

      case 'DELETE':
        const { error: deleteError } = await table.delete().eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async syncSale(operation: string, data: any): Promise<void> {
    const table = supabase.from('sales');

    switch (operation) {
      case 'CREATE':
        const { error: insertError } = await table.insert({
          id: data.id,
          outward_entry_id: data.outward_entry_id,
          customer_id: data.customer_id,
          item_id: data.item_id,
          quantity: data.quantity,
          rate: data.rate,
          total_amount: data.total_amount,
          bill_serial_no: data.bill_serial_no,
          sale_date: data.sale_date,
          created_by: data.created_by
        });
        if (insertError) throw insertError;
        break;

      case 'UPDATE':
        const { error: updateError } = await table
          .update({
            quantity: data.quantity,
            rate: data.rate,
            total_amount: data.total_amount,
            bill_serial_no: data.bill_serial_no,
            sale_date: data.sale_date
          })
          .eq('id', data.id);
        if (updateError) throw updateError;
        break;

      case 'DELETE':
        const { error: deleteError } = await table.delete().eq('id', data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  // Download latest data from server when online
  async downloadLatestData(): Promise<void> {
    if (!networkService.isOnline()) {
      throw new Error('Cannot download data while offline');
    }

    console.log('Downloading latest data from server...');

    // Download customers
    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true);

    // Download items
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true);

    // Store in local database (implementation depends on your needs)
    // For now, we'll just log
    console.log(`Downloaded ${customers?.length || 0} customers and ${items?.length || 0} items`);
  }

  onSyncProgress(callback: (progress: SyncProgress) => void): () => void {
    this.syncListeners.push(callback);
    
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(progress: SyncProgress): void {
    this.syncListeners.forEach(listener => listener(progress));
  }

  private getCurrentProgress(): SyncProgress {
    return {
      total: 0,
      completed: 0,
      failed: 0,
      inProgress: this.isSyncing
    };
  }

  setAutoSync(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
  }

  isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled;
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  async getSyncStats() {
    return await databaseService.getStats();
  }
}

export const syncService = new SyncService();