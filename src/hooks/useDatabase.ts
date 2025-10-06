import { useEffect, useState } from 'react';
import { initDatabase, getDatabase, SimpleVaxCareDatabase } from '@/db/database';

export const useDatabase = () => {
  const [db, setDb] = useState<SimpleVaxCareDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDb = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const database = await initDatabase();
        setDb(database);
      } catch (err) {
        console.error('Database initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDb();
  }, []);

  return { db, isLoading, error };
};
