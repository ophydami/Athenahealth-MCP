import { BaseAthenaClient } from './base-client.js';
import { Encounter, AthenaHealthResponse } from '../types/athenahealth.js';

export class EncounterService extends BaseAthenaClient {
  async getPatientEncounters(patientId: string, params?: {
    departmentid?: string;
    startdate?: string;
    enddate?: string;
    status?: string;
  }): Promise<Encounter[]> {
    const response = await this.makeRequest<any>(
      `${this.config.practice_id}/patients/${patientId}/encounters`,
      {
        method: 'GET',
        params,
      }
    );

    // Handle different response structures
    if (response.encounters && Array.isArray(response.encounters)) {
      return response.encounters;
    }
    if (Array.isArray(response)) {
      return response;
    }
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  async getEncounter(encounterId: string): Promise<Encounter> {
    const response = await this.makeRequest<AthenaHealthResponse<Encounter>>(
      `${this.config.practice_id}/encounters/${encounterId}`
    );
    return response.data || response;
  }

  async createEncounter(encounterData: {
    patientid: string;
    departmentid: string;
    providerid?: string;
    encounterdate: string;
    encountertype?: string;
    chiefcomplaint?: string;
    appointmentid?: string;
  }): Promise<Encounter> {
    const formData = new URLSearchParams();
    Object.entries(encounterData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await this.makeRequest<AthenaHealthResponse<Encounter>>(
      `${this.config.practice_id}/encounters`,
      {
        method: 'POST',
        data: formData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data || response;
  }

  async updateEncounter(encounterId: string, encounterData: {
    chiefcomplaint?: string;
    diagnosiscodes?: string;
    procedurecodes?: string;
    status?: string;
  }): Promise<Encounter> {
    const formData = new URLSearchParams();
    Object.entries(encounterData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await this.makeRequest<AthenaHealthResponse<Encounter>>(
      `${this.config.practice_id}/encounters/${encounterId}`,
      {
        method: 'PUT',
        data: formData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data || response;
  }
}
