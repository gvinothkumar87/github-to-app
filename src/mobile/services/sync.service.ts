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
      case 'customer_ledger':
        await this.syncCustomerLedger(operation, data);
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
        // Check for receipt number conflicts and resolve them
        const resolvedData = await this.resolveReceiptNumberConflicts(data);
        
        const { error: insertError } = await table.insert({
          id: resolvedData.id,
          receipt_no: resolvedData.receipt_no, // This will be the new resolved receipt number
          customer_id: resolvedData.customer_id,
          amount: resolvedData.amount,
          receipt_date: resolvedData.receipt_date,
          payment_method: resolvedData.payment_method,
          remarks: resolvedData.remarks,
          created_by: resolvedData.created_by
        });
        if (insertError) throw insertError;
        
        // Update local database with new receipt number if it changed
        if (resolvedData.receipt_no !== data.receipt_no) {
          await this.updateLocalReceiptNumber(data.id, resolvedData.receipt_no);
        }
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
        // Check for serial number conflicts and resolve them
        const resolvedData = await this.resolveSerialNumberConflicts(data);
        
        const { error: insertError } = await table.insert({
          id: resolvedData.id,
          serial_no: resolvedData.serial_no, // This will be the new resolved serial number
          entry_date: resolvedData.entry_date,
          customer_id: resolvedData.customer_id,
          item_id: resolvedData.item_id,
          lorry_no: resolvedData.lorry_no,
          driver_mobile: resolvedData.driver_mobile,
          empty_weight: resolvedData.empty_weight,
          load_weight: resolvedData.load_weight,
          net_weight: resolvedData.net_weight,
          remarks: resolvedData.remarks,
          loading_place: resolvedData.loading_place,
          is_completed: resolvedData.is_completed
        });
        if (insertError) throw insertError;
        
        // Update local database with new serial number if it changed
        if (resolvedData.serial_no !== data.serial_no) {
          await this.updateLocalSerialNumber(data.id, resolvedData.serial_no);
        }
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
        // Check for bill number conflicts and resolve them
        const resolvedData = await this.resolveBillNumberConflicts(data);
        
        const { error: insertError } = await table.insert({
          id: resolvedData.id,
          outward_entry_id: resolvedData.outward_entry_id,
          customer_id: resolvedData.customer_id,
          item_id: resolvedData.item_id,
          quantity: resolvedData.quantity,
          rate: resolvedData.rate,
          total_amount: resolvedData.total_amount,
          bill_serial_no: resolvedData.bill_serial_no, // This will be the new resolved bill number
          sale_date: resolvedData.sale_date,
          created_by: resolvedData.created_by
        });
        if (insertError) throw insertError;
        
        // Update local database with new bill number if it changed
        if (resolvedData.bill_serial_no !== data.bill_serial_no) {
          await this.updateLocalBillNumber(data.id, resolvedData.bill_serial_no);
        }
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

  private async syncCustomerLedger(operation: string, data: any): Promise<void> {
    const table = supabase.from('customer_ledger');

    switch (operation) {
      case 'CREATE':
        const { error: insertError } = await table.insert({
          id: data.id,
          customer_id: data.customer_id,
          transaction_type: data.transaction_type,
          reference_id: data.reference_id,
          debit_amount: data.debit_amount,
          credit_amount: data.credit_amount,
          balance: data.balance,
          transaction_date: data.transaction_date,
          description: data.description
        });
        if (insertError) throw insertError;
        break;

      case 'UPDATE':
        const { error: updateError } = await table
          .update({
            customer_id: data.customer_id,
            transaction_type: data.transaction_type,
            reference_id: data.reference_id,
            debit_amount: data.debit_amount,
            credit_amount: data.credit_amount,
            balance: data.balance,
            transaction_date: data.transaction_date,
            description: data.description
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

    try {
      // Download customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true);

      if (customersError) throw customersError;

      // Download items
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('is_active', true);

      if (itemsError) throw itemsError;

      // Download outward entries (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: outwardEntries, error: outwardError } = await supabase
        .from('outward_entries')
        .select('*')
        .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('entry_date', { ascending: false });

      if (outwardError) throw outwardError;

      // Download sales (last 30 days)
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .gte('sale_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('sale_date', { ascending: false });

      if (salesError) throw salesError;

      // Download receipts (last 30 days)
      const { data: receipts, error: receiptsError } = await supabase
        .from('receipts')
        .select('*')
        .gte('receipt_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('receipt_date', { ascending: false });

      if (receiptsError) throw receiptsError;

      // Download customer ledger (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { data: customerLedger, error: ledgerError } = await supabase
        .from('customer_ledger')
        .select('*')
        .gte('transaction_date', ninetyDaysAgo.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      if (ledgerError) throw ledgerError;

      // Store all data in local database
      const dataToStore = [
        { table: 'customers', data: customers },
        { table: 'items', data: items },
        { table: 'outward_entries', data: outwardEntries },
        { table: 'sales', data: sales },
        { table: 'receipts', data: receipts },
        { table: 'customer_ledger', data: customerLedger }
      ];

      for (const { table, data } of dataToStore) {
        if (data && data.length > 0) {
          await this.storeDownloadedData(table, data);
          console.log(`Stored ${data.length} ${table} records`);
        }
      }

      console.log('Complete data download and storage completed successfully');
    } catch (error) {
      console.error('Failed to download latest data:', error);
      throw error;
    }
  }

  private async storeDownloadedData(table: string, data: any[]): Promise<void> {
    try {
      for (const item of data) {
        const existing = await databaseService.findById(table, item.id);
        
        if (existing) {
          // Update existing record but preserve sync_status for user-modified items
          const updateData = { ...item };
          if (existing.sync_status === 'pending') {
            // Don't overwrite user changes
            continue;
          }
          updateData.sync_status = 'synced';
          
          // Use local update to avoid adding to sync queue
          await databaseService.updateLocal(table, item.id, updateData);
        } else {
          // Insert new record using local method (no sync queue)
          await databaseService.insertLocal(table, {
            ...item,
            sync_status: 'synced'
          });
        }
      }
      
      console.log(`Stored ${data.length} ${table} records in local database`);
    } catch (error) {
      console.error(`Failed to store ${table} data:`, error);
      throw error;
    }
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

  // Conflict resolution methods for serial numbers and bill numbers
  private async resolveSerialNumberConflicts(data: any): Promise<any> {
    try {
      // Check if serial number already exists in Supabase
      const { data: existingEntries, error } = await supabase
        .from('outward_entries')
        .select('serial_no')
        .eq('serial_no', data.serial_no)
        .limit(1);

      if (error) throw error;

      // If serial number already exists, get the next available serial number
      if (existingEntries && existingEntries.length > 0) {
        const { data: maxEntry, error: maxError } = await supabase
          .from('outward_entries')
          .select('serial_no')
          .order('serial_no', { ascending: false })
          .limit(1);

        if (maxError) throw maxError;

        const newSerialNo = maxEntry && maxEntry.length > 0 
          ? (maxEntry[0].serial_no + 1) 
          : 1;

        console.log(`Serial number conflict resolved: ${data.serial_no} → ${newSerialNo}`);
        
        return {
          ...data,
          serial_no: newSerialNo,
          remarks: data.remarks 
            ? `${data.remarks} [Serial auto-updated from ${data.serial_no}]`
            : `[Serial auto-updated from ${data.serial_no}]`
        };
      }

      return data; // No conflict, return as-is
    } catch (error) {
      console.error('Error resolving serial number conflict:', error);
      // Fallback: use timestamp-based serial number
      const fallbackSerial = Date.now() % 1000000; // Use timestamp as fallback
      return {
        ...data,
        serial_no: fallbackSerial,
        remarks: data.remarks 
          ? `${data.remarks} [Serial auto-generated: ${fallbackSerial}]`
          : `[Serial auto-generated: ${fallbackSerial}]`
      };
    }
  }

  private async resolveBillNumberConflicts(data: any): Promise<any> {
    if (!data.bill_serial_no) return data; // No bill number to check

    try {
      // Check if bill number already exists in Supabase
      const { data: existingSales, error } = await supabase
        .from('sales')
        .select('bill_serial_no')
        .eq('bill_serial_no', data.bill_serial_no)
        .limit(1);

      if (error) throw error;

      // If bill number already exists, generate a new one
      if (existingSales && existingSales.length > 0) {
        // Get the highest existing bill number
        const { data: maxSale, error: maxError } = await supabase
          .from('sales')
          .select('bill_serial_no')
          .not('bill_serial_no', 'is', null)
          .order('bill_serial_no', { ascending: false })
          .limit(1);

        if (maxError) throw maxError;

        // Generate new bill number based on pattern
        let newBillNo: string;
        if (maxSale && maxSale.length > 0 && maxSale[0].bill_serial_no) {
          // Extract number from existing bill and increment
          const match = maxSale[0].bill_serial_no.match(/(\d+)$/);
          if (match) {
            const currentNum = parseInt(match[1]);
            const prefix = maxSale[0].bill_serial_no.replace(/\d+$/, '');
            newBillNo = `${prefix}${(currentNum + 1).toString().padStart(match[1].length, '0')}`;
          } else {
            // Fallback if pattern doesn't match
            newBillNo = `BILL-${Date.now()}`;
          }
        } else {
          // No existing bills, create first one
          newBillNo = data.bill_serial_no.includes('-') 
            ? data.bill_serial_no.replace(/\d+$/, '1')
            : 'BILL-1';
        }

        console.log(`Bill number conflict resolved: ${data.bill_serial_no} → ${newBillNo}`);
        
        return {
          ...data,
          bill_serial_no: newBillNo
        };
      }

      return data; // No conflict, return as-is
    } catch (error) {
      console.error('Error resolving bill number conflict:', error);
      // Fallback: use timestamp-based bill number
      const fallbackBill = `BILL-${Date.now()}`;
      return {
        ...data,
        bill_serial_no: fallbackBill
      };
    }
  }

  private async updateLocalSerialNumber(id: string, newSerialNo: number): Promise<void> {
    try {
      await databaseService.update('outward_entries', id, { 
        serial_no: newSerialNo,
        sync_status: 'synced' // Mark as synced since it's now updated with server data
      });
      console.log(`Updated local outward entry ${id} with new serial number: ${newSerialNo}`);
    } catch (error) {
      console.error('Error updating local serial number:', error);
    }
  }

  private async updateLocalBillNumber(id: string, newBillNo: string): Promise<void> {
    try {
      await databaseService.update('sales', id, { 
        bill_serial_no: newBillNo,
        sync_status: 'synced' // Mark as synced since it's now updated with server data
      });
      console.log(`Updated local sale ${id} with new bill number: ${newBillNo}`);
    } catch (error) {
      console.error('Error updating local bill number:', error);
    }
  }

  private async resolveReceiptNumberConflicts(data: any): Promise<any> {
    if (!data.receipt_no) return data; // No receipt number to check

    try {
      // Check if receipt number already exists in Supabase
      const { data: existingReceipts, error } = await supabase
        .from('receipts')
        .select('receipt_no')
        .eq('receipt_no', data.receipt_no)
        .limit(1);

      if (error) throw error;

      // If receipt number already exists, generate a new one
      if (existingReceipts && existingReceipts.length > 0) {
        // Get the highest existing receipt number
        const { data: maxReceipt, error: maxError } = await supabase
          .from('receipts')
          .select('receipt_no')
          .not('receipt_no', 'is', null)
          .order('receipt_no', { ascending: false })
          .limit(1);

        if (maxError) throw maxError;

        // Generate new receipt number based on pattern
        let newReceiptNo: string;
        if (maxReceipt && maxReceipt.length > 0 && maxReceipt[0].receipt_no) {
          // Extract number from existing receipt and increment
          const match = maxReceipt[0].receipt_no.match(/(\d+)$/);
          if (match) {
            const currentNum = parseInt(match[1]);
            const prefix = maxReceipt[0].receipt_no.replace(/\d+$/, '');
            newReceiptNo = `${prefix}${(currentNum + 1).toString().padStart(match[1].length, '0')}`;
          } else {
            // Fallback if pattern doesn't match
            newReceiptNo = `REC-${Date.now()}`;
          }
        } else {
          // No existing receipts, create first one
          newReceiptNo = data.receipt_no.includes('-') 
            ? data.receipt_no.replace(/\d+$/, '1')
            : 'REC-1';
        }

        console.log(`Receipt number conflict resolved: ${data.receipt_no} → ${newReceiptNo}`);
        
        return {
          ...data,
          receipt_no: newReceiptNo
        };
      }

      return data; // No conflict, return as-is
    } catch (error) {
      console.error('Error resolving receipt number conflict:', error);
      // Fallback: use timestamp-based receipt number
      const fallbackReceipt = `REC-${Date.now()}`;
      return {
        ...data,
        receipt_no: fallbackReceipt
      };
    }
  }

  private async updateLocalReceiptNumber(id: string, newReceiptNo: string): Promise<void> {
    try {
      await databaseService.update('receipts', id, { 
        receipt_no: newReceiptNo,
        sync_status: 'synced' // Mark as synced since it's now updated with server data
      });
      console.log(`Updated local receipt ${id} with new receipt number: ${newReceiptNo}`);
    } catch (error) {
      console.error('Error updating local receipt number:', error);
    }
  }
}

export const syncService = new SyncService();