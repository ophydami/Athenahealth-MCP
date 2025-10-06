import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../utils/logger.js';
import {
  AuthTokenResponse,
  AuthConfig,
  AthenaHealthResponse,
  AthenaHealthError,
  Patient,
  Prescription,
  Provider,
  Department,
  Appointment,
  LabResult,
  Allergy,
  Problem,
  VitalSigns,
  ClinicalAlert,
  Insurance
} from '../types/athenahealth.js';

export class AthenaHealthClient {
  private readonly config: AuthConfig;
  private readonly httpClient: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
    // Athena Health API structure: base_url/version/practiceid
    this.httpClient = axios.create({
      baseURL: `${config.base_url}/${config.version}/`,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'athenahealth-mcp-server/1.0.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.httpClient.interceptors.request.use(
      async (config) => {
        await this.ensureValidToken();
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        
        // Log request (sanitized for HIPAA)
        logger.info('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          timestamp: new Date().toISOString(),
          // Don't log sensitive data in headers or params
        });
        
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', { 
          message: error?.message || 'Unknown error'
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        // Log successful responses (sanitized)
        logger.info('API Response', {
          status: response.status,
          url: response.config.url,
          timestamp: new Date().toISOString(),
        });
        return response;
      },
      (error) => {
        // Log errors (sanitized)
        try {
          logger.error('API Error', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message || 'Unknown error',
            timestamp: new Date().toISOString(),
            responseData: error.response?.data,
          });
          // Also log to console for immediate visibility
          if (error.response?.status === 400) {
            console.error('Bad Request Error:', JSON.stringify(error.response?.data, null, 2));
          }
        } catch (logError) {
          // If logging fails, use console.error as fallback
          console.error('Failed to log API error:', error.message || 'Unknown error');
        }
        
        if (error.response?.status === 401) {
          // Token expired, clear it
          this.accessToken = null;
          this.refreshToken = null;
          this.tokenExpiresAt = null;
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async authenticate(): Promise<void> {
    try {
      // Try different OAuth URL patterns
      // First try: Direct OAuth endpoint
      let authUrl = 'https://api.platform.athenahealth.com/oauth2/v1/token';
      
      // If it's sandbox/preview, adjust the URL
      if (this.config.base_url.includes('preview')) {
        authUrl = 'https://api.preview.platform.athenahealth.com/oauth2/v1/token';
      }
      
      console.error('Authenticating to:', authUrl);
      console.error('Client ID:', this.config.client_id);
      
      // Try to get OAuth metadata first
      try {
        const metadataUrl = authUrl.replace('/token', '/.well-known/openid-configuration');
        console.error('Checking OAuth metadata at:', metadataUrl);
        const metadataResponse = await axios.get(metadataUrl);
        console.error('OAuth metadata:', JSON.stringify(metadataResponse.data, null, 2));
      } catch (metaError) {
        console.error('Could not fetch OAuth metadata');
      }
      
      // Try with Basic Auth for client credentials
      const basicAuth = Buffer.from(`${this.config.client_id}:${this.config.client_secret}`).toString('base64');
      
      // Athena Health uses specific scope format
      // Use the correct scope for the sandbox environment
      const scope = 'athena/service/Athenanet.MDP.*';
      
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: scope,
      });
      
      console.error('Trying scope:', scope);
      
      // Log the request for debugging
      console.error('OAuth request params:', params.toString());
      
      const response = await axios.post<AuthTokenResponse>(
        authUrl,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token || null;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);

      logger.info('Authentication successful', {
        expiresIn: response.data.expires_in,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Authentication failed', { 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        response: error.response?.data,
        status: error.response?.status
      });
      console.error('Auth error details:', JSON.stringify(error.response?.data, null, 2));
      throw new Error('Failed to authenticate with athenahealth API');
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt) {
      await this.authenticate();
      return;
    }

    // Check if token expires in the next 5 minutes
    if (this.tokenExpiresAt - Date.now() < 5 * 60 * 1000) {
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        await this.authenticate();
      }
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const authUrl = `${this.config.base_url}/oauth2/${this.config.version}/token`;
      const basicAuth = Buffer.from(`${this.config.client_id}:${this.config.client_secret}`).toString('base64');
      
      const response = await axios.post<AuthTokenResponse>(
        authUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token || this.refreshToken;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);

      logger.info('Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed', { 
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      // Fall back to full authentication
      await this.authenticate();
    }
  }

  // Generic API request method
  private async makeRequest<T>(
    endpoint: string,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.httpClient.request({
        url: endpoint,
        ...config,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const athenaError: AthenaHealthError = {
          error: error.response?.data?.error || 'Unknown error',
          message: error.response?.data?.message || error.message,
          detailcode: error.response?.data?.detailcode,
          details: error.response?.data?.details,
          response: error.response?.data,
          status: error.response?.status,
        };
        throw athenaError;
      }
      throw error;
    }
  }

  // Patient methods
  async getPatient(patientId: string): Promise<Patient> {
    const response = await this.makeRequest<AthenaHealthResponse<Patient>>(
      `${this.config.practice_id}/patients/${patientId}`
    );
    return response.data;
  }

  async searchPatients(params: {
    firstname?: string;
    lastname?: string;
    dob?: string;
    ssn?: string;
    email?: string;
    phone?: string;
    limit?: number;
    offset?: number;
  }): Promise<Patient[]> {
    try {
      console.error('Searching patients with params:', JSON.stringify(params, null, 2));
      const response = await this.makeRequest<any>(
        `${this.config.practice_id}/patients`,
        {
          method: 'GET',
          params,
        }
      );
      console.error('Raw API response:', JSON.stringify(response, null, 2));
      console.error('Response keys:', Object.keys(response));

      // athenahealth API returns data in 'patients' field, not 'data'
      if (response.patients && Array.isArray(response.patients)) {
        return response.patients;
      }

      // Fallback to check other possible response structures
      if (Array.isArray(response)) {
        return response;
      }

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      console.error('Unexpected response structure, returning empty array');
      return [];
    } catch (error: any) {
      console.error('Patient search error:', error.message);
      console.error('Error response:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error status:', error.response?.status);
      throw error;
    }
  }

  async createPatient(patientData: {
    firstname: string;
    lastname: string;
    dob: string; // YYYY-MM-DD or MM/DD/YYYY
    sex: string; // M or F
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

      // athenahealth API requires form-urlencoded data for POST requests
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

  async getPatientAllergies(patientId: string): Promise<Allergy[]> {
    const response = await this.makeRequest<AthenaHealthResponse<Allergy[]>>(
      `${this.config.practice_id}/patients/${patientId}/allergies`
    );
    return response.data;
  }

  async getPatientProblems(patientId: string): Promise<Problem[]> {
    const response = await this.makeRequest<AthenaHealthResponse<Problem[]>>(
      `${this.config.practice_id}/patients/${patientId}/problems`
    );
    return response.data;
  }

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

  async getPatientLabResults(patientId: string, params?: {
    startdate?: string;
    enddate?: string;
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

  async getPatientInsurance(patientId: string): Promise<Insurance[]> {
    const response = await this.makeRequest<AthenaHealthResponse<Insurance[]>>(
      `${this.config.practice_id}/patients/${patientId}/insurance`
    );
    return response.data;
  }

  // Prescription methods
  async getPatientPrescriptions(patientId: string, params?: {
    status?: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
    startdate?: string;
    enddate?: string;
  }): Promise<Prescription[]> {
    const response = await this.makeRequest<AthenaHealthResponse<Prescription[]>>(
      `${this.config.practice_id}/patients/${patientId}/prescriptions`,
      {
        method: 'GET',
        params,
      }
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
    // athenahealth API requires form-urlencoded data for POST requests
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

  async checkDrugInteractions(patientId: string, medications: string[]): Promise<ClinicalAlert[]> {
    // athenahealth API requires form-urlencoded data for POST requests
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

      // athenahealth API might return data in 'providers' field
      if (response.providers && Array.isArray(response.providers)) {
        return response.providers;
      }

      // Fallback to check other possible response structures
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

  async getDepartments(): Promise<Department[]> {
    try {
      const response = await this.makeRequest<any>(
        `${this.config.practice_id}/departments`
      );
      console.error('Departments response:', JSON.stringify(response, null, 2));

      // athenahealth API might return data in 'departments' field
      if (response.departments && Array.isArray(response.departments)) {
        return response.departments;
      }

      // Fallback to check other possible response structures
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
  async getPatientAppointments(patientId: string, params?: {
    startdate?: string;
    enddate?: string;
    status?: string;
  }): Promise<Appointment[]> {
    const response = await this.makeRequest<AthenaHealthResponse<Appointment[]>>(
      `${this.config.practice_id}/patients/${patientId}/appointments`,
      {
        method: 'GET',
        params,
      }
    );
    return response.data;
  }

  async getAppointmentAvailability(params: {
    departmentid: string;
    providerid?: string;
    appointmenttype?: string;
    startdate: string;
    enddate: string;
  }): Promise<any[]> {
    try {
      const response = await this.makeRequest<any>(
        `${this.config.practice_id}/appointments/open`,
        {
          method: 'GET',
          params,
        }
      );
      console.error('Appointment availability response:', JSON.stringify(response, null, 2));

      // athenahealth API might return data in 'appointments' or 'openappointments' field
      if (response.appointments && Array.isArray(response.appointments)) {
        return response.appointments;
      }

      if (response.openappointments && Array.isArray(response.openappointments)) {
        return response.openappointments;
      }

      // Fallback to check other possible response structures
      if (Array.isArray(response)) {
        return response;
      }

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      console.error('Unexpected appointment availability response structure, returning empty array');
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
    // athenahealth API requires form-urlencoded data for POST requests
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

  // Clinical decision support methods
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
    // athenahealth API requires form-urlencoded data for POST requests
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

  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; timestamp: string }> {
    try {
      await this.makeRequest(`${this.config.practice_id}/ping`);
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      };
    }
  }
} 
