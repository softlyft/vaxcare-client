// Client-side PouchDB implementation with CouchDB sync capability
// This avoids SSR conflicts by only running in the browser
export { 
  initDatabase, 
  getDatabase, 
  closeDatabase,
  type SimpleVaxCareDatabase
} from './client-pouchdb';
