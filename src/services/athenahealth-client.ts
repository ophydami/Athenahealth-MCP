import { AuthConfig } from '../types/athenahealth.js';
import { BaseAthenaClient } from './base-client.js';
import { PatientService } from './patient-service.js';
import { ClinicalService } from './clinical-service.js';
import { EncounterService } from './encounter-service.js';
import { SchedulingService } from './scheduling-service.js';

/**
 * Unified AthenaHealth API Client
 * Combines all service modules into a single interface
 */
export class AthenaHealthClient {
  private base: BaseAthenaClient;
  private patients: PatientService;
  private clinical: ClinicalService;
  private encounters: EncounterService;
  private scheduling: SchedulingService;

  constructor(config: AuthConfig) {
    this.base = new BaseAthenaClient(config);
    this.patients = new PatientService(config);
    this.clinical = new ClinicalService(config);
    this.encounters = new EncounterService(config);
    this.scheduling = new SchedulingService(config);
  }

  // Health check
  async healthCheck() {
    return this.base.healthCheck();
  }

  // Patient methods
  async searchPatients(...args: Parameters<PatientService['searchPatients']>) {
    return this.patients.searchPatients(...args);
  }

  async getPatient(...args: Parameters<PatientService['getPatient']>) {
    return this.patients.getPatient(...args);
  }

  async createPatient(...args: Parameters<PatientService['createPatient']>) {
    return this.patients.createPatient(...args);
  }

  // Clinical methods
  async getPatientAllergies(...args: Parameters<ClinicalService['getPatientAllergies']>) {
    return this.clinical.getPatientAllergies(...args);
  }

  async getPatientProblems(...args: Parameters<ClinicalService['getPatientProblems']>) {
    return this.clinical.getPatientProblems(...args);
  }

  async getPatientPrescriptions(...args: Parameters<ClinicalService['getPatientPrescriptions']>) {
    return this.clinical.getPatientPrescriptions(...args);
  }

  async createPrescription(...args: Parameters<ClinicalService['createPrescription']>) {
    return this.clinical.createPrescription(...args);
  }

  async getPatientVitals(...args: Parameters<ClinicalService['getPatientVitals']>) {
    return this.clinical.getPatientVitals(...args);
  }

  async getPatientLabResults(...args: Parameters<ClinicalService['getPatientLabResults']>) {
    return this.clinical.getPatientLabResults(...args);
  }

  async getClinicalAlerts(...args: Parameters<ClinicalService['getClinicalAlerts']>) {
    return this.clinical.getClinicalAlerts(...args);
  }

  async acknowledgeAlert(...args: Parameters<ClinicalService['acknowledgeAlert']>) {
    return this.clinical.acknowledgeAlert(...args);
  }

  async checkDrugInteractions(...args: Parameters<ClinicalService['checkDrugInteractions']>) {
    return this.clinical.checkDrugInteractions(...args);
  }

  // Encounter methods
  async getPatientEncounters(...args: Parameters<EncounterService['getPatientEncounters']>) {
    return this.encounters.getPatientEncounters(...args);
  }

  async getEncounter(...args: Parameters<EncounterService['getEncounter']>) {
    return this.encounters.getEncounter(...args);
  }

  async createEncounter(...args: Parameters<EncounterService['createEncounter']>) {
    return this.encounters.createEncounter(...args);
  }

  async updateEncounter(...args: Parameters<EncounterService['updateEncounter']>) {
    return this.encounters.updateEncounter(...args);
  }

  // Scheduling methods
  async getProviders(...args: Parameters<SchedulingService['getProviders']>) {
    return this.scheduling.getProviders(...args);
  }

  async getProvider(...args: Parameters<SchedulingService['getProvider']>) {
    return this.scheduling.getProvider(...args);
  }

  async getDepartments(...args: Parameters<SchedulingService['getDepartments']>) {
    return this.scheduling.getDepartments(...args);
  }

  async getDepartment(...args: Parameters<SchedulingService['getDepartment']>) {
    return this.scheduling.getDepartment(...args);
  }

  async getAppointmentAvailability(...args: Parameters<SchedulingService['getAppointmentAvailability']>) {
    return this.scheduling.getAppointmentAvailability(...args);
  }

  async createAppointment(...args: Parameters<SchedulingService['createAppointment']>) {
    return this.scheduling.createAppointment(...args);
  }
}
