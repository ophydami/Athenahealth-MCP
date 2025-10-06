import { BaseAthenaClient } from './base-client.js';
import {
  Allergy,
  Problem,
  Prescription,
  VitalSigns,
  LabResult,
  ClinicalAlert,
  AthenaHealthResponse,
} from '../types/athenahealth.js';

export class ClinicalService extends BaseAthenaClient {
  // Allergy methods
  async getPatientAllergies(patientId: string): Promise<Allergy[]> {
    const response = await this.makeRequest<AthenaHealthResponse<Allergy[]>>(
      `${this.config.practice_id}/patients/${patientId}/allergies`
    );
    return response.data;
  }

  // Problem methods
  async getPatientProblems(patientId: string): Promise<Problem[]> {
    const response = await this.makeRequest<AthenaHealthResponse<Problem[]>>(
      `${this.config.practice_id}/patients/${patientId}/problems`
    );
    return response.data;
  }

  // Prescription methods
  async getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
    const response = await this.makeRequest<AthenaHealthResponse<Prescription[]>>(
      `${this.config.practice_id}/patients/${patientId}/prescriptions`
    );
    return response.data;
  }

  async createPrescription(patientId: string, prescription: {
    medicationname: string;
    dosage: string;
    route: string;
    frequency: string;
    quantity: string;
    refills: string;
    daysupply: string;
    pharmacyid?: string;
    notes?: string;
  }): Promise<Prescription> {
    const formData = new URLSearchParams();
    Object.entries(prescription).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await this.makeRequest<AthenaHealthResponse<Prescription>>(
      `${this.config.practice_id}/patients/${patientId}/prescriptions`,
      {
        method: 'POST',
        data: formData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  }

  // Vital Signs methods
  async getPatientVitals(patientId: string, params?: {
    startdate?: string;
    enddate?: string;
  }): Promise<VitalSigns[]> {
    const response = await this.makeRequest<AthenaHealthResponse<VitalSigns[]>>(
      `${this.config.practice_id}/patients/${patientId}/vitals`,
      {
        method: 'GET',
        params,
      }
    );
    return response.data;
  }

  // Lab Results methods
  async getPatientLabResults(patientId: string, params?: {
    startdate?: string;
    enddate?: string;
    labresultid?: string;
  }): Promise<LabResult[]> {
    const response = await this.makeRequest<AthenaHealthResponse<LabResult[]>>(
      `${this.config.practice_id}/patients/${patientId}/labs`,
      {
        method: 'GET',
        params,
      }
    );
    return response.data;
  }

  // Clinical Alerts methods
  async getClinicalAlerts(patientId: string, params?: {
    alerttype?: string;
    severity?: string;
    acknowledged?: boolean;
  }): Promise<ClinicalAlert[]> {
    const response = await this.makeRequest<AthenaHealthResponse<ClinicalAlert[]>>(
      `${this.config.practice_id}/patients/${patientId}/clinicalalerts`,
      {
        method: 'GET',
        params,
      }
    );
    return response.data;
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const formData = new URLSearchParams();
    formData.append('acknowledgedby', acknowledgedBy);

    await this.makeRequest(
      `${this.config.practice_id}/clinicalalerts/${alertId}/acknowledge`,
      {
        method: 'POST',
        data: formData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  }

  // Drug Interactions
  async checkDrugInteractions(patientId: string, medications: string[]): Promise<ClinicalAlert[]> {
    const formData = new URLSearchParams();
    medications.forEach((med, index) => {
      formData.append(`medications[${index}]`, med);
    });

    const response = await this.makeRequest<AthenaHealthResponse<ClinicalAlert[]>>(
      `${this.config.practice_id}/patients/${patientId}/druginteractions`,
      {
        method: 'POST',
        data: formData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  }
}
