import { z } from 'zod';

// Base types for athenahealth API responses
export interface AthenaHealthResponse<T = unknown> {
  data: T;
  totalcount?: number;
  next?: string;
  previous?: string;
}

export interface AthenaHealthError {
  error: string;
  message: string;
  detailcode?: string;
  details?: Record<string, unknown>;
  response?: any;
  status?: number;
}

// Patient-related types
export const PatientSchema = z.object({
  patientid: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  dob: z.string(),
  sex: z.enum(['M', 'F']),
  email: z.string().email().optional(),
  homephone: z.string().optional(),
  mobilephone: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  maritalstatus: z.string().optional(),
  race: z.string().optional(),
  ethnicity: z.string().optional(),
  language: z.string().optional(),
  emergencycontactname: z.string().optional(),
  emergencycontactphone: z.string().optional(),
  primaryproviderid: z.string().optional(),
  departmentid: z.string().optional(),
  registrationdate: z.string().optional(),
  lastappointment: z.string().optional(),
  balances: z.array(z.object({
    balance: z.string(),
    departmentid: z.string(),
    cleanbalance: z.boolean().optional(),
  })).optional(),
});

export type Patient = z.infer<typeof PatientSchema>;

// Clinical data types
export const AllergySchema = z.object({
  allergyid: z.string(),
  patientid: z.string(),
  allergenname: z.string(),
  reactions: z.array(z.string()).optional(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
  onset: z.string().optional(),
  note: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  lastmodified: z.string().optional(),
});

export type Allergy = z.infer<typeof AllergySchema>;

export const ProblemSchema = z.object({
  problemid: z.string(),
  patientid: z.string(),
  problemname: z.string(),
  icd10code: z.string().optional(),
  icd9code: z.string().optional(),
  snomedcode: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'RESOLVED']).optional(),
  onset: z.string().optional(),
  lastmodified: z.string().optional(),
  note: z.string().optional(),
});

export type Problem = z.infer<typeof ProblemSchema>;

export const VitalSignsSchema = z.object({
  patientid: z.string(),
  date: z.string(),
  temperature: z.string().optional(),
  temperatureunit: z.enum(['F', 'C']).optional(),
  weight: z.string().optional(),
  weightunit: z.enum(['lbs', 'kg']).optional(),
  height: z.string().optional(),
  heightunit: z.enum(['in', 'cm']).optional(),
  bmi: z.string().optional(),
  systolicbp: z.string().optional(),
  diastolicbp: z.string().optional(),
  pulse: z.string().optional(),
  respirations: z.string().optional(),
  oxygensat: z.string().optional(),
  smokingstatus: z.string().optional(),
});

export type VitalSigns = z.infer<typeof VitalSignsSchema>;

