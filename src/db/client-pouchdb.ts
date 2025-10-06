// Client-side only PouchDB implementation with CouchDB sync capability
// This avoids SSR conflicts by only running in the browser

import { migrateFromLocalStorage, isMigrationNeeded } from './simple-migration';

// PouchDB database interface
export interface VaxCareDatabase {
  patients: any;
  immunizations: any;
  practitioners: any;
  organizations: any;
  encounters: any;
  medications: any;
  medicationAdministrations: any;
  sync: {
    patients: any;
    immunizations: any;
    practitioners: any;
    organizations: any;
    encounters: any;
    medications: any;
    medicationAdministrations: any;
  };
}

let db: VaxCareDatabase | null = null;
let PouchDB: any = null;

// Dynamic import of PouchDB browser
const getPouchDB = async () => {
  if (typeof window === 'undefined') return null; // SSR safe
  
  if (!PouchDB) {
    try {
      const pouchModule = await import('pouchdb-browser');
      PouchDB = pouchModule.default;
      console.log('✅ PouchDB browser loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load PouchDB browser:', error);
      throw error;
    }
  }
  
  return PouchDB;
};

export const initDatabase = async (): Promise<VaxCareDatabase> => {
  if (typeof window === 'undefined') {
    throw new Error('Database can only be initialized on the client side');
  }

  if (db) {
    return db;
  }

  try {
    console.log('🚀 Initializing client-side PouchDB database...');

    const PouchDBClass = await getPouchDB();
    if (!PouchDBClass) {
      throw new Error('PouchDB not available');
    }

    // Create local databases with IndexedDB adapter
    const localDb = {
      patients: new PouchDBClass('vaxcare_patients', { adapter: 'idb' }),
      immunizations: new PouchDBClass('vaxcare_immunizations', { adapter: 'idb' }),
      practitioners: new PouchDBClass('vaxcare_practitioners', { adapter: 'idb' }),
      organizations: new PouchDBClass('vaxcare_organizations', { adapter: 'idb' }),
      encounters: new PouchDBClass('vaxcare_encounters', { adapter: 'idb' }),
      medications: new PouchDBClass('vaxcare_medications', { adapter: 'idb' }),
      medicationAdministrations: new PouchDBClass('vaxcare_medicationAdministrations', { adapter: 'idb' }),
    };

    console.log('✅ Local PouchDB databases created successfully');

    // Set up CouchDB sync
    const couchDbUrl = process.env.NEXT_PUBLIC_COUCHDB_URL || 'http://localhost:5984';
    const syncEnabled = process.env.NEXT_PUBLIC_SYNC_ENABLED === 'true';
    
    if (syncEnabled) {
      console.log(`🔄 Setting up CouchDB sync with ${couchDbUrl}...`);
      
      try {
        // Create remote databases
        const remoteDb = {
          patients: new PouchDBClass(`${couchDbUrl}/vaxcare_patients`),
          immunizations: new PouchDBClass(`${couchDbUrl}/vaxcare_immunizations`),
          practitioners: new PouchDBClass(`${couchDbUrl}/vaxcare_practitioners`),
          organizations: new PouchDBClass(`${couchDbUrl}/vaxcare_organizations`),
          encounters: new PouchDBClass(`${couchDbUrl}/vaxcare_encounters`),
          medications: new PouchDBClass(`${couchDbUrl}/vaxcare_medications`),
          medicationAdministrations: new PouchDBClass(`${couchDbUrl}/vaxcare_medicationAdministrations`),
        };

        // Set up bidirectional sync
        const sync = {
          patients: localDb.patients.sync(remoteDb.patients, { live: true, retry: true }),
          immunizations: localDb.immunizations.sync(remoteDb.immunizations, { live: true, retry: true }),
          practitioners: localDb.practitioners.sync(remoteDb.practitioners, { live: true, retry: true }),
          organizations: localDb.organizations.sync(remoteDb.organizations, { live: true, retry: true }),
          encounters: localDb.encounters.sync(remoteDb.encounters, { live: true, retry: true }),
          medications: localDb.medications.sync(remoteDb.medications, { live: true, retry: true }),
          medicationAdministrations: localDb.medicationAdministrations.sync(remoteDb.medicationAdministrations, { live: true, retry: true }),
        };

        db = { ...localDb, sync };
        console.log('✅ CouchDB sync configured successfully');
      } catch (syncError) {
        console.warn('⚠️ CouchDB sync failed, continuing without sync:', syncError);
        // Set up mock sync objects for compatibility
        const mockSync = {
          patients: { cancel: () => {} } as any,
          immunizations: { cancel: () => {} } as any,
          practitioners: { cancel: () => {} } as any,
          organizations: { cancel: () => {} } as any,
          encounters: { cancel: () => {} } as any,
          medications: { cancel: () => {} } as any,
          medicationAdministrations: { cancel: () => {} } as any,
        };
        db = { ...localDb, sync: mockSync };
      }
    } else {
      console.log('ℹ️ CouchDB sync disabled (set NEXT_PUBLIC_SYNC_ENABLED=true to enable)');
      // Set up mock sync objects for compatibility
      const mockSync = {
        patients: { cancel: () => {} } as any,
        immunizations: { cancel: () => {} } as any,
        practitioners: { cancel: () => {} } as any,
        organizations: { cancel: () => {} } as any,
        encounters: { cancel: () => {} } as any,
        medications: { cancel: () => {} } as any,
        medicationAdministrations: { cancel: () => {} } as any,
      };
      db = { ...localDb, sync: mockSync };
    }

    // Check if migration is needed and perform it
    if (isMigrationNeeded()) {
      console.log('🔄 Migration needed, starting data migration...');
      await migrateFromLocalStorage(db);
    }

    console.log('🎉 Client-side PouchDB database ready!');
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize client-side PouchDB database:', error);
    throw error;
  }
};

export const getDatabase = (): VaxCareDatabase | null => {
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    console.log('🔄 Closing PouchDB database and stopping sync...');
    
    // Cancel all sync operations
    if (db.sync) {
      Object.values(db.sync).forEach(sync => sync.cancel());
    }
    
    // Close all databases
    await Promise.all([
      db.patients.close(),
      db.immunizations.close(),
      db.practitioners.close(),
      db.organizations.close(),
      db.encounters.close(),
      db.medications.close(),
      db.medicationAdministrations.close(),
    ]);
    
    db = null;
    console.log('✅ Database closed successfully');
  }
};

// Export the type for compatibility
export type SimpleVaxCareDatabase = VaxCareDatabase;
