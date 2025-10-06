import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger.js';
import {
  AuthTokenResponse,
  AuthConfig,
  AthenaHealthError,
} from '../types/athenahealth.js';

export class BaseAthenaClient {
  protected readonly config: AuthConfig;
  protected readonly httpClient: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(config: AuthConfig) {
    this.config = config;
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

        logger.info('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
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
        logger.info('API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        try {
          logger.error('API Error', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message || 'Unknown error',
            responseData: error.response?.data,
          });

          if (error.response?.status === 400) {
            console.error('Bad Request Error:', JSON.stringify(error.response?.data, null, 2));
          }
        } catch (logError) {
          console.error('Failed to log API error:', error.message || 'Unknown error');
        }

        if (error.response?.status === 401) {
          this.accessToken = null;
          this.refreshToken = null;
          this.tokenExpiresAt = null;
        }

        return Promise.reject(error);
      }
    );
  }

  async authenticate(): Promise<void> {
    try {
      let authUrl = 'https://api.platform.athenahealth.com/oauth2/v1/token';

      if (this.config.base_url.includes('preview')) {
        authUrl = 'https://api.preview.platform.athenahealth.com/oauth2/v1/token';
      }

      console.error('Authenticating to:', authUrl);
      console.error('Client ID:', this.config.client_id);

      try {
        const metadataUrl = authUrl.replace('/token', '/.well-known/openid-configuration');
        console.error('Checking OAuth metadata at:', metadataUrl);
        const metadataResponse = await axios.get(metadataUrl);
        console.error('OAuth metadata:', JSON.stringify(metadataResponse.data, null, 2));
      } catch (metaError) {
        console.error('Could not fetch OAuth metadata');
      }

      const basicAuth = Buffer.from(`${this.config.client_id}:${this.config.client_secret}`).toString('base64');
      const scope = 'athena/service/Athenanet.MDP.*';

      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: scope,
      });

      console.error('Trying scope:', scope);
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
      });
    } catch (error: any) {
      logger.error('Authentication failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error('Failed to authenticate with athenahealth API');
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt) {
      await this.authenticate();
      return;
    }

    if (this.tokenExpiresAt - Date.now() < 5 * 60 * 1000) {
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        await this.authenticate();
      }
    }
  }

  private async refreshAccessToken(): Promise<void> {
    // Refresh token logic (if supported by athenahealth)
    await this.authenticate();
  }

  protected async makeRequest<T>(
    endpoint: string,
    options: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response = await this.httpClient.request<T>({
        url: endpoint,
        ...options,
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
