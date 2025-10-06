import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from './useDatabase';

export interface Encounter {
  resourceType: 'Encounter';
  id: string;
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  class: {
    system: string;
    code: string;
    display: string;
  };
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  subject: {
    reference: string;
    display: string;
  };
  participant?: Array<{
    type?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    }>;
    individual: {
      reference: string;
      display: string;
    };
  }>;
  location?: Array<{
    location: {
      reference: string;
      display: string;
    };
  }>;
  period?: {
    start: string;
    end?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const useEncounters = () => {
  const { db, isLoading: dbLoading, error: dbError } = useDatabase();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;

    const loadEncounters = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const encounterDocs = await db.encounters.find().exec();
        const encounterData = encounterDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as Encounter);
        setEncounters(encounterData);
      } catch (err) {
        console.error('Failed to load encounters:', err);
        setError(err instanceof Error ? err.message : 'Failed to load encounters');
      } finally {
        setIsLoading(false);
      }
    };

    loadEncounters();

    // Subscribe to changes
    const subscription = db.encounters.find().$.subscribe((encounterDocs: any) => {
      const encounterData = encounterDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as Encounter);
      setEncounters(encounterData);
    });

    return () => subscription.unsubscribe();
  }, [db]);

  const createEncounter = useCallback(async (encounterData: Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const newEncounter: Encounter = {
        ...encounterData,
        id: `encounter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };

      await db.encounters.insert(newEncounter);
      return newEncounter;
    } catch (err) {
      console.error('Failed to create encounter:', err);
      throw err;
    }
  }, [db]);

  const updateEncounter = useCallback(async (id: string, updates: Partial<Encounter>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const encounter = await db.encounters.findOne(id).exec();
      if (!encounter) throw new Error('Encounter not found');

      await encounter.update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to update encounter:', err);
      throw err;
    }
  }, [db]);

  const deleteEncounter = useCallback(async (id: string) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const encounter = await db.encounters.findOne(id).exec();
      if (!encounter) throw new Error('Encounter not found');

      await encounter.remove();
    } catch (err) {
      console.error('Failed to delete encounter:', err);
      throw err;
    }
  }, [db]);

  const getEncounterById = useCallback(async (id: string): Promise<Encounter | null> => {
    if (!db) return null;

    try {
      const encounter = await db.encounters.findOne(id).exec();
      return encounter ? (encounter.toJSON ? encounter.toJSON() : encounter as Encounter) : null;
    } catch (err) {
      console.error('Failed to get encounter:', err);
      return null;
    }
  }, [db]);

  const getEncountersByPatient = useCallback(async (patientId: string): Promise<Encounter[]> => {
    if (!db) return [];

    try {
      const encounterDocs = await db.encounters.find().exec();
      const filteredDocs = encounterDocs.filter((doc: any) => {
        const data = doc.toJSON ? doc.toJSON() : doc;
        return data.subject?.reference === `Patient/${patientId}` || data.subject?.reference === patientId;
      });
      return filteredDocs.map((doc: any) => doc.toJSON ? doc.toJSON() : doc as Encounter);
    } catch (err) {
      console.error('Failed to get encounters for patient:', err);
      return [];
    }
  }, [db]);

  return {
    encounters,
    isLoading: isLoading || dbLoading,
    error: error || dbError,
    createEncounter,
    updateEncounter,
    deleteEncounter,
    getEncounterById,
    getEncountersByPatient,
  };
};
