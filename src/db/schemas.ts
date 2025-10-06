// FHIR-compliant schemas for RxDB
export const patientSchema = {
  title: 'Patient schema',
  version: 0,
  description: 'FHIR Patient resource schema',
  type: 'object',
  properties: {
    resourceType: {
      type: 'string',
      enum: ['Patient'],
    },
    id: {
      type: 'string',
      primary: true,
    },
    name: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          family: { type: 'string' },
          given: { type: 'array', items: { type: 'string' } },
          use: { type: 'string', enum: ['usual', 'official', 'temp', 'nickname', 'anonymous', 'old', 'maiden'] },
        },
      },
    },
    gender: { 
      type: 'string', 
      enum: ['male', 'female', 'other', 'unknown'] 
    },
    birthDate: { 
      type: 'string', 
      format: 'date' 
    },
    contact: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          system: { type: 'string', enum: ['phone', 'email', 'fax', 'pager', 'other'] },
          value: { type: 'string' },
          use: { type: 'string', enum: ['home', 'work', 'temp', 'old', 'mobile'] },
        },
      },
    },
    address: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          use: { type: 'string', enum: ['home', 'work', 'temp', 'old'] },
          line: { type: 'array', items: { type: 'string' } },
          city: { type: 'string' },
          state: { type: 'string' },
          postalCode: { type: 'string' },
          country: { type: 'string' },
        },
      },
    },
    active: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['resourceType', 'id', 'name', 'gender', 'birthDate'],
};

export const immunizationSchema = {
  title: 'Immunization schema',
  version: 0,
  description: 'FHIR Immunization resource schema',
  type: 'object',
  properties: {
    resourceType: {
      type: 'string',
      enum: ['Immunization'],
    },
    id: {
      type: 'string',
      primary: true,
    },
    status: {
      type: 'string',
      enum: ['completed', 'entered-in-error', 'not-done'],
    },
    vaccineCode: {
      type: 'object',
      properties: {
        coding: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              code: { type: 'string' },
              display: { type: 'string' },
            },
          },
        },
      },
    },
    patient: {
      type: 'object',
      properties: {
        reference: { type: 'string' },
        display: { type: 'string' },
      },
    },
    encounter: {
      type: 'object',
      properties: {
        reference: { type: 'string' },
        display: { type: 'string' },
      },
    },
    occurrenceDateTime: { 
      type: 'string', 
      format: 'date-time' 
    },
    performer: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          actor: {
            type: 'object',
            properties: {
              reference: { type: 'string' },
              display: { type: 'string' },
            },
          },
        },
      },
    },
    location: {
      type: 'object',
      properties: {
        reference: { type: 'string' },
        display: { type: 'string' },
      },
    },
    lotNumber: { type: 'string' },
    expirationDate: { type: 'string', format: 'date' },
    manufacturer: {
      type: 'object',
      properties: {
        display: { type: 'string' },
      },
    },
    site: {
      type: 'object',
      properties: {
        coding: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              code: { type: 'string' },
              display: { type: 'string' },
            },
          },
        },
      },
    },
    route: {
      type: 'object',
      properties: {
        coding: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              code: { type: 'string' },
              display: { type: 'string' },
            },
          },
        },
      },
    },
    doseQuantity: {
      type: 'object',
      properties: {
        value: { type: 'number' },
        unit: { type: 'string' },
      },
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['resourceType', 'id', 'status', 'vaccineCode', 'patient', 'occurrenceDateTime'],
};

export const practitionerSchema = {
  title: 'Practitioner schema',
  version: 0,
  description: 'FHIR Practitioner resource schema',
  type: 'object',
  properties: {
    resourceType: {
      type: 'string',
      enum: ['Practitioner'],
    },
    id: {
      type: 'string',
      primary: true,
    },
    name: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          family: { type: 'string' },
          given: { type: 'array', items: { type: 'string' } },
          use: { type: 'string', enum: ['usual', 'official', 'temp', 'nickname', 'anonymous', 'old', 'maiden'] },
        },
      },
    },
    identifier: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          system: { type: 'string' },
          value: { type: 'string' },
          use: { type: 'string', enum: ['usual', 'official', 'temp', 'secondary'] },
        },
      },
    },
    telecom: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          system: { type: 'string', enum: ['phone', 'email', 'fax', 'pager', 'other'] },
          value: { type: 'string' },
          use: { type: 'string', enum: ['home', 'work', 'temp', 'old', 'mobile'] },
        },
      },
    },
    gender: { 
      type: 'string', 
      enum: ['male', 'female', 'other', 'unknown'] 
    },
    birthDate: { 
      type: 'string', 
      format: 'date' 
    },
    active: { type: 'boolean' },
    role: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          coding: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                system: { type: 'string' },
                code: { type: 'string' },
                display: { type: 'string' },
              },
            },
          },
        },
      },
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['resourceType', 'id', 'name'],
};

