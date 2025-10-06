import { BaseAthenaClient } from './base-client.js';
import {
  Provider,
  Department,
  Appointment,
  AthenaHealthResponse,
} from '../types/athenahealth.js';

export class SchedulingService extends BaseAthenaClient {
  // Provider methods
  async getProviders(params?: {
    limit?: number;
    offset?: number;
    name?: string;
    specialty?: string;
  }): Promise<Provider[]> {
    try {
      const response = await this.makeRequest<any>(
        `${this.config.practice_id}/providers`,
        {
          method: 'GET',
          params,
        }
      );
      console.error('Providers response:', JSON.stringify(response, null, 2));

      if (response.providers && Array.isArray(response.providers)) {
        return response.providers;
      }

      if (Array.isArray(response)) {
        return response;
      }

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      console.error('Unexpected providers response structure, returning empty array');
      return [];
    } catch (error: any) {
      console.error('Get providers error:', error.message);
      throw error;
    }
  }

  async getProvider(providerId: string): Promise<Provider> {
    const response = await this.makeRequest<AthenaHealthResponse<Provider>>(
      `${this.config.practice_id}/providers/${providerId}`
    );
    return response.data;
  }

  // Department methods
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await this.makeRequest<any>(
        `${this.config.practice_id}/departments`
      );
      console.error('Departments response:', JSON.stringify(response, null, 2));

      if (response.departments && Array.isArray(response.departments)) {
        return response.departments;
      }

      if (Array.isArray(response)) {
        return response;
      }

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      console.error('Unexpected departments response structure, returning empty array');
      return [];
    } catch (error: any) {
      console.error('Get departments error:', error.message);
      throw error;
    }
  }

  async getDepartment(departmentId: string): Promise<Department> {
    const response = await this.makeRequest<AthenaHealthResponse<Department>>(
      `${this.config.practice_id}/departments/${departmentId}`
    );
    return response.data;
  }

  // Appointment methods
  async getAppointmentAvailability(params: {
    departmentid: string;
    startdate: string;
    enddate: string;
    providerid?: string;
    appointmenttype?: string;
  }): Promise<any[]> {
    try {
      const response = await this.makeRequest<any>(
        `${this.config.practice_id}/appointments/open`,
        {
          method: 'GET',
          params,
        }
      );

      if (response.appointments && Array.isArray(response.appointments)) {
        return response.appointments;
      }

      if (Array.isArray(response)) {
        return response;
      }

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error: any) {
      console.error('Get appointment availability error:', error.message);
      throw error;
    }
  }

  async createAppointment(appointment: {
    patientid: string;
    providerid: string;
    departmentid: string;
    appointmenttype: string;
    date: string;
    starttime: string;
    duration?: string;
    reasonforvisit?: string;
    appointmentnotes?: string;
  }): Promise<Appointment> {
    const formData = new URLSearchParams();
    Object.entries(appointment).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await this.makeRequest<AthenaHealthResponse<Appointment>>(
      `${this.config.practice_id}/appointments`,
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
