// Simple localStorage-based database that mimics PouchDB API
// This is a fallback for when PouchDB has issues in the browser

export interface LocalStoragePouchDB {
  allDocs(options?: { include_docs?: boolean; startkey?: string; endkey?: string }): Promise<{ rows: Array<{ doc: any }> }>;
  get(id: string): Promise<any>;
  put(doc: any): Promise<any>;
  remove(doc: any): Promise<any>;
  changes(options: { since?: string; live?: boolean; include_docs?: boolean; filter?: (doc: any) => boolean }): {
    on: (event: string, callback: () => void) => void;
    cancel: () => void;
  };
  close(): Promise<void>;
}

class LocalStorageDatabase implements LocalStoragePouchDB {
  private dbName: string;
  private storageKey: string;

  constructor(name: string) {
    this.dbName = name;
    this.storageKey = `pouchdb_${name}`;
  }

  async allDocs(options: { include_docs?: boolean; startkey?: string; endkey?: string } = {}) {
    const data = this.getStoredData();
    let filteredData = data;

    if (options.startkey && options.endkey) {
      filteredData = data.filter((item: any) => 
        item._id >= options.startkey && item._id <= options.endkey
      );
    }

    const rows = filteredData.map((doc: any) => ({ doc }));
    return { rows };
  }

  async get(id: string) {
    const data = this.getStoredData();
    const doc = data.find((item: any) => item._id === id);
    if (!doc) {
      throw new Error('Document not found');
    }
    return doc;
  }

  async put(doc: any) {
    const data = this.getStoredData();
    const existingIndex = data.findIndex((item: any) => item._id === doc._id);
    
    if (existingIndex >= 0) {
      // Update existing document
      data[existingIndex] = { ...doc, _rev: this.generateRev() };
    } else {
      // Add new document
      data.push({ ...doc, _rev: this.generateRev() });
    }
    
    this.setStoredData(data);
    return { ok: true, id: doc._id, rev: data.find((item: any) => item._id === doc._id)?._rev };
  }

  async remove(doc: any) {
    const data = this.getStoredData();
    const filteredData = data.filter((item: any) => item._id !== doc._id);
    this.setStoredData(filteredData);
    return { ok: true, id: doc._id };
  }

  changes(options: { since?: string; live?: boolean; include_docs?: boolean; filter?: (doc: any) => boolean } = {}) {
    // Simple mock implementation - in a real app you'd want proper change detection
    const changesObject = {
      on: (event: string, callback: () => void) => {
        // Mock implementation - in a real app you'd want proper change detection
        console.log(`Mock changes listener for ${this.dbName}`);
        return changesObject; // Return the same object to allow chaining
      },
      cancel: () => {
        console.log(`Mock changes listener cancelled for ${this.dbName}`);
      }
    };
    return changesObject;
  }

  async close() {
    // No-op for localStorage
  }

  private getStoredData(): any[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private setStoredData(data: any[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private generateRev(): string {
    return `1-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface SimpleVaxCareDatabase {
  patients: LocalStoragePouchDB;
  immunizations: LocalStoragePouchDB;
  practitioners: LocalStoragePouchDB;
  organizations: LocalStoragePouchDB;
  encounters: LocalStoragePouchDB;
  medications: LocalStoragePouchDB;
  medicationAdministrations: LocalStoragePouchDB;
}

let db: SimpleVaxCareDatabase | null = null;

export const initDatabase = async (): Promise<SimpleVaxCareDatabase> => {
  if (db) {
    return db;
  }

  try {
    console.log('Initializing LocalStorage-based database...');

    db = {
      patients: new LocalStorageDatabase('vaxcare_patients'),
      immunizations: new LocalStorageDatabase('vaxcare_immunizations'),
      practitioners: new LocalStorageDatabase('vaxcare_practitioners'),
      organizations: new LocalStorageDatabase('vaxcare_organizations'),
      encounters: new LocalStorageDatabase('vaxcare_encounters'),
      medications: new LocalStorageDatabase('vaxcare_medications'),
      medicationAdministrations: new LocalStorageDatabase('vaxcare_medicationAdministrations'),
    };

    console.log('LocalStorage-based database initialized successfully');

    // Check if migration is needed and perform it
    const { isMigrationNeeded, migrateFromLocalStorage } = await import('./simple-migration');
    if (isMigrationNeeded()) {
      console.log('🔄 Migration needed, starting data migration...');
      await migrateFromLocalStorage(db);
    }

    return db;
  } catch (error) {
    console.error('Failed to initialize LocalStorage-based database:', error);
    throw error;
  }
};

export const getDatabase = (): SimpleVaxCareDatabase | null => {
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await Promise.all(Object.values(db).map(collection => collection.close()));
    db = null;
  }
};
