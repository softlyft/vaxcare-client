import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from './useDatabase';

export interface MedicationAdministration {
  resourceType: 'MedicationAdministration';
  id: string;
  status: 'in-progress' | 'not-done' | 'on-hold' | 'completed' | 'entered-in-error' | 'stopped' | 'unknown';
  medicationCodeableConcept: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
    display: string;
  };
  encounter?: {
    reference: string;
    display: string;
  };
  performer?: Array<{
    actor: {
      reference: string;
      display: string;
    };
  }>;
  effectiveDateTime: string;
  dosage?: {
    route?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    dose?: {
      value: number;
      unit: string;
    };
    site?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export const useMedicationAdministrations = () => {
  const { db, isLoading: dbLoading, error: dbError } = useDatabase();
  const [medicationAdministrations, setMedicationAdministrations] = useState<MedicationAdministration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;

    const loadMedicationAdministrations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await db.medicationAdministrations.allDocs({
          include_docs: true,
          startkey: 'medicationAdministration_',
          endkey: 'medicationAdministration_\uffff'
        });
        const medicationAdministrationData = result.rows
          .map((row: any) => row.doc)
          .filter((doc: any) => doc && doc.resourceType === 'MedicationAdministration')
          .map((doc: any) => ({
            ...doc,
            _id: undefined,
            _rev: undefined,
          } as MedicationAdministration));
        setMedicationAdministrations(medicationAdministrationData);
      } catch (err) {
        console.error('Failed to load medication administrations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load medication administrations');
      } finally {
        setIsLoading(false);
      }
    };

    loadMedicationAdministrations();

    // Subscribe to changes
    const changes = db.medicationAdministrations.changes({
      since: 'now',
      live: true,
      include_docs: true,
      filter: (doc: any) => doc.resourceType === 'MedicationAdministration'
    }).on('change', async () => {
      await loadMedicationAdministrations();
    });

    return () => changes.cancel();
  }, [db]);

  const createMedicationAdministration = useCallback(async (medicationAdministrationData: Omit<MedicationAdministration, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const newMedicationAdministration: MedicationAdministration = {
        ...medicationAdministrationData,
        id: `medicationAdministration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };

      await db.medicationAdministrations.put({
        _id: newMedicationAdministration.id,
        ...newMedicationAdministration,
      });
      return newMedicationAdministration;
    } catch (err) {
      console.error('Failed to create medication administration:', err);
      throw err;
    }
  }, [db]);

  const updateMedicationAdministration = useCallback(async (id: string, updates: Partial<MedicationAdministration>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const medicationAdministration = await db.medicationAdministrations.get(id);
      if (!medicationAdministration) throw new Error('Medication administration not found');

      const updatedMedicationAdministration = {
        ...medicationAdministration,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.medicationAdministrations.put(updatedMedicationAdministration);
    } catch (err) {
      console.error('Failed to update medication administration:', err);
      throw err;
    }
  }, [db]);

  const deleteMedicationAdministration = useCallback(async (id: string) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const medicationAdministration = await db.medicationAdministrations.get(id);
      if (!medicationAdministration) throw new Error('Medication administration not found');

      await db.medicationAdministrations.remove(medicationAdministration);
    } catch (err) {
      console.error('Failed to delete medication administration:', err);
      throw err;
    }
  }, [db]);

  const getMedicationAdministrationById = useCallback(async (id: string): Promise<MedicationAdministration | null> => {
    if (!db) return null;

    try {
      const medicationAdministration = await db.medicationAdministrations.get(id);
      return medicationAdministration ? {
        ...medicationAdministration,
        _id: undefined,
        _rev: undefined,
      } as MedicationAdministration : null;
    } catch (err) {
      console.error('Failed to get medication administration:', err);
      return null;
    }
  }, [db]);

  const getMedicationAdministrationsByPatient = useCallback(async (patientId: string): Promise<MedicationAdministration[]> => {
    if (!db) return [];

    try {
      const result = await db.medicationAdministrations.allDocs({
        include_docs: true,
        startkey: 'medicationAdministration_',
        endkey: 'medicationAdministration_\uffff'
      });
      const filteredDocs = result.rows
        .map((row: any) => row.doc)
        .filter((doc: any) => doc && doc.resourceType === 'MedicationAdministration')
        .filter((doc: any) => {
          return doc.subject?.reference === `Patient/${patientId}` || doc.subject?.reference === patientId;
        });
      return filteredDocs.map((doc: any) => ({
        ...doc,
        _id: undefined,
        _rev: undefined,
      } as MedicationAdministration));
    } catch (err) {
      console.error('Failed to get medication administrations for patient:', err);
      return [];
    }
  }, [db]);

  const getMedicationAdministrationsByEncounter = useCallback(async (encounterId: string): Promise<MedicationAdministration[]> => {
    if (!db) return [];

    try {
      const result = await db.medicationAdministrations.allDocs({
        include_docs: true,
        startkey: 'medicationAdministration_',
        endkey: 'medicationAdministration_\uffff'
      });
      const filteredDocs = result.rows
        .map((row: any) => row.doc)
        .filter((doc: any) => doc && doc.resourceType === 'MedicationAdministration')
        .filter((doc: any) => {
          return doc.encounter?.reference === `Encounter/${encounterId}` || doc.encounter?.reference === encounterId;
        });
      return filteredDocs.map((doc: any) => ({
        ...doc,
        _id: undefined,
        _rev: undefined,
      } as MedicationAdministration));
    } catch (err) {
      console.error('Failed to get medication administrations for encounter:', err);
      return [];
    }
  }, [db]);

  return {
    medicationAdministrations,
    isLoading: isLoading || dbLoading,
    error: error || dbError,
    createMedicationAdministration,
    updateMedicationAdministration,
    deleteMedicationAdministration,
    getMedicationAdministrationById,
    getMedicationAdministrationsByPatient,
    getMedicationAdministrationsByEncounter,
  };
};
