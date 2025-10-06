import PouchDB from 'pouchdb-core';
import PouchDBMemory from 'pouchdb-adapter-memory';
import PouchDBHttp from 'pouchdb-adapter-http';
import PouchDBMapReduce from 'pouchdb-mapreduce';
import PouchDBReplication from 'pouchdb-replication';
import PouchDBIdb from 'pouchdb-adapter-idb';
import { migrateFromLocalStorage, isMigrationNeeded } from './simple-migration';

// Add PouchDB plugins
PouchDB.plugin(PouchDBMemory);
PouchDB.plugin(PouchDBHttp);
PouchDB.plugin(PouchDBMapReduce);
PouchDB.plugin(PouchDBReplication);
PouchDB.plugin(PouchDBIdb);

// Simple PouchDB database implementation with CouchDB sync
export interface SimpleVaxCareDatabase {
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

let db: SimpleVaxCareDatabase | null = null;

export const initDatabase = async (): Promise<SimpleVaxCareDatabase> => {
  if (db) {
    return db;
  }

  try {
    console.log('Initializing simple PouchDB database...');

    db = {
      patients: new PouchDB('vaxcare_patients', { adapter: 'memory' }),
      immunizations: new PouchDB('vaxcare_immunizations', { adapter: 'memory' }),
      practitioners: new PouchDB('vaxcare_practitioners', { adapter: 'memory' }),
      organizations: new PouchDB('vaxcare_organizations', { adapter: 'memory' }),
      encounters: new PouchDB('vaxcare_encounters', { adapter: 'memory' }),
      medications: new PouchDB('vaxcare_medications', { adapter: 'memory' }),
      medicationAdministrations: new PouchDB('vaxcare_medicationAdministrations', { adapter: 'memory' }),
    };

    console.log('Simple PouchDB database initialized successfully');

    // Set up CouchDB sync (optional - can be configured later)
    const couchDbUrl = process.env.NEXT_PUBLIC_COUCHDB_URL || 'http://localhost:5984';
    const syncEnabled = process.env.NEXT_PUBLIC_SYNC_ENABLED === 'true';
    
    if (syncEnabled) {
      console.log('🔄 Setting up CouchDB sync...');
      db.sync = {
        patients: db.patients.sync(`${couchDbUrl}/vaxcare_patients`, { live: true, retry: true }),
        immunizations: db.immunizations.sync(`${couchDbUrl}/vaxcare_immunizations`, { live: true, retry: true }),
        practitioners: db.practitioners.sync(`${couchDbUrl}/vaxcare_practitioners`, { live: true, retry: true }),
        organizations: db.organizations.sync(`${couchDbUrl}/vaxcare_organizations`, { live: true, retry: true }),
        encounters: db.encounters.sync(`${couchDbUrl}/vaxcare_encounters`, { live: true, retry: true }),
        medications: db.medications.sync(`${couchDbUrl}/vaxcare_medications`, { live: true, retry: true }),
        medicationAdministrations: db.medicationAdministrations.sync(`${couchDbUrl}/vaxcare_medicationAdministrations`, { live: true, retry: true }),
      };
      console.log('✅ CouchDB sync configured');
    } else {
      console.log('ℹ️ CouchDB sync disabled (set NEXT_PUBLIC_SYNC_ENABLED=true to enable)');
      // Set up mock sync objects for compatibility
      db.sync = {
        patients: { cancel: () => {} } as any,
        immunizations: { cancel: () => {} } as any,
        practitioners: { cancel: () => {} } as any,
        organizations: { cancel: () => {} } as any,
        encounters: { cancel: () => {} } as any,
        medications: { cancel: () => {} } as any,
        medicationAdministrations: { cancel: () => {} } as any,
      };
    }

    // Check if migration is needed and perform it
    if (isMigrationNeeded()) {
      console.log('🔄 Migration needed, starting data migration...');
      await migrateFromLocalStorage(db);
    }

    return db;
  } catch (error) {
    console.error('Failed to initialize simple PouchDB database:', error);
    throw error;
  }
};

export const getDatabase = (): SimpleVaxCareDatabase | null => {
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
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
  }
};
