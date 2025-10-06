// Simple localStorage-based database for development
// This will be replaced with proper RxDB + IndexedDB later

export interface VaxCareDatabase {
  patients: any;
  immunizations: any;
  practitioners: any;
  organizations: any;
  encounters: any;
  medications: any;
  medicationAdministrations: any;
}

let db: VaxCareDatabase | null = null;

// Simple localStorage-based storage
class LocalStorageDB {
  private storageKey: string;

  constructor(collectionName: string) {
    this.storageKey = `vaxcare_${collectionName}`;
  }

  find() {
    const data = this.getData();
    return {
      exec: () => Promise.resolve(data),
      $: {
        subscribe: (callback: any) => {
          callback(data);
          return { unsubscribe: () => {} };
        }
      }
    };
  }

  findOne(id: string) {
    const data = this.getData();
    const item = data.find((item: any) => item.id === id);
    return {
      exec: () => Promise.resolve(item || null),
      update: (newData: any) => {
        const data = this.getData();
        const index = data.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          data[index] = { ...data[index], ...newData };
          this.setData(data);
        }
        return Promise.resolve();
      },
      remove: () => {
        const data = this.getData();
        const filtered = data.filter((item: any) => item.id !== id);
        this.setData(filtered);
        return Promise.resolve();
      }
    };
  }

  insert(data: any) {
    const existing = this.getData();
    const newItem = { ...data, id: data.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
    existing.push(newItem);
    this.setData(existing);
    return Promise.resolve({ toJSON: () => newItem });
  }

  private getData(): any[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  private setData(data: any[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }
}

export const initDatabase = async (): Promise<VaxCareDatabase> => {
  if (db) {
    return db;
  }

  try {
    console.log('Initializing localStorage database...');
    
            db = {
              patients: new LocalStorageDB('patients'),
              immunizations: new LocalStorageDB('immunizations'),
              practitioners: new LocalStorageDB('practitioners'),
              organizations: new LocalStorageDB('organizations'),
              encounters: new LocalStorageDB('encounters'),
              medications: new LocalStorageDB('medications'),
              medicationAdministrations: new LocalStorageDB('medicationAdministrations'),
            };

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getDatabase = (): VaxCareDatabase | null => {
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  // localStorage doesn't need explicit cleanup
  db = null;
};
