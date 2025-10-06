import { AthenaHealthClient } from '../services/athenahealth-client.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { logDataAccess } from '../utils/logger.js';

export class ResourceHandlers {
  constructor(private client: AthenaHealthClient) {}

  async handleReadResource(uri: string) {
    try {
      if (uri === 'athena://patients') {
        // This would typically require search parameters
        // For now, return empty array with instructions
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                message: 'Use the search_patients tool to find patients',
                example: 'search_patients with firstname="John" lastname="Doe"',
              }),
            },
          ],
        };
      }

      if (uri.startsWith('athena://patient/')) {
        const patientId = this.extractPatientId(uri);
        const resourceType = this.extractResourceType(uri);

        logDataAccess('PATIENT_DATA', patientId, 'READ');

        switch (resourceType) {
          case 'details':
            const patient = await this.client.getPatient(patientId);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(patient, null, 2),
                },
              ],
            };

          case 'allergies':
            const allergies = await this.client.getPatientAllergies(patientId);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(allergies, null, 2),
                },
              ],
            };

          case 'problems':
            const problems = await this.client.getPatientProblems(patientId);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(problems, null, 2),
                },
              ],
            };

          case 'prescriptions':
            const prescriptions = await this.client.getPatientPrescriptions(patientId);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(prescriptions, null, 2),
                },
              ],
            };

          case 'vitals':
            const vitals = await this.client.getPatientVitals(patientId);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(vitals, null, 2),
                },
              ],
            };

          case 'labs':
            const labs = await this.client.getPatientLabResults(patientId);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(labs, null, 2),
                },
              ],
            };

          case 'alerts':
            const alerts = await this.client.getClinicalAlerts(patientId);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(alerts, null, 2),
                },
              ],
            };

          default:
            throw new McpError(ErrorCode.InvalidRequest, `Unknown resource type: ${resourceType}`);
        }
      }

      if (uri === 'athena://providers') {
        const providers = await this.client.getProviders();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(providers, null, 2),
            },
          ],
        };
      }

      if (uri.startsWith('athena://provider/')) {
        const providerId = uri.split('/')[2];
        if (!providerId) {
          throw new McpError(ErrorCode.InvalidRequest, 'Invalid provider URI: missing provider ID');
        }
        const provider = await this.client.getProvider(providerId);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(provider, null, 2),
            },
          ],
        };
      }

      if (uri === 'athena://departments') {
        const departments = await this.client.getDepartments();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(departments, null, 2),
            },
          ],
        };
      }

      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource URI: ${uri}`);
    } catch (error) {
      console.error('Error reading resource:', uri, error);
      throw new McpError(ErrorCode.InternalError, `Failed to read resource: ${error}`);
    }
  }

  private extractPatientId(uri: string): string {
    const match = uri.match(/athena:\/\/patient\/([^\/]+)/);
    if (!match || !match[1]) {
      throw new McpError(ErrorCode.InvalidRequest, 'Invalid patient URI');
    }
    return match[1];
  }

  private extractResourceType(uri: string): string {
    const parts = uri.split('/');
    if (parts.length < 4) {
      return 'details';
    }
    return parts[3] || 'details';
  }
}
