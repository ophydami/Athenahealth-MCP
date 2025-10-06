import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const toolDefinitions: Tool[] = [
  {
    name: 'search_patients',
    description: 'Search for patients by name, DOB, phone, or email',
    inputSchema: {
      type: 'object',
      properties: {
        firstname: { type: 'string', description: 'Patient first name' },
        lastname: { type: 'string', description: 'Patient last name' },
        dob: { type: 'string', description: 'Date of birth (YYYY-MM-DD)' },
        phone: { type: 'string', description: 'Phone number' },
        email: { type: 'string', description: 'Email address' },
        limit: { type: 'number', description: 'Maximum number of results', default: 10 },
      },
      required: [],
    },
  },
  {
    name: 'check_drug_interactions',
    description: 'Check for drug interactions for a patient',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient ID' },
        medications: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of medication names or RxNorm codes'
        },
      },
      required: ['patient_id', 'medications'],
    },
  },
  {
    name: 'create_prescription',
    description: 'Create a new prescription for a patient',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient ID' },
        medication_name: { type: 'string', description: 'Medication name' },
        dosage: { type: 'string', description: 'Dosage (e.g., "10mg")' },
        route: { type: 'string', description: 'Route of administration (e.g., "oral")' },
        frequency: { type: 'string', description: 'Frequency (e.g., "twice daily")' },
        quantity: { type: 'string', description: 'Quantity to dispense' },
        refills: { type: 'string', description: 'Number of refills' },
        days_supply: { type: 'string', description: 'Days supply' },
        pharmacy_id: { type: 'string', description: 'Pharmacy ID (optional)' },
        notes: { type: 'string', description: 'Additional notes (optional)' },
      },
      required: ['patient_id', 'medication_name', 'dosage', 'route', 'frequency', 'quantity', 'refills', 'days_supply'],
    },
  },
  {
    name: 'create_appointment',
    description: 'Create a new appointment for a patient',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient ID' },
        provider_id: { type: 'string', description: 'Provider ID' },
        department_id: { type: 'string', description: 'Department ID' },
        appointment_type: { type: 'string', description: 'Appointment type' },
        date: { type: 'string', description: 'Appointment date (YYYY-MM-DD)' },
        start_time: { type: 'string', description: 'Start time (HH:MM)' },
        duration: { type: 'string', description: 'Duration in minutes (optional)' },
        reason: { type: 'string', description: 'Reason for visit (optional)' },
        notes: { type: 'string', description: 'Appointment notes (optional)' },
      },
      required: ['patient_id', 'provider_id', 'department_id', 'appointment_type', 'date', 'start_time'],
    },
  },
  {
    name: 'acknowledge_alert',
    description: 'Acknowledge a clinical alert',
    inputSchema: {
      type: 'object',
      properties: {
        alert_id: { type: 'string', description: 'Alert ID' },
        acknowledged_by: { type: 'string', description: 'User acknowledging the alert' },
      },
      required: ['alert_id', 'acknowledged_by'],
    },
  },
  {
    name: 'get_clinical_summary',
    description: 'Get a comprehensive clinical summary for a patient',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient ID' },
        include_allergies: { type: 'boolean', description: 'Include allergies', default: true },
        include_problems: { type: 'boolean', description: 'Include problems', default: true },
        include_prescriptions: { type: 'boolean', description: 'Include prescriptions', default: true },
        include_vitals: { type: 'boolean', description: 'Include vitals', default: true },
        include_labs: { type: 'boolean', description: 'Include lab results', default: true },
        include_alerts: { type: 'boolean', description: 'Include clinical alerts', default: true },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'list_departments',
    description: 'List all departments in the practice',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_providers',
    description: 'List all healthcare providers in the practice',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of results', default: 50 },
        name: { type: 'string', description: 'Filter by provider name' },
        specialty: { type: 'string', description: 'Filter by specialty' },
      },
      required: [],
    },
  },
  {
    name: 'check_appointment_availability',
    description: 'Check available appointment slots for a department and date range',
    inputSchema: {
      type: 'object',
      properties: {
        department_id: { type: 'string', description: 'Department ID' },
        provider_id: { type: 'string', description: 'Provider ID (optional - leave empty to check all providers)' },
        appointment_type: { type: 'string', description: 'Appointment type (optional)' },
        start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
      required: ['department_id', 'start_date', 'end_date'],
    },
  },
  {
    name: 'create_patient',
    description: 'Register a new patient in the system',
    inputSchema: {
      type: 'object',
      properties: {
        firstname: { type: 'string', description: 'Patient first name' },
        lastname: { type: 'string', description: 'Patient last name' },
        dob: { type: 'string', description: 'Date of birth (MM/DD/YYYY or YYYY-MM-DD)' },
        sex: { type: 'string', description: 'Sex (M or F)' },
        department_id: { type: 'string', description: 'Primary department ID' },
        email: { type: 'string', description: 'Email address (optional)' },
        mobile_phone: { type: 'string', description: 'Mobile phone number (optional)' },
        home_phone: { type: 'string', description: 'Home phone number (optional)' },
        address1: { type: 'string', description: 'Street address (optional)' },
        city: { type: 'string', description: 'City (optional)' },
        state: { type: 'string', description: 'State (optional)' },
        zip: { type: 'string', description: 'ZIP code (optional)' },
        guarantor_firstname: { type: 'string', description: 'Guarantor first name (optional)' },
        guarantor_lastname: { type: 'string', description: 'Guarantor last name (optional)' },
        guarantor_dob: { type: 'string', description: 'Guarantor date of birth (optional)' },
        guarantor_relationship: { type: 'string', description: 'Relationship to patient: 1=Self, 2=Spouse, 3=Child, 4=Other (optional)' },
      },
      required: ['firstname', 'lastname', 'dob', 'sex', 'department_id'],
    },
  },
  {
    name: 'get_patient_encounters',
    description: 'Get all encounters for a patient',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient ID' },
        department_id: { type: 'string', description: 'Filter by department ID (optional)' },
        start_date: { type: 'string', description: 'Start date filter (YYYY-MM-DD) (optional)' },
        end_date: { type: 'string', description: 'End date filter (YYYY-MM-DD) (optional)' },
        status: { type: 'string', description: 'Filter by status: OPEN, CLOSED, SIGNED (optional)' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'get_encounter',
    description: 'Get details of a specific encounter',
    inputSchema: {
      type: 'object',
      properties: {
        encounter_id: { type: 'string', description: 'Encounter ID' },
      },
      required: ['encounter_id'],
    },
  },
  {
    name: 'create_encounter',
    description: 'Create a new encounter for a patient',
    inputSchema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient ID' },
        department_id: { type: 'string', description: 'Department ID' },
        provider_id: { type: 'string', description: 'Provider ID (optional)' },
        encounter_date: { type: 'string', description: 'Encounter date (YYYY-MM-DD)' },
        encounter_type: { type: 'string', description: 'Type of encounter (optional)' },
        chief_complaint: { type: 'string', description: 'Chief complaint (optional)' },
        appointment_id: { type: 'string', description: 'Associated appointment ID (optional)' },
      },
      required: ['patient_id', 'department_id', 'encounter_date'],
    },
  },
  {
    name: 'update_encounter',
    description: 'Update an existing encounter',
    inputSchema: {
      type: 'object',
      properties: {
        encounter_id: { type: 'string', description: 'Encounter ID' },
        chief_complaint: { type: 'string', description: 'Chief complaint (optional)' },
        diagnosis_codes: { type: 'string', description: 'Comma-separated ICD-10 diagnosis codes (optional)' },
        procedure_codes: { type: 'string', description: 'Comma-separated CPT procedure codes (optional)' },
        status: { type: 'string', description: 'Status: OPEN, CLOSED, SIGNED (optional)' },
      },
      required: ['encounter_id'],
    },
  },
];
