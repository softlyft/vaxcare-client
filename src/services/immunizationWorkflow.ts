import { useAuthStore, User } from '@/store/auth';
import { getDatabase } from '@/db/database';

// Define types locally to avoid circular dependencies
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
  encounter?: {
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
  manufacturer?: {
    display: string;
  };
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
  doseQuantity: {
    value: number;
    unit: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ImmunizationWorkflowData {
  patientId: string;
  patientName: string;
  vaccineCode: string;
  vaccineDisplay: string;
  lotNumber?: string;
  manufacturer?: string;
  doseQuantity: {
    value: number;
    unit: string;
  };
  site?: string;
  route?: string;
  occurrenceDateTime: string;
  performer?: string;
  location?: string;
}

export interface ImmunizationWorkflowResult {
  encounter: Encounter;
  immunization: Immunization;
  medication?: Medication;
  medicationAdministration?: MedicationAdministration;
}

export class ImmunizationWorkflowService {
  private currentUser: User | null;

  constructor() {
    this.currentUser = useAuthStore.getState().user;
  }

  async executeWorkflow(data: ImmunizationWorkflowData): Promise<ImmunizationWorkflowResult> {
    if (!this.currentUser) {
      throw new Error('No authenticated user found');
    }

    // Step 1: Create Encounter
    const encounter = await this.createEncounter(data);
    
    // Step 2: Create or find Medication (optional)
    const medication = await this.createOrFindMedication(data);
    
    // Step 3: Create Immunization
    const immunization = await this.createImmunization(data, encounter, medication);
    
    // Step 4: Create MedicationAdministration (if medication exists)
    const medicationAdministration = medication 
      ? await this.createMedicationAdministration(data, encounter, medication)
      : undefined;

    return {
      encounter,
      immunization,
      medication,
      medicationAdministration,
    };
  }

  private async createEncounter(data: ImmunizationWorkflowData): Promise<Encounter> {
    const now = (new Date()).toISOString();
    
    const encounterData: Omit<Encounter, 'id' | 'createdAt' | 'updatedAt'> = {
      resourceType: 'Encounter',
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'Ambulatory',
      },
      type: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: '185349003',
          display: 'Immunization visit',
        }],
      }],
      subject: {
        reference: `Patient/${data.patientId}`,
        display: data.patientName,
      },
      participant: [{
        type: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
            code: 'ATND',
            display: 'Attending',
          }],
        }],
        individual: {
          reference: `Practitioner/${this.currentUser.id}`,
          display: this.currentUser.name,
        },
      }],
      location: data.location ? [{
        location: {
          reference: `Location/${data.location}`,
          display: data.location,
        },
      }] : undefined,
      period: {
        start: data.occurrenceDateTime,
        end: data.occurrenceDateTime,
      },
    };

    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');
    
    const encounterNow = (new Date()).toISOString();
    const newEncounter: Encounter = {
      ...encounterData,
      id: `encounter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: encounterNow,
      updatedAt: encounterNow,
    };

    await db.encounters.insert(newEncounter);
    return newEncounter;
  }

  private async createOrFindMedication(data: ImmunizationWorkflowData): Promise<Medication | undefined> {
    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    // Try to find existing medication by vaccine code
    const medicationDocs = await db.medications.find().exec();
    const existingMedication = medicationDocs.find((doc: any) => {
      const medicationData = doc.toJSON ? doc.toJSON() : doc;
      return medicationData.code?.coding?.some((coding: any) => coding.code === data.vaccineCode);
    });

    if (existingMedication) {
      return existingMedication.toJSON ? existingMedication.toJSON() : existingMedication as Medication;
    }

    // Create new medication if not found
    const medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
      resourceType: 'Medication',
      code: {
        coding: [{
          system: 'http://hl7.org/fhir/sid/cvx',
          code: data.vaccineCode,
          display: data.vaccineDisplay,
        }],
      },
      manufacturer: data.manufacturer ? {
        display: data.manufacturer,
      } : undefined,
      form: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '385219001',
          display: 'Injection solution',
        }],
      },
    };

    const medicationNow = (new Date()).toISOString();
    const newMedication: Medication = {
      ...medicationData,
      id: `medication_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: medicationNow,
      updatedAt: medicationNow,
    };

    await db.medications.insert(newMedication);
    return newMedication;
  }

  private async createImmunization(
    data: ImmunizationWorkflowData, 
    encounter: Encounter, 
    medication?: Medication
  ): Promise<Immunization> {
    const immunizationData: Omit<Immunization, 'id' | 'createdAt' | 'updatedAt'> = {
      resourceType: 'Immunization',
      status: 'completed',
      vaccineCode: {
        coding: [{
          system: 'http://hl7.org/fhir/sid/cvx',
          code: data.vaccineCode,
          display: data.vaccineDisplay,
        }],
      },
      patient: {
        reference: `Patient/${data.patientId}`,
        display: data.patientName,
      },
      encounter: {
        reference: `Encounter/${encounter.id}`,
        display: `Immunization visit for ${data.patientName}`,
      },
      occurrenceDateTime: data.occurrenceDateTime,
      performer: [{
        actor: {
          reference: `Practitioner/${this.currentUser!.id}`,
          display: this.currentUser!.name,
        },
      }],
      location: data.location ? {
        reference: `Location/${data.location}`,
        display: data.location,
      } : undefined,
      lotNumber: data.lotNumber,
      manufacturer: data.manufacturer ? {
        display: data.manufacturer,
      } : undefined,
      site: data.site ? {
        coding: [{
          system: 'http://snomed.info/sct',
          code: this.getSiteCode(data.site),
          display: this.getSiteDisplay(data.site),
        }],
      } : undefined,
      route: data.route ? {
        coding: [{
          system: 'http://snomed.info/sct',
          code: this.getRouteCode(data.route),
          display: this.getRouteDisplay(data.route),
        }],
      } : undefined,
      doseQuantity: data.doseQuantity,
    };

    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const immunizationNow = (new Date()).toISOString();
    const newImmunization: Immunization = {
      ...immunizationData,
      id: `immunization_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: immunizationNow,
      updatedAt: immunizationNow,
    };

    await db.immunizations.insert(newImmunization);
    return newImmunization;
  }

  private async createMedicationAdministration(
    data: ImmunizationWorkflowData,
    encounter: Encounter,
    medication: Medication
  ): Promise<MedicationAdministration> {
    const medicationAdministrationData: Omit<MedicationAdministration, 'id' | 'createdAt' | 'updatedAt'> = {
      resourceType: 'MedicationAdministration',
      status: 'completed',
      medicationCodeableConcept: medication.code,
      subject: {
        reference: `Patient/${data.patientId}`,
        display: data.patientName,
      },
      encounter: {
        reference: `Encounter/${encounter.id}`,
        display: `Immunization visit for ${data.patientName}`,
      },
      performer: [{
        actor: {
          reference: `Practitioner/${this.currentUser!.id}`,
          display: this.currentUser!.name,
        },
      }],
      effectiveDateTime: data.occurrenceDateTime,
      dosage: {
        route: data.route ? {
          coding: [{
            system: 'http://snomed.info/sct',
            code: this.getRouteCode(data.route),
            display: this.getRouteDisplay(data.route),
          }],
        } : undefined,
        dose: data.doseQuantity,
        site: data.site ? {
          coding: [{
            system: 'http://snomed.info/sct',
            code: this.getSiteCode(data.site),
            display: this.getSiteDisplay(data.site),
          }],
        } : undefined,
      },
    };

    const db = getDatabase();
    if (!db) throw new Error('Database not initialized');

    const medicationAdminNow = (new Date()).toISOString();
    const newMedicationAdministration: MedicationAdministration = {
      ...medicationAdministrationData,
      id: `medicationAdministration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: medicationAdminNow,
      updatedAt: medicationAdminNow,
    };

    await db.medicationAdministrations.insert(newMedicationAdministration);
    return newMedicationAdministration;
  }

  private getSiteCode(site: string): string {
    const siteMap: Record<string, string> = {
      'LA': '368208006', // Left arm
      'RA': '368209003', // Right arm
      'LL': '368210008', // Left leg
      'RL': '368211007', // Right leg
      'GL': '368212000', // Gluteal
    };
    return siteMap[site] || '368208006';
  }

  private getSiteDisplay(site: string): string {
    const siteMap: Record<string, string> = {
      'LA': 'Left arm',
      'RA': 'Right arm',
      'LL': 'Left leg',
      'RL': 'Right leg',
      'GL': 'Gluteal',
    };
    return siteMap[site] || 'Left arm';
  }

  private getRouteCode(route: string): string {
    const routeMap: Record<string, string> = {
      'IM': '78421000', // Intramuscular
      'SC': '34206000', // Subcutaneous
      'ID': '78430000', // Intradermal
      'PO': '26643006', // Oral
      'IN': '16857009', // Intranasal
    };
    return routeMap[route] || '78421000';
  }

  private getRouteDisplay(route: string): string {
    const routeMap: Record<string, string> = {
      'IM': 'Intramuscular',
      'SC': 'Subcutaneous',
      'ID': 'Intradermal',
      'PO': 'Oral',
      'IN': 'Intranasal',
    };
    return routeMap[route] || 'Intramuscular';
  }
}
