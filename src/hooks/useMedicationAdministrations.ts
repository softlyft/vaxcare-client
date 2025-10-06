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
        
        const medicationAdministrationDocs = await db.medicationAdministrations.find().exec();
        const medicationAdministrationData = medicationAdministrationDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as MedicationAdministration);
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
    const subscription = db.medicationAdministrations.find().$.subscribe((medicationAdministrationDocs: any) => {
      const medicationAdministrationData = medicationAdministrationDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as MedicationAdministration);
      setMedicationAdministrations(medicationAdministrationData);
    });

    return () => subscription.unsubscribe();
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

      await db.medicationAdministrations.insert(newMedicationAdministration);
      return newMedicationAdministration;
    } catch (err) {
      console.error('Failed to create medication administration:', err);
      throw err;
    }
  }, [db]);

  const updateMedicationAdministration = useCallback(async (id: string, updates: Partial<MedicationAdministration>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const medicationAdministration = await db.medicationAdministrations.findOne(id).exec();
      if (!medicationAdministration) throw new Error('Medication administration not found');

      await medicationAdministration.update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to update medication administration:', err);
      throw err;
    }
  }, [db]);

  const deleteMedicationAdministration = useCallback(async (id: string) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const medicationAdministration = await db.medicationAdministrations.findOne(id).exec();
      if (!medicationAdministration) throw new Error('Medication administration not found');

      await medicationAdministration.remove();
    } catch (err) {
      console.error('Failed to delete medication administration:', err);
      throw err;
    }
  }, [db]);

  const getMedicationAdministrationById = useCallback(async (id: string): Promise<MedicationAdministration | null> => {
    if (!db) return null;

    try {
      const medicationAdministration = await db.medicationAdministrations.findOne(id).exec();
      return medicationAdministration ? (medicationAdministration.toJSON ? medicationAdministration.toJSON() : medicationAdministration as MedicationAdministration) : null;
    } catch (err) {
      console.error('Failed to get medication administration:', err);
      return null;
    }
  }, [db]);

  const getMedicationAdministrationsByPatient = useCallback(async (patientId: string): Promise<MedicationAdministration[]> => {
    if (!db) return [];

    try {
      const medicationAdministrationDocs = await db.medicationAdministrations.find().exec();
      const filteredDocs = medicationAdministrationDocs.filter((doc: any) => {
        const data = doc.toJSON ? doc.toJSON() : doc;
        return data.subject?.reference === `Patient/${patientId}` || data.subject?.reference === patientId;
      });
      return filteredDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as MedicationAdministration);
    } catch (err) {
      console.error('Failed to get medication administrations for patient:', err);
      return [];
    }
  }, [db]);

  const getMedicationAdministrationsByEncounter = useCallback(async (encounterId: string): Promise<MedicationAdministration[]> => {
    if (!db) return [];

    try {
      const medicationAdministrationDocs = await db.medicationAdministrations.find().exec();
      const filteredDocs = medicationAdministrationDocs.filter((doc: any) => {
        const data = doc.toJSON ? doc.toJSON() : doc;
        return data.encounter?.reference === `Encounter/${encounterId}` || data.encounter?.reference === encounterId;
      });
      return filteredDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as MedicationAdministration);
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
