import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export interface OfflineRecord {
  id: string;
  table_name: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'grm_sales_offline.db';
  private readonly DB_VERSION = 1;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initialize(): Promise<void> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        await this.sqlite.initWebStore();
      }

      // Create connection
      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        this.DB_VERSION,
        false
      );

      await this.db.open();
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Sync queue table
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Offline customers table
      `CREATE TABLE IF NOT EXISTS offline_customers (
        id TEXT PRIMARY KEY,
        name_english TEXT NOT NULL,
        name_tamil TEXT,
        code TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address_english TEXT,
        address_tamil TEXT,
        gstin TEXT,
        pin_code TEXT,
        state_code TEXT DEFAULT '33',
        place_of_supply TEXT DEFAULT '33',
        is_active BOOLEAN DEFAULT true,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Offline items table
      `CREATE TABLE IF NOT EXISTS offline_items (
        id TEXT PRIMARY KEY,
        name_english TEXT NOT NULL,
        name_tamil TEXT,
        code TEXT NOT NULL,
        unit TEXT DEFAULT 'KG',
        unit_weight REAL DEFAULT 1,
        hsn_no TEXT,
        gst_percentage REAL DEFAULT 0.00,
        description_english TEXT,
        description_tamil TEXT,
        is_active BOOLEAN DEFAULT true,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Offline outward entries table
      `CREATE TABLE IF NOT EXISTS offline_outward_entries (
        id TEXT PRIMARY KEY,
        serial_no INTEGER,
        entry_date TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        lorry_no TEXT NOT NULL,
        driver_mobile TEXT NOT NULL,
        empty_weight REAL NOT NULL,
        load_weight REAL,
        net_weight REAL,
        load_weight_updated_at TEXT,
        load_weight_updated_by TEXT,
        remarks TEXT,
        loading_place TEXT DEFAULT 'PULIVANTHI',
        is_completed BOOLEAN DEFAULT false,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Offline receipts table
      `CREATE TABLE IF NOT EXISTS offline_receipts (
        id TEXT PRIMARY KEY,
        receipt_no TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        amount REAL NOT NULL,
        receipt_date TEXT NOT NULL,
        payment_method TEXT DEFAULT 'Cash',
        remarks TEXT,
        created_by TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Offline sales table
      `CREATE TABLE IF NOT EXISTS offline_sales (
        id TEXT PRIMARY KEY,
        outward_entry_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        quantity REAL NOT NULL,
        rate REAL NOT NULL,
        total_amount REAL NOT NULL,
        bill_serial_no TEXT,
        sale_date TEXT NOT NULL,
        created_by TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      // Offline customer ledger table
      `CREATE TABLE IF NOT EXISTS offline_customer_ledger (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        reference_id TEXT NOT NULL,
        debit_amount REAL DEFAULT 0,
        credit_amount REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        transaction_date TEXT NOT NULL,
        description TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const tableSQL of tables) {
      await this.db.execute(tableSQL);
    }

    // Create indexes for better query performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_customers_active ON offline_customers(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_items_active ON offline_items(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_outward_entries_date ON offline_outward_entries(entry_date)',
      'CREATE INDEX IF NOT EXISTS idx_sales_date ON offline_sales(sale_date)',
      'CREATE INDEX IF NOT EXISTS idx_receipts_date ON offline_receipts(receipt_date)',
      'CREATE INDEX IF NOT EXISTS idx_customer_ledger_customer ON offline_customer_ledger(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(sync_status)'
    ];

    for (const indexSQL of indexes) {
      await this.db.execute(indexSQL);
    }

    // Create missing tables for credit_notes, debit_notes, company_settings
    await this.createMissingTables();

    // Ensure schema migrations for existing installs
    await this.ensureAllTablesMigration();

  }

  // Create missing tables that exist in Supabase but not in mobile DB
  private async createMissingTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Create credit_notes table
      const creditNotesSQL = `
        CREATE TABLE IF NOT EXISTS offline_credit_notes (
          id TEXT PRIMARY KEY,
          note_no TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          reference_bill_no TEXT,
          amount REAL NOT NULL,
          reason TEXT NOT NULL,
          note_date TEXT NOT NULL,
          created_by TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          sync_status TEXT DEFAULT 'pending'
        )
      `;
      await this.db.execute(creditNotesSQL);

      // Create debit_notes table
      const debitNotesSQL = `
        CREATE TABLE IF NOT EXISTS offline_debit_notes (
          id TEXT PRIMARY KEY,
          note_no TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          reference_bill_no TEXT,
          amount REAL NOT NULL,
          reason TEXT NOT NULL,
          note_date TEXT NOT NULL,
          created_by TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          sync_status TEXT DEFAULT 'pending'
        )
      `;
      await this.db.execute(debitNotesSQL);

      // Create company_settings table
      const companySettingsSQL = `
        CREATE TABLE IF NOT EXISTS offline_company_settings (
          id TEXT PRIMARY KEY,
          company_name TEXT NOT NULL,
          gstin TEXT NOT NULL,
          address_line1 TEXT NOT NULL,
          address_line2 TEXT,
          locality TEXT NOT NULL,
          location_name TEXT NOT NULL,
          location_code TEXT NOT NULL,
          pin_code TEXT NOT NULL,
          state_code TEXT NOT NULL DEFAULT '33',
          phone TEXT,
          email TEXT,
          bank_name TEXT,
          bank_branch TEXT,
          bank_account_no TEXT,
          bank_ifsc TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          sync_status TEXT DEFAULT 'pending'
        )
      `;
      await this.db.execute(companySettingsSQL);

      console.log('Missing tables created successfully');
    } catch (error) {
      console.error('Error creating missing tables:', error);
    }
  }

  // Enhanced schema migration system
  private async ensureAllTablesMigration(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      // Migrate outward_entries table
      await this.ensureOutwardEntryColumns();
      
      // Migrate other tables if needed in the future
      await this.ensureCustomerColumns();
      await this.ensureItemColumns();
      await this.ensureReceiptColumns();
      await this.ensureSalesColumns();
      
      console.log('Schema migrations completed successfully');
    } catch (error) {
      console.error('Schema migration failed:', error);
    }
  }

  // Schema migration for outward_entries
  private async ensureOutwardEntryColumns(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const res = await this.db.query(`PRAGMA table_info(offline_outward_entries)`);
      const cols = (res.values || []).map((r: any) => r.name);
      
      if (!cols.includes('load_weight_updated_at')) {
        await this.db.execute(`ALTER TABLE offline_outward_entries ADD COLUMN load_weight_updated_at TEXT`);
        console.log('Added load_weight_updated_at column to outward_entries');
      }
      if (!cols.includes('load_weight_updated_by')) {
        await this.db.execute(`ALTER TABLE offline_outward_entries ADD COLUMN load_weight_updated_by TEXT`);
        console.log('Added load_weight_updated_by column to outward_entries');
      }
    } catch (e) {
      console.warn('ensureOutwardEntryColumns failed:', e);
    }
  }

  // Schema migration for customers (for future extensions)
  private async ensureCustomerColumns(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const res = await this.db.query(`PRAGMA table_info(offline_customers)`);
      const cols = (res.values || []).map((r: any) => r.name);
      
      // Add any missing columns for customers if needed in future
      // Currently customers table is complete
    } catch (e) {
      console.warn('ensureCustomerColumns failed:', e);
    }
  }

  // Schema migration for items (for future extensions)
  private async ensureItemColumns(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const res = await this.db.query(`PRAGMA table_info(offline_items)`);
      const cols = (res.values || []).map((r: any) => r.name);

      if (!cols.includes('unit_weight')) {
        await this.db.execute(`ALTER TABLE offline_items ADD COLUMN unit_weight REAL DEFAULT 1`);
        await this.db.execute(`UPDATE offline_items SET unit_weight = 1 WHERE unit_weight IS NULL`);
        console.log('Added unit_weight column to offline_items');
      }
    } catch (e) {
      console.warn('ensureItemColumns failed:', e);
    }
  }

  // Schema migration for receipts (for future extensions)
  private async ensureReceiptColumns(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const res = await this.db.query(`PRAGMA table_info(offline_receipts)`);
      const cols = (res.values || []).map((r: any) => r.name);
      
      // Add any missing columns for receipts if needed in future
      // Currently receipts table is complete
    } catch (e) {
      console.warn('ensureReceiptColumns failed:', e);
    }
  }

  // Schema migration for sales (for future extensions)
  private async ensureSalesColumns(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    try {
      const res = await this.db.query(`PRAGMA table_info(offline_sales)`);
      const cols = (res.values || []).map((r: any) => r.name);
      
      // Add any missing columns for sales if needed in future
      // Currently sales table is complete
    } catch (e) {
      console.warn('ensureSalesColumns failed:', e);
    }
  }

  // Generic CRUD operations
  async insert(table: string, data: any): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = data.id || this.generateUUID();
    // Exclude 'id' from columns/values to avoid duplicate column in INSERT
    const entries = Object.entries(data).filter(([key]) => key !== 'id');
    const columns = entries.map(([key]) => key).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map(([, value]) => value);

    const sql = `INSERT INTO offline_${table} (id${columns ? ', ' + columns : ''}) VALUES (?${placeholders ? ', ' + placeholders : ''})`;
    await this.db.run(sql, [id, ...values]);

    // Add to sync queue
    await this.addToSyncQueue(table, 'CREATE', { id, ...data });

    return id;
  }

  // Local insert without sync queue (for downloaded data)
  async insertLocal(table: string, data: any): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = data.id || this.generateUUID();
    // Exclude 'id' from columns/values to avoid duplicate column in INSERT
    const entries = Object.entries(data).filter(([key]) => key !== 'id');
    const columns = entries.map(([key]) => key).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    const values = entries.map(([, value]) => value);

    const sql = `INSERT OR REPLACE INTO offline_${table} (id${columns ? ', ' + columns : ''}) VALUES (?${placeholders ? ', ' + placeholders : ''})`;
    await this.db.run(sql, [id, ...values]);

    return id;
  }

  async update(table: string, id: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);

    const sql = `UPDATE offline_${table} SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.db.run(sql, [...values, id]);

    // Add to sync queue
    await this.addToSyncQueue(table, 'UPDATE', { id, ...data });
  }

  // Local update without sync queue (for downloaded data)
  async updateLocal(table: string, id: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);

    const sql = `UPDATE offline_${table} SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.db.run(sql, [...values, id]);
  }

  async delete(table: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sql = `DELETE FROM offline_${table} WHERE id = ?`;
    await this.db.run(sql, [id]);

    // Add to sync queue
    await this.addToSyncQueue(table, 'DELETE', { id });
  }

  async findAll(table: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query(`SELECT * FROM offline_${table} ORDER BY created_at DESC`);
    return result.values || [];
  }

  async findById(table: string, id: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query(`SELECT * FROM offline_${table} WHERE id = ?`, [id]);
    return result.values?.[0] || null;
  }

  // Sync queue operations
  private async addToSyncQueue(table: string, operation: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateUUID();
    const sql = `INSERT INTO sync_queue (id, table_name, operation, data) VALUES (?, ?, ?, ?)`;
    await this.db.run(sql, [id, table, operation, JSON.stringify(data)]);
  }

  async getPendingSyncItems(): Promise<OfflineRecord[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query(
      `SELECT * FROM sync_queue WHERE sync_status = 'pending' ORDER BY created_at ASC`
    );
    
    return (result.values || []).map(item => ({
      ...item,
      data: JSON.parse(item.data)
    }));
  }

  async markSyncCompleted(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(
      `UPDATE sync_queue SET sync_status = 'synced', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
  }

  async markSyncFailed(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(
      `UPDATE sync_queue SET sync_status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
  }

  async clearSyncedItems(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(`DELETE FROM sync_queue WHERE sync_status = 'synced'`);
  }

  // Utility methods
  private generateUUID(): string {
    return 'offline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Replace a local record ID with the server UUID
  async replaceLocalId(table: string, oldId: string, newId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const sql = `UPDATE offline_${table} SET id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.db.run(sql, [newId, oldId]);
  }

  // Update references in offline_sales for outward_entry_id remapping
  async updateSalesOutwardEntryId(oldId: string, newId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const sql = `UPDATE offline_sales SET outward_entry_id = ?, updated_at = CURRENT_TIMESTAMP WHERE outward_entry_id = ?`;
    await this.db.run(sql, [newId, oldId]);
  }

  // Remap IDs inside pending sync queue JSON payloads
  async remapIdsInSyncQueue(oldId: string, newId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const res = await this.db.query(`SELECT id, data FROM sync_queue WHERE sync_status = 'pending'`);
    const items = res.values || [];
    for (const row of items) {
      try {
        const data = JSON.parse(row.data);
        let changed = false;
        if (data && typeof data === 'object') {
          if (data.id === oldId) { data.id = newId; changed = true; }
          if (data.outward_entry_id === oldId) { data.outward_entry_id = newId; changed = true; }
          // Common nested references can be added here if needed
        }
        if (changed) {
          await this.db.run(`UPDATE sync_queue SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [JSON.stringify(data), row.id]);
        }
      } catch (e) {
        console.warn('Failed to remap sync_queue item', row.id, e);
      }
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  async getStats(): Promise<{
    pending: number;
    synced: number;
    failed: number;
    totalRecords: number;
    pendingByTable?: Record<string, number>;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const pendingResult = await this.db.query(
      `SELECT COUNT(*) as count FROM sync_queue WHERE sync_status = 'pending'`
    );
    const syncedResult = await this.db.query(
      `SELECT COUNT(*) as count FROM sync_queue WHERE sync_status = 'synced'`
    );
    const failedResult = await this.db.query(
      `SELECT COUNT(*) as count FROM sync_queue WHERE sync_status = 'failed'`
    );
    const totalResult = await this.db.query(`SELECT COUNT(*) as count FROM sync_queue`);

    // Get pending count by table
    const pendingByTableResult = await this.db.query(
      `SELECT table_name, COUNT(*) as count FROM sync_queue WHERE sync_status = 'pending' GROUP BY table_name`
    );
    
    const pendingByTable: Record<string, number> = {};
    if (pendingByTableResult.values) {
      for (const row of pendingByTableResult.values) {
        pendingByTable[row.table_name] = row.count;
      }
    }

    return {
      pending: pendingResult.values?.[0]?.count || 0,
      synced: syncedResult.values?.[0]?.count || 0,
      failed: failedResult.values?.[0]?.count || 0,
      totalRecords: totalResult.values?.[0]?.count || 0,
      pendingByTable: Object.keys(pendingByTable).length > 0 ? pendingByTable : undefined
    };
  }

  async getTableCounts(): Promise<{
    customers: number;
    items: number;
    outward_entries: number;
    sales: number;
    receipts: number;
    customer_ledger: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = ['customers', 'items', 'outward_entries', 'sales', 'receipts', 'customer_ledger', 'credit_notes', 'debit_notes', 'company_settings'];
    const counts: any = {};

    for (const table of tables) {
      try {
        const result = await this.db.query(`SELECT COUNT(*) as count FROM offline_${table}`);
        counts[table] = result.values?.[0]?.count || 0;
      } catch (error) {
        console.warn(`Error counting ${table}:`, error);
        counts[table] = 0;
      }
    }

    return counts;
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Drop all tables and recreate
    const tables = [
      'sync_queue',
      'offline_customers', 
      'offline_items', 
      'offline_outward_entries', 
      'offline_receipts', 
      'offline_sales', 
      'offline_customer_ledger',
      'offline_credit_notes',
      'offline_debit_notes',
      'offline_company_settings'
    ];

    for (const table of tables) {
      try {
        await this.db.run(`DROP TABLE IF EXISTS ${table}`);
      } catch (error) {
        console.warn(`Error dropping table ${table}:`, error);
      }
    }

    // Recreate tables
    await this.createTables();
  }
}

export const databaseService = new DatabaseService();