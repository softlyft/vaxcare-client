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
        
        const immunizationDocs = await db.immunizations.find().exec();
        const immunizationData = immunizationDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as Immunization);
        setImmunizations(immunizationData);
      } catch (err) {
        console.error('Failed to load immunizations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load immunizations');
      } finally {
        setIsLoading(false);
      }
    };

    loadImmunizations();

    // Subscribe to changes
    const subscription = db.immunizations.find().$.subscribe((immunizationDocs: any) => {
      const immunizationData = immunizationDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as Immunization);
      setImmunizations(immunizationData);
    });

    return () => subscription.unsubscribe();
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

      await db.immunizations.insert(newImmunization);
      return newImmunization;
    } catch (err) {
      console.error('Failed to create immunization:', err);
      throw err;
    }
  }, [db]);

  const updateImmunization = useCallback(async (id: string, updates: Partial<Immunization>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const immunization = await db.immunizations.findOne(id).exec();
      if (!immunization) throw new Error('Immunization not found');

      await immunization.update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to update immunization:', err);
      throw err;
    }
  }, [db]);

  const deleteImmunization = useCallback(async (id: string) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const immunization = await db.immunizations.findOne(id).exec();
      if (!immunization) throw new Error('Immunization not found');

      await immunization.remove();
    } catch (err) {
      console.error('Failed to delete immunization:', err);
      throw err;
    }
  }, [db]);

  const getImmunizationsByPatient = useCallback(async (patientId: string): Promise<Immunization[]> => {
    if (!db) return [];

    try {
      const immunizationDocs = await db.immunizations.find().exec();
      const filteredDocs = immunizationDocs.filter((doc: any) => {
        const data = doc.toJSON ? doc.toJSON() : doc;
        return data.patient?.reference === `Patient/${patientId}` || data.patient?.reference === patientId;
      });
      return filteredDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as Immunization);
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
