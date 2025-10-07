import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from './useDatabase';

export interface Immunization {
  resourceType: 'Immunization';
  id: string;
  status: 'completed' | 'entered-in-error' | 'not-done';
  vaccineCode: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  patient: {
    reference: string;
    display: string;
  };
  occurrenceDateTime: string;
  performer?: Array<{
    actor: {
      reference: string;
      display: string;
    };
  }>;
  location?: {
    reference: string;
    display: string;
  };
  lotNumber?: string;
  manufacturer?: {
    display: string;
  };
  expirationDate?: string;
  site?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  route?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  doseQuantity?: {
    value: number;
    unit: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const useImmunizations = () => {
  const { db, isLoading: dbLoading, error: dbError } = useDatabase();
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;

    const loadImmunizations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await db.immunizations.allDocs({
          include_docs: true,
          startkey: 'immunization_',
          endkey: 'immunization_\uffff'
        });
        const immunizationData = result.rows
          .map((row: any) => row.doc)
          .filter((doc: any) => doc && doc.resourceType === 'Immunization')
          .map((doc: any) => ({
            ...doc,
            // Remove PouchDB-specific fields for compatibility
            _id: undefined,
            _rev: undefined,
          } as Immunization));
        setImmunizations(immunizationData);
      } catch (err) {
        console.error('Failed to load immunizations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load immunizations');
      } finally {
        setIsLoading(false);
      }
    };

    loadImmunizations();

    // Set up real-time changes listener
    const changes = db.immunizations.changes({
      since: 'now',
      live: true,
      include_docs: true,
      filter: (doc: any) => doc.resourceType === 'Immunization'
    }).on('change', async () => {
      await loadImmunizations();
    });

    return () => changes.cancel();
  }, [db]);

  const createImmunization = useCallback(async (immunizationData: Omit<Immunization, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const newImmunization: Immunization = {
        ...immunizationData,
        id: `immunization_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };

      await db.immunizations.put({
        _id: newImmunization.id,
        ...newImmunization,
      });
      return newImmunization;
    } catch (err) {
      console.error('Failed to create immunization:', err);
      throw err;
    }
  }, [db]);

  const updateImmunization = useCallback(async (id: string, updates: Partial<Immunization>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const immunization = await db.immunizations.get(id);
      if (!immunization) throw new Error('Immunization not found');

      const updatedImmunization = {
        ...immunization,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.immunizations.put(updatedImmunization);
    } catch (err) {
      console.error('Failed to update immunization:', err);
      throw err;
    }
  }, [db]);

  const deleteImmunization = useCallback(async (id: string) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const immunization = await db.immunizations.get(id);
      if (!immunization) throw new Error('Immunization not found');

      await db.immunizations.remove(immunization);
    } catch (err) {
      console.error('Failed to delete immunization:', err);
      throw err;
    }
  }, [db]);

  const getImmunizationsByPatient = useCallback(async (patientId: string): Promise<Immunization[]> => {
    if (!db) return [];

    try {
      const result = await db.immunizations.allDocs({
        include_docs: true,
        startkey: 'immunization_',
        endkey: 'immunization_\uffff'
      });
      const filteredDocs = result.rows
        .map((row: any) => row.doc)
        .filter((doc: any) => doc && doc.resourceType === 'Immunization')
        .filter((doc: any) => {
          return doc.patient?.reference === `Patient/${patientId}` || doc.patient?.reference === patientId;
        });
      return filteredDocs.map((doc: any) => ({
        ...doc,
        _id: undefined,
        _rev: undefined,
      } as Immunization));
    } catch (err) {
      console.error('Failed to get immunizations for patient:', err);
      return [];
    }
  }, [db]);

  return {
    immunizations,
    isLoading: isLoading || dbLoading,
    error: error || dbError,
    createImmunization,
    updateImmunization,
    deleteImmunization,
    getImmunizationsByPatient,
  };
};
