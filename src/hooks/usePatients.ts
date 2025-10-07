import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from './useDatabase';

export interface Patient {
  resourceType: 'Patient';
  id: string;
  name: Array<{
    family: string;
    given: string[];
    use?: string;
  }>;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  contact?: Array<{
    system: string;
    value: string;
    use?: string;
  }>;
  address?: Array<{
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const usePatients = () => {
  const { db, isLoading: dbLoading, error: dbError } = useDatabase();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;

    const loadPatients = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await db.patients.allDocs({
          include_docs: true,
          startkey: 'patient_',
          endkey: 'patient_\uffff'
        });
        const patientData = result.rows
          .map((row: any) => row.doc)
          .filter((doc: any) => doc && doc.resourceType === 'Patient')
          .map((doc: any) => ({
            ...doc,
            // Remove PouchDB-specific fields for compatibility
            _id: undefined,
            _rev: undefined,
          } as Patient));
        setPatients(patientData);
      } catch (err) {
        console.error('Failed to load patients:', err);
        setError(err instanceof Error ? err.message : 'Failed to load patients');
      } finally {
        setIsLoading(false);
      }
    };

    loadPatients();

    // Set up real-time changes listener
    const changes = db.patients.changes({
      since: 'now',
      live: true,
      include_docs: true,
      filter: (doc: any) => doc.resourceType === 'Patient'
    }).on('change', async () => {
      await loadPatients();
    });

    return () => changes.cancel();
  }, [db]);

  const createPatient = useCallback(async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const newPatient: Patient = {
        ...patientData,
        id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };

      await db.patients.put({
        _id: newPatient.id,
        ...newPatient,
      });
      return {
        ...newPatient,
        _id: undefined,
        _rev: undefined,
      } as Patient;
    } catch (err) {
      console.error('Failed to create patient:', err);
      throw err;
    }
  }, [db]);

  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const patient = await db.patients.get(id);
      if (!patient) throw new Error('Patient not found');

      const updatedPatient = {
        ...patient,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.patients.put(updatedPatient);
    } catch (err) {
      console.error('Failed to update patient:', err);
      throw err;
    }
  }, [db]);

  const deletePatient = useCallback(async (id: string) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const patient = await db.patients.get(id);
      if (!patient) throw new Error('Patient not found');

      await db.patients.remove(patient);
    } catch (err) {
      console.error('Failed to delete patient:', err);
      throw err;
    }
  }, [db]);

  const getPatientById = useCallback(async (id: string): Promise<Patient | null> => {
    if (!db) return null;

    try {
      const patient = await db.patients.get(id);
      return patient ? {
        ...patient,
        _id: undefined,
        _rev: undefined,
      } as Patient : null;
    } catch (err) {
      console.error('Failed to get patient:', err);
      return null;
    }
  }, [db]);

  return {
    patients,
    isLoading: isLoading || dbLoading,
    error: error || dbError,
    createPatient,
    updatePatient,
    deletePatient,
    getPatientById,
  };
};