// Prescription-related types
export const PrescriptionSchema = z.object({
  prescriptionid: z.string(),
  patientid: z.string(),
  medicationname: z.string(),
  genericname: z.string().optional(),
  dosage: z.string().optional(),
  route: z.string().optional(),
  frequency: z.string().optional(),
  quantity: z.string().optional(),
  refills: z.string().optional(),
  daysupply: z.string().optional(),
  ndc: z.string().optional(),
  rxnorm: z.string().optional(),
  providerid: z.string().optional(),
  prescribeddate: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
  pharmacy: z.object({
    pharmacyid: z.string(),
    pharmacyname: z.string(),
    address: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  interactions: z.array(z.object({
    interactionid: z.string(),
    severity: z.enum(['MINOR', 'MODERATE', 'MAJOR']),
    description: z.string(),
    interactingmedication: z.string().optional(),
  })).optional(),
});

export type Prescription = z.infer<typeof PrescriptionSchema>;

// Provider and practice types
export const ProviderSchema = z.object({
  providerid: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  middlename: z.string().optional(),
  suffix: z.string().optional(),
  credentials: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  npi: z.string().optional(),
  licensenumber: z.string().optional(),
  specialty: z.string().optional(),
  subspecialty: z.string().optional(),
  acceptingnewpatients: z.boolean().optional(),
  directaddress: z.string().optional(),
  entitytype: z.enum(['PERSON', 'NON-PERSON']).optional(),
  ansinamecode: z.string().optional(),
  ansispecialtycode: z.string().optional(),
  billable: z.boolean().optional(),
  schedulable: z.boolean().optional(),
  displayname: z.string().optional(),
});

export type Provider = z.infer<typeof ProviderSchema>;

export const DepartmentSchema = z.object({
  departmentid: z.string(),
  name: z.string(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  timezonename: z.string().optional(),
  facilitytypecode: z.string().optional(),
  placeofservicetypecode: z.string().optional(),
  defaultappointmentlength: z.string().optional(),
  providers: z.array(z.string()).optional(),
});

export type Department = z.infer<typeof DepartmentSchema>;

// Appointment types
export const AppointmentSchema = z.object({
  appointmentid: z.string(),
  patientid: z.string(),
  providerid: z.string(),
  departmentid: z.string(),
  appointmenttype: z.string().optional(),
  appointmenttypeid: z.string().optional(),
  date: z.string(),
  starttime: z.string(),
  duration: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'CANCELLED', 'NO_SHOW']).optional(),
  appointmentnotes: z.string().optional(),
  reasonforvisit: z.string().optional(),
  copay: z.string().optional(),
  appointmentconfirmationcode: z.string().optional(),
  lastmodified: z.string().optional(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

// Lab and diagnostic types
export const LabResultSchema = z.object({
  labresultid: z.string(),
  patientid: z.string(),
  resultdate: z.string(),
  collectiondate: z.string().optional(),
  labname: z.string(),
  testname: z.string(),
  testcode: z.string().optional(),
  loinccode: z.string().optional(),
  result: z.string(),
  units: z.string().optional(),
  referencerange: z.string().optional(),
  abnormalflag: z.enum(['HIGH', 'LOW', 'CRITICAL_HIGH', 'CRITICAL_LOW', 'ABNORMAL']).optional(),
  status: z.enum(['FINAL', 'PRELIMINARY', 'CORRECTED', 'CANCELLED']).optional(),
  note: z.string().optional(),
  orderingprovider: z.string().optional(),
});

export type LabResult = z.infer<typeof LabResultSchema>;

// Insurance and billing types
export const InsuranceSchema = z.object({
  insuranceid: z.string(),
  patientid: z.string(),
  rank: z.enum(['1', '2', '3']),
  insurancetype: z.string(),
  planname: z.string(),
  membernumber: z.string(),
  groupnumber: z.string().optional(),
  eligibilitydate: z.string().optional(),
  expirationdate: z.string().optional(),
  copay: z.string().optional(),
  deductible: z.string().optional(),
  subscriberfirstname: z.string().optional(),
  subscriberlastname: z.string().optional(),
  subscriberdob: z.string().optional(),
  relationship: z.string().optional(),
  active: z.boolean().optional(),
});

export type Insurance = z.infer<typeof InsuranceSchema>;

// Clinical decision support types
export const ClinicalAlertSchema = z.object({
  alertid: z.string(),
  patientid: z.string(),
  alerttype: z.enum(['ALLERGY', 'DRUG_INTERACTION', 'DUPLICATE_THERAPY', 'CONTRAINDICATION', 'CLINICAL_GUIDELINE']),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  title: z.string(),
  description: z.string(),
  recommendation: z.string().optional(),
  source: z.string().optional(),
  created: z.string(),
  acknowledged: z.boolean().optional(),
  acknowledgedby: z.string().optional(),
  acknowledgeddate: z.string().optional(),
  relatedmedications: z.array(z.string()).optional(),
  relatedrxnorm: z.array(z.string()).optional(),
});

export type ClinicalAlert = z.infer<typeof ClinicalAlertSchema>;

// Encounter types
export const EncounterSchema = z.object({
  encounterid: z.string(),
  patientid: z.string(),
  departmentid: z.string(),
  providerid: z.string().optional(),
  encounterdate: z.string(),
  encountertype: z.string().optional(),
  chiefcomplaint: z.string().optional(),
  diagnosiscodes: z.array(z.object({
    code: z.string(),
    description: z.string().optional(),
    codingsystem: z.string().optional(), // ICD-10, SNOMED, etc.
  })).optional(),
  procedurecodes: z.array(z.object({
    code: z.string(),
    description: z.string().optional(),
    codingsystem: z.string().optional(), // CPT, HCPCS, etc.
  })).optional(),
  status: z.enum(['OPEN', 'CLOSED', 'SIGNED']).optional(),
  visittype: z.string().optional(),
  appointmentid: z.string().optional(),
  lastmodified: z.string().optional(),
});

export type Encounter = z.infer<typeof EncounterSchema>;

// Authentication types
export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface AuthConfig {
  client_id: string;
  client_secret: string;
  base_url: string;
  version: string;
  practice_id: string;
} 