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

    return {
      pending: pendingResult.values?.[0]?.count || 0,
      synced: syncedResult.values?.[0]?.count || 0,
      failed: failedResult.values?.[0]?.count || 0,
      totalRecords: totalResult.values?.[0]?.count || 0
    };
  }
}

export const databaseService = new DatabaseService();