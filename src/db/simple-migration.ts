import { SimpleVaxCareDatabase } from './localstorage-pouchdb';

const LOCAL_STORAGE_PREFIX = 'vaxcare_';
const MIGRATION_FLAG_KEY = 'vaxcare_pouchdb_migration_done';

export const isMigrationNeeded = (): boolean => {
  if (typeof window === 'undefined') return false;
  const migrationDone = localStorage.getItem(MIGRATION_FLAG_KEY);
  // Check if any old localStorage data exists
  const oldDataExists = Object.keys(localStorage).some(key => key.startsWith(LOCAL_STORAGE_PREFIX));
  return oldDataExists && !migrationDone;
};

export const migrateFromLocalStorage = async (db: SimpleVaxCareDatabase): Promise<void> => {
  if (typeof window === 'undefined') return;

  try {
    console.log('🔄 Starting data migration from localStorage to simple PouchDB...');

    // Helper function to safely migrate data
    const migrateData = async (key: string, collection: any, name: string) => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log(`📦 Migrating ${parsedData.length} ${name}...`);
            const docs = parsedData.map((item: any) => ({
              _id: item.id,
              ...item,
            }));
            await collection.bulkDocs(docs);
            localStorage.removeItem(key);
            console.log(`✅ Successfully migrated ${parsedData.length} ${name}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to parse ${name} data, skipping migration:`, error);
          localStorage.removeItem(key); // Clean up corrupted data
        }
      }
    };

    // Migrate all collections
    await migrateData('vaxcare_patients', db.patients, 'patients');
    await migrateData('vaxcare_immunizations', db.immunizations, 'immunizations');
    await migrateData('vaxcare_practitioners', db.practitioners, 'practitioners');
    await migrateData('vaxcare_organizations', db.organizations, 'organizations');
    await migrateData('vaxcare_encounters', db.encounters, 'encounters');
    await migrateData('vaxcare_medications', db.medications, 'medications');
    await migrateData('vaxcare_medicationAdministrations', db.medicationAdministrations, 'medication administrations');

    // Mark migration as complete
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    console.log('✅ LocalStorage to simple PouchDB migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};