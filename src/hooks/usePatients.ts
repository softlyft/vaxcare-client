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
        
        const patientDocs = await db.patients.find().exec();
        const patientData = patientDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as Patient);
        setPatients(patientData);
      } catch (err) {
        console.error('Failed to load patients:', err);
        setError(err instanceof Error ? err.message : 'Failed to load patients');
      } finally {
        setIsLoading(false);
      }
    };

    loadPatients();

    // Subscribe to changes
    const subscription = db.patients.find().$.subscribe((patientDocs: any) => {
      const patientData = patientDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as Patient);
      setPatients(patientData);
    });

    return () => subscription.unsubscribe();
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

      await db.patients.insert(newPatient);
      return newPatient;
    } catch (err) {
      console.error('Failed to create patient:', err);
      throw err;
    }
  }, [db]);

  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const patient = await db.patients.findOne(id).exec();
      if (!patient) throw new Error('Patient not found');

      await patient.update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to update patient:', err);
      throw err;
    }
  }, [db]);

  const deletePatient = useCallback(async (id: string) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const patient = await db.patients.findOne(id).exec();
      if (!patient) throw new Error('Patient not found');

      await patient.remove();
    } catch (err) {
      console.error('Failed to delete patient:', err);
      throw err;
    }
  }, [db]);

  const getPatientById = useCallback(async (id: string): Promise<Patient | null> => {
    if (!db) return null;

    try {
      const patient = await db.patients.findOne(id).exec();
      return patient ? (patient.toJSON ? patient.toJSON() : patient as Patient) : null;
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
