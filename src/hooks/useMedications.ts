import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from './useDatabase';

export interface Medication {
  resourceType: 'Medication';
  id: string;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  manufacturer?: {
    display: string;
  };
  form?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  ingredient?: Array<{
    itemCodeableConcept: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    strength?: {
      numerator?: {
        value: number;
        unit: string;
      };
      denominator?: {
        value: number;
        unit: string;
      };
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export const useMedications = () => {
  const { db, isLoading: dbLoading, error: dbError } = useDatabase();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;

    const loadMedications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await db.medications.allDocs({
          include_docs: true,
          startkey: 'medication_',
          endkey: 'medication_\uffff'
        });
        const medicationData = result.rows
          .map((row: any) => row.doc)
          .filter((doc: any) => doc && doc.resourceType === 'Medication')
          .map((doc: any) => ({
            ...doc,
            _id: undefined,
            _rev: undefined,
          } as Medication));
        setMedications(medicationData);
      } catch (err) {
        console.error('Failed to load medications:', err);
        setError(err instanceof Error ? err.message : 'Failed to load medications');
      } finally {
        setIsLoading(false);
      }
    };

    loadMedications();

    // Subscribe to changes
    const changes = db.medications.changes({
      since: 'now',
      live: true,
      include_docs: true,
      filter: (doc: any) => doc.resourceType === 'Medication'
    }).on('change', async () => {
      await loadMedications();
    });

    return () => changes.cancel();
  }, [db]);

  const createMedication = useCallback(async (medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const newMedication: Medication = {
        ...medicationData,
        id: `medication_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };

      await db.medications.put({
        _id: newMedication.id,
        ...newMedication,
      });
      return newMedication;
    } catch (err) {
      console.error('Failed to create medication:', err);
      throw err;
    }
  }, [db]);

  const updateMedication = useCallback(async (id: string, updates: Partial<Medication>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const medication = await db.medications.get(id);
      if (!medication) throw new Error('Medication not found');

      const updatedMedication = {
        ...medication,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.medications.put(updatedMedication);
    } catch (err) {
      console.error('Failed to update medication:', err);
      throw err;
    }
  }, [db]);

  const deleteMedication = useCallback(async (id: string) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const medication = await db.medications.get(id);
      if (!medication) throw new Error('Medication not found');

      await db.medications.remove(medication);
    } catch (err) {
      console.error('Failed to delete medication:', err);
      throw err;
    }
  }, [db]);

  const getMedicationById = useCallback(async (id: string): Promise<Medication | null> => {
    if (!db) return null;

    try {
      const medication = await db.medications.get(id);
      return medication ? {
        ...medication,
        _id: undefined,
        _rev: undefined,
      } as Medication : null;
    } catch (err) {
      console.error('Failed to get medication:', err);
      return null;
    }
  }, [db]);

  const findMedicationByVaccineCode = useCallback(async (vaccineCode: string): Promise<Medication | null> => {
    if (!db) return null;

    try {
      const result = await db.medications.allDocs({
        include_docs: true,
        startkey: 'medication_',
        endkey: 'medication_\uffff'
      });
      const medication = result.rows
        .map((row: any) => row.doc)
        .filter((doc: any) => doc && doc.resourceType === 'Medication')
        .find((doc: any) => {
          return doc.code?.coding?.some((coding: any) => coding.code === vaccineCode);
        });
      return medication ? {
        ...medication,
        _id: undefined,
        _rev: undefined,
      } as Medication : null;
    } catch (err) {
      console.error('Failed to find medication by vaccine code:', err);
      return null;
    }
  }, [db]);

  return {
    medications,
    isLoading: isLoading || dbLoading,
    error: error || dbError,
    createMedication,
    updateMedication,
    deleteMedication,
    getMedicationById,
    findMedicationByVaccineCode,
  };
};