export const organizationSchema = {
  title: 'Organization schema',
  version: 0,
  description: 'FHIR Organization resource schema',
  type: 'object',
  properties: {
    resourceType: {
      type: 'string',
      enum: ['Organization'],
    },
    id: {
      type: 'string',
      primary: true,
    },
    name: { type: 'string' },
    identifier: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          system: { type: 'string' },
          value: { type: 'string' },
          use: { type: 'string', enum: ['usual', 'official', 'temp', 'secondary'] },
        },
      },
    },
    type: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          coding: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                system: { type: 'string' },
                code: { type: 'string' },
                display: { type: 'string' },
              },
            },
          },
        },
      },
    },
    address: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          use: { type: 'string', enum: ['home', 'work', 'temp', 'old'] },
          line: { type: 'array', items: { type: 'string' } },
          city: { type: 'string' },
          state: { type: 'string' },
          postalCode: { type: 'string' },
          country: { type: 'string' },
        },
      },
    },
    telecom: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          system: { type: 'string', enum: ['phone', 'email', 'fax', 'pager', 'other'] },
          value: { type: 'string' },
          use: { type: 'string', enum: ['home', 'work', 'temp', 'old', 'mobile'] },
        },
      },
    },
    active: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['resourceType', 'id', 'name'],
};

export const encounterSchema = {
  title: 'Encounter schema',
  version: 0,
  description: 'FHIR Encounter resource schema',
  type: 'object',
  properties: {
    resourceType: {
      type: 'string',
      enum: ['Encounter'],
    },
    id: {
      type: 'string',
      primary: true,
    },
    status: {
      type: 'string',
      enum: ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled'],
    },
    class: {
      type: 'object',
      properties: {
        system: { type: 'string' },
        code: { type: 'string' },
        display: { type: 'string' },
      },
    },
    type: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          coding: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                system: { type: 'string' },
                code: { type: 'string' },
                display: { type: 'string' },
              },
            },
          },
        },
      },
    },
    subject: {
      type: 'object',
      properties: {
        reference: { type: 'string' },
        display: { type: 'string' },
      },
    },
    participant: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                coding: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      system: { type: 'string' },
                      code: { type: 'string' },
                      display: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          individual: {
            type: 'object',
            properties: {
              reference: { type: 'string' },
              display: { type: 'string' },
            },
          },
        },
      },
    },
    location: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          location: {
            type: 'object',
            properties: {
              reference: { type: 'string' },
              display: { type: 'string' },
            },
          },
        },
      },
    },
    period: {
      type: 'object',
      properties: {
        start: { type: 'string' },
        end: { type: 'string' },
      },
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['resourceType', 'id', 'status', 'class', 'subject'],
};

export const medicationSchema = {
  title: 'Medication schema',
  version: 0,
  description: 'FHIR Medication resource schema',
  type: 'object',
  properties: {
    resourceType: {
      type: 'string',
      enum: ['Medication'],
    },
    id: {
      type: 'string',
      primary: true,
    },
    code: {
      type: 'object',
      properties: {
        coding: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              code: { type: 'string' },
              display: { type: 'string' },
            },
          },
        },
      },
    },
    manufacturer: {
      type: 'object',
      properties: {
        display: { type: 'string' },
      },
    },
    form: {
      type: 'object',
      properties: {
        coding: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              code: { type: 'string' },
              display: { type: 'string' },
            },
          },
        },
      },
    },
    ingredient: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          itemCodeableConcept: {
            type: 'object',
            properties: {
              coding: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    system: { type: 'string' },
                    code: { type: 'string' },
                    display: { type: 'string' },
                  },
                },
              },
            },
          },
          strength: {
            type: 'object',
            properties: {
              numerator: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
              },
              denominator: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['resourceType', 'id', 'code'],
};

export const medicationAdministrationSchema = {
  title: 'MedicationAdministration schema',
  version: 0,
  description: 'FHIR MedicationAdministration resource schema',
  type: 'object',
  properties: {
    resourceType: {
      type: 'string',
      enum: ['MedicationAdministration'],
    },
    id: {
      type: 'string',
      primary: true,
    },
    status: {
      type: 'string',
      enum: ['in-progress', 'not-done', 'on-hold', 'completed', 'entered-in-error', 'stopped', 'unknown'],
    },
    medicationCodeableConcept: {
      type: 'object',
      properties: {
        coding: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              code: { type: 'string' },
              display: { type: 'string' },
            },
          },
        },
      },
    },
    subject: {
      type: 'object',
      properties: {
        reference: { type: 'string' },
        display: { type: 'string' },
      },
    },
    encounter: {
      type: 'object',
      properties: {
        reference: { type: 'string' },
        display: { type: 'string' },
      },
    },
    performer: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          actor: {
            type: 'object',
            properties: {
              reference: { type: 'string' },
              display: { type: 'string' },
            },
          },
        },
      },
    },
    effectiveDateTime: { type: 'string', format: 'date-time' },
    dosage: {
      type: 'object',
      properties: {
        route: {
          type: 'object',
          properties: {
            coding: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  system: { type: 'string' },
                  code: { type: 'string' },
                  display: { type: 'string' },
                },
              },
            },
          },
        },
        dose: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            unit: { type: 'string' },
          },
        },
        site: {
          type: 'object',
          properties: {
            coding: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  system: { type: 'string' },
                  code: { type: 'string' },
                  display: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['resourceType', 'id', 'status', 'medicationCodeableConcept', 'subject'],
};
