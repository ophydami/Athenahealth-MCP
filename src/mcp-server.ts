import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  McpError,
  ErrorCode,
  Resource,
  Prompt,
} from '@modelcontextprotocol/sdk/types.js';
import { AthenaHealthClient } from './services/athenahealth-client.js';
import { AuthConfig } from './types/athenahealth.js';
import { z } from 'zod';
import { ToolHandlers } from './handlers/tool-handlers.js';
import { PromptHandlers } from './handlers/prompt-handlers.js';
import { ResourceHandlers } from './handlers/resource-handlers.js';
import { toolDefinitions } from './definitions/tools.js';

// Environment configuration schema
const ConfigSchema = z.object({
  ATHENA_CLIENT_ID: z.string().min(1, 'ATHENA_CLIENT_ID is required'),
  ATHENA_CLIENT_SECRET: z.string().min(1, 'ATHENA_CLIENT_SECRET is required'),
  ATHENA_BASE_URL: z.string().url('ATHENA_BASE_URL must be a valid URL'),
  ATHENA_VERSION: z.string().default('v1'),
  ATHENA_PRACTICE_ID: z.string().min(1, 'ATHENA_PRACTICE_ID is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export class AthenaHealthMCPServer {
  private server: Server;
  private client: AthenaHealthClient;
  private toolHandlers: ToolHandlers;
  private promptHandlers: PromptHandlers;
  private resourceHandlers: ResourceHandlers;
  private isInitialized = false;

  constructor() {
    this.server = new Server(
      {
        name: 'athenahealth-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );

    // Initialize athenahealth client
    const config = this.loadConfig();
    this.client = new AthenaHealthClient(config);

    // Initialize handlers
    this.toolHandlers = new ToolHandlers(this.client);
    this.promptHandlers = new PromptHandlers(this.client);
    this.resourceHandlers = new ResourceHandlers(this.client);

    this.setupHandlers();
  }

  private loadConfig(): AuthConfig {
    try {
      const env = ConfigSchema.parse(process.env);
      return {
        client_id: env.ATHENA_CLIENT_ID,
        client_secret: env.ATHENA_CLIENT_SECRET,
        base_url: env.ATHENA_BASE_URL,
        version: env.ATHENA_VERSION,
        practice_id: env.ATHENA_PRACTICE_ID,
      };
    } catch (error) {
      console.error('Configuration validation failed:', error);
      throw new Error('Invalid configuration. Please check your environment variables.');
    }
  }

  private setupHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources: Resource[] = [
        {
          uri: 'athena://patients',
          name: 'Patient Search',
          description: 'Search for patients by name, DOB, or other identifiers',
          mimeType: 'application/json',
        },
        {
          uri: 'athena://patient/{id}',
          name: 'Patient Details',
          description: 'Get detailed information about a specific patient',
          mimeType: 'application/json',
        },
        {
          uri: 'athena://patient/{id}/allergies',
          name: 'Patient Allergies',
          description: 'Get patient allergy information',
          mimeType: 'application/json',
        },
        {
          uri: 'athena://patient/{id}/problems',
          name: 'Patient Problems',
          description: 'Get patient problem list',
          mimeType: 'application/json',
        },
        {
          uri: 'athena://patient/{id}/prescriptions',
          name: 'Patient Prescriptions',
          description: 'Get patient prescription history',
          mimeType: 'application/json',
        },
        {
          uri: 'athena://patient/{id}/vitals',
          name: 'Patient Vital Signs',
          description: 'Get patient vital signs history',
          mimeType: 'application/json',
        },
        {
          uri: 'athena://patient/{id}/labs',
          name: 'Patient Lab Results',
          description: 'Get patient laboratory results',
          mimeType: 'application/json',
        },
        {
          uri: 'athena://patient/{id}/alerts',
          name: 'Clinical Alerts',
          description: 'Get clinical decision support alerts for patient',
          mimeType: 'application/json',
        },
        {
          uri: 'athena://providers',
          name: 'Provider Directory',
          description: 'List healthcare providers in the practice',
          mimeType: 'application/json',
        },
        {
          uri: 'athena://provider/{id}',
          name: 'Provider Details',
          description: 'Get detailed information about a specific provider',
          mimeType: 'application/json',
        },
        {
          uri: 'athena://departments',
          name: 'Department Directory',
          description: 'List departments in the practice',
          mimeType: 'application/json',
        },
      ];

      return { resources };
    });

    // Read specific resources - delegate to ResourceHandlers
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return this.resourceHandlers.handleReadResource(request.params.uri);
    });

    // List available tools - use imported tool definitions
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: toolDefinitions };
    });

    // Handle tool calls - delegate to ToolHandlers
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_patients':
            return await this.toolHandlers.handleSearchPatients(args);

          case 'check_drug_interactions':
            return await this.toolHandlers.handleCheckDrugInteractions(args);

          case 'create_prescription':
            return await this.toolHandlers.handleCreatePrescription(args);

          case 'create_appointment':
            return await this.toolHandlers.handleCreateAppointment(args);

          case 'acknowledge_alert':
            return await this.toolHandlers.handleAcknowledgeAlert(args);

          case 'get_clinical_summary':
            return await this.toolHandlers.handleGetClinicalSummary(args);

          case 'list_departments':
            return await this.toolHandlers.handleListDepartments(args);

          case 'list_providers':
            return await this.toolHandlers.handleListProviders(args);

          case 'check_appointment_availability':
            return await this.toolHandlers.handleCheckAppointmentAvailability(args);

          case 'create_patient':
            return await this.toolHandlers.handleCreatePatient(args);

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error('Tool execution error:', name, error);
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts: Prompt[] = [
        {
          name: 'clinical_assessment',
          description: 'Generate a clinical assessment prompt for a patient',
          arguments: [
            {
              name: 'patient_id',
              description: 'Patient ID',
              required: true,
            },
            {
              name: 'chief_complaint',
              description: 'Chief complaint or reason for visit',
              required: false,
            },
          ],
        },
        {
          name: 'medication_review',
          description: 'Generate a medication review prompt',
          arguments: [
            {
              name: 'patient_id',
              description: 'Patient ID',
              required: true,
            },
          ],
        },
        {
          name: 'care_plan',
          description: 'Generate a care plan prompt',
          arguments: [
            {
              name: 'patient_id',
              description: 'Patient ID',
              required: true,
            },
            {
              name: 'diagnosis',
              description: 'Primary diagnosis',
              required: false,
            },
          ],
        },
      ];

      return { prompts };
    });

    // Handle prompt requests - delegate to PromptHandlers
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'clinical_assessment':
            return await this.promptHandlers.handleClinicalAssessmentPrompt(args);

          case 'medication_review':
            return await this.promptHandlers.handleMedicationReviewPrompt(args);

          case 'care_plan':
            return await this.promptHandlers.handleCarePlanPrompt(args);

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown prompt: ${name}`);
        }
      } catch (error) {
        console.error('Prompt generation error:', name, error);
        throw new McpError(ErrorCode.InternalError, `Prompt generation failed: ${error}`);
      }
    });
  }

  // Server lifecycle methods
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Test athenahealth connection
      await this.client.healthCheck();
      console.error('athenahealth MCP Server initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize athenahealth MCP Server:', error);
      throw error;
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    this.server.connect(transport);
    console.error('athenahealth MCP Server running on stdio');
    // Return a promise that never resolves, keeping the process alive.
    // The process will be terminated by the gracefulShutdown handlers in index.ts.
    return new Promise<void>((resolve, reject) => {
      // We don't call resolve or reject, so this promise never settles.
    });
  }

  async stop(): Promise<void> {
    console.error('athenahealth MCP Server stopping');
    await this.server.close();
  }
}
