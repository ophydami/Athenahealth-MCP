import { BaseAthenaClient } from './base-client.js';
import { Patient, AthenaHealthResponse } from '../types/athenahealth.js';

export class PatientService extends BaseAthenaClient {
  async searchPatients(params: {
    firstname?: string;
    lastname?: string;
    dob?: string;
    phone?: string;
    email?: string;
    limit?: number;
  }): Promise<Patient[]> {
    try {
      const queryParams: any = {};

      if (params.firstname) queryParams.firstname = params.firstname;
      if (params.lastname) queryParams.lastname = params.lastname;
      if (params.dob) queryParams.dob = params.dob;
      if (params.phone) queryParams.phone = params.phone;
      if (params.email) queryParams.email = params.email;
      if (params.limit) queryParams.limit = params.limit;

      const response = await this.makeRequest<any>(
        `${this.config.practice_id}/patients`,
        {
          method: 'GET',
          params: queryParams,
        }
      );

      if (response.patients && Array.isArray(response.patients)) {
        return response.patients;
      }

      if (Array.isArray(response)) {
        return response;
      }

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      console.error('Unexpected patients response structure, returning empty array');
      return [];
    } catch (error: any) {
      console.error('Search patients error:', error.message);
      throw error;
    }
  }

  async getPatient(patientId: string): Promise<Patient> {
    const response = await this.makeRequest<AthenaHealthResponse<Patient>>(
      `${this.config.practice_id}/patients/${patientId}`
    );

    if (response.data) {
      return response.data;
    }

    return response as any;
  }

  async createPatient(patientData: {
    firstname: string;
    lastname: string;
    dob: string;
    sex: string;
    departmentid: string;
    email?: string;
    mobilephone?: string;
    homephone?: string;
    address1?: string;
    city?: string;
    state?: string;
    zip?: string;
    guarantorfirstname?: string;
    guarantorlastname?: string;
    guarantordob?: string;
    guarantorrelationshiptopatient?: string;
  }): Promise<any> {
    try {
      console.error('Creating patient with data:', JSON.stringify(patientData, null, 2));

      const formData = new URLSearchParams();
      Object.entries(patientData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      console.error('Form data:', formData.toString());

      const response = await this.makeRequest<any>(
        `${this.config.practice_id}/patients`,
        {
          method: 'POST',
          data: formData.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      console.error('Create patient response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error('Create patient error:', error.message);
      console.error('Error response:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }
}
