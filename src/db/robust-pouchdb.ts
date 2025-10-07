// Robust PouchDB implementation with comprehensive error handling
import PouchDB from 'pouchdb';
import PouchDBIdb from 'pouchdb-adapter-idb';
import PouchDBHttp from 'pouchdb-adapter-http';
import PouchDBMapReduce from 'pouchdb-mapreduce';
import PouchDBReplication from 'pouchdb-replication';
import { migrateFromLocalStorage, isMigrationNeeded } from './simple-migration';

// Add PouchDB plugins with error handling
try {
  PouchDB.plugin(PouchDBIdb);
  console.log('✅ PouchDB IndexedDB adapter loaded');
} catch (error) {
  console.warn('⚠️ PouchDB IndexedDB adapter failed to load:', error);
}

try {
  PouchDB.plugin(PouchDBHttp);
  PouchDB.plugin(PouchDBMapReduce);
  PouchDB.plugin(PouchDBReplication);
  console.log('✅ PouchDB core plugins loaded');
} catch (error) {
  console.error('❌ PouchDB core plugins failed to load:', error);
  throw error;
}

// Robust PouchDB database implementation with CouchDB sync capability
export interface VaxCareDatabase {
  patients: PouchDB.Database;
  immunizations: PouchDB.Database;
  practitioners: PouchDB.Database;
  organizations: PouchDB.Database;
  encounters: PouchDB.Database;
  medications: PouchDB.Database;
  medicationAdministrations: PouchDB.Database;
  sync: {
    patients: PouchDB.Replication.Sync<{}>;
    immunizations: PouchDB.Replication.Sync<{}>;
    practitioners: PouchDB.Replication.Sync<{}>;
    organizations: PouchDB.Replication.Sync<{}>;
    encounters: PouchDB.Replication.Sync<{}>;
    medications: PouchDB.Replication.Sync<{}>;
    medicationAdministrations: PouchDB.Replication.Sync<{}>;
  };
}

let db: VaxCareDatabase | null = null;

// Helper function to create database with fallback
const createDatabase = (name: string): PouchDB.Database => {
  const adapters = ['idb', 'memory'];
  
  for (const adapter of adapters) {
    try {
      console.log(`🔄 Trying to create ${name} with ${adapter} adapter...`);
      const database = new PouchDB(name, { adapter });
      console.log(`✅ Successfully created ${name} with ${adapter} adapter`);
      return database;
    } catch (error) {
      console.warn(`⚠️ Failed to create ${name} with ${adapter} adapter:`, error);
      if (adapter === 'memory') {
        // If even memory fails, throw the error
        throw new Error(`Failed to create database ${name} with all adapters: ${error}`);
      }
    }
  }
  
  throw new Error(`Failed to create database ${name}`);
};

export const initDatabase = async (): Promise<VaxCareDatabase> => {
  if (db) {
    return db;
  }

  try {
    console.log('🚀 Initializing robust PouchDB database...');

    // Create local databases with fallback
    const localDb = {
      patients: createDatabase('vaxcare_patients'),
      immunizations: createDatabase('vaxcare_immunizations'),
      practitioners: createDatabase('vaxcare_practitioners'),
      organizations: createDatabase('vaxcare_organizations'),
      encounters: createDatabase('vaxcare_encounters'),
      medications: createDatabase('vaxcare_medications'),
      medicationAdministrations: createDatabase('vaxcare_medicationAdministrations'),
    };

    console.log('✅ All local PouchDB databases created successfully');

    // Set up CouchDB sync
    const couchDbUrl = process.env.NEXT_PUBLIC_COUCHDB_URL || 'http://localhost:5984';
    const syncEnabled = process.env.NEXT_PUBLIC_SYNC_ENABLED === 'true';
    
    if (syncEnabled) {
      console.log(`🔄 Setting up CouchDB sync with ${couchDbUrl}...`);
      
      try {
        // Test CouchDB connection first
        const testDb = new PouchDB(`${couchDbUrl}/test_connection`);
        await testDb.info();
        console.log('✅ CouchDB connection successful');
        
        // Create remote databases
        const remoteDb = {
          patients: new PouchDB(`${couchDbUrl}/vaxcare_patients`),
          immunizations: new PouchDB(`${couchDbUrl}/vaxcare_immunizations`),
          practitioners: new PouchDB(`${couchDbUrl}/vaxcare_practitioners`),
          organizations: new PouchDB(`${couchDbUrl}/vaxcare_organizations`),
          encounters: new PouchDB(`${couchDbUrl}/vaxcare_encounters`),
          medications: new PouchDB(`${couchDbUrl}/vaxcare_medications`),
          medicationAdministrations: new PouchDB(`${couchDbUrl}/vaxcare_medicationAdministrations`),
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

    console.log('🎉 Robust PouchDB database ready!');
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize robust PouchDB database:', error);
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
