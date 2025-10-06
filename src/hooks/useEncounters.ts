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
        
        const result = await db.encounters.allDocs({
          include_docs: true,
          startkey: 'encounter_',
          endkey: 'encounter_\uffff'
        });
        const encounterData = result.rows
          .map((row: any) => row.doc)
          .filter((doc: any) => doc && doc.resourceType === 'Encounter')
          .map((doc: any) => ({
            ...doc,
            _id: undefined,
            _rev: undefined,
          } as Encounter));
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
    const changes = db.encounters.changes({
      since: 'now',
      live: true,
      include_docs: true,
      filter: (doc: any) => doc.resourceType === 'Encounter'
    }).on('change', async () => {
      await loadEncounters();
    });

    return () => changes.cancel();
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

      await db.encounters.put({
        _id: newEncounter.id,
        ...newEncounter,
      });
      return newEncounter;
    } catch (err) {
      console.error('Failed to create encounter:', err);
      throw err;
    }
  }, [db]);

  const updateEncounter = useCallback(async (id: string, updates: Partial<Encounter>) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const encounter = await db.encounters.get(id);
      if (!encounter) throw new Error('Encounter not found');

      const updatedEncounter = {
        ...encounter,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.encounters.put(updatedEncounter);
    } catch (err) {
      console.error('Failed to update encounter:', err);
      throw err;
    }
  }, [db]);

  const deleteEncounter = useCallback(async (id: string) => {
    if (!db) throw new Error('Database not initialized');

    try {
      const encounter = await db.encounters.get(id);
      if (!encounter) throw new Error('Encounter not found');

      await db.encounters.remove(encounter);
    } catch (err) {
      console.error('Failed to delete encounter:', err);
      throw err;
    }
  }, [db]);

  const getEncounterById = useCallback(async (id: string): Promise<Encounter | null> => {
    if (!db) return null;

    try {
      const encounter = await db.encounters.get(id);
      return encounter ? {
        ...encounter,
        _id: undefined,
        _rev: undefined,
      } as Encounter : null;
    } catch (err) {
      console.error('Failed to get encounter:', err);
      return null;
    }
  }, [db]);

  const getEncountersByPatient = useCallback(async (patientId: string): Promise<Encounter[]> => {
    if (!db) return [];

    try {
      const result = await db.encounters.allDocs({
        include_docs: true,
        startkey: 'encounter_',
        endkey: 'encounter_\uffff'
      });
      const filteredDocs = result.rows
        .map((row: any) => row.doc)
        .filter((doc: any) => doc && doc.resourceType === 'Encounter')
        .filter((doc: any) => {
          return doc.subject?.reference === `Patient/${patientId}` || doc.subject?.reference === patientId;
        });
      return filteredDocs.map((doc: any) => ({
        ...doc,
        _id: undefined,
        _rev: undefined,
      } as Encounter));
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
