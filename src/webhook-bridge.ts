#!/usr/bin/env node

/**
 * Webhook Bridge Server for n8n Integration
 *
 * This server exposes the athenahealth MCP functionality via HTTP endpoints
 * that can be called from n8n workflows using the HTTP Request node.
 *
 * Usage:
 *   npm run webhook-bridge
 *
 * Environment Variables:
 *   ATHENA_CLIENT_ID - athenahealth API client ID
 *   ATHENA_CLIENT_SECRET - athenahealth API client secret
 *   ATHENA_PRACTICE_ID - athenahealth practice ID
 *   ATHENA_BASE_URL - athenahealth API base URL (default: preview API)
 *   WEBHOOK_PORT - Port to run the webhook server (default: 3000)
 */

import express, { Request, Response } from 'express';
import { AthenaHealthClient } from './services/athenahealth-client.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.WEBHOOK_PORT || 3000;

// Initialize athenahealth client
const client = new AthenaHealthClient({
  client_id: process.env.ATHENA_CLIENT_ID!,
  client_secret: process.env.ATHENA_CLIENT_SECRET!,
  practice_id: process.env.ATHENA_PRACTICE_ID!,
  base_url: process.env.ATHENA_BASE_URL || 'https://api.preview.platform.athenahealth.com',
  version: process.env.ATHENA_VERSION || 'v1',
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'athenahealth-webhook-bridge' });
});

// List all available endpoints
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'athenahealth Webhook Bridge for n8n',
    version: '1.0.0',
    endpoints: {
      administrative: [
        'GET /departments - List all departments',
        'GET /providers - List all providers',
        'POST /patients/search - Search for patients',
        'POST /patients - Create a new patient',
      ],
      scheduling: [
        'POST /appointments/availability - Check appointment availability',
        'POST /appointments - Create an appointment',
      ],
      clinical: [
        'GET /patients/:patientId/allergies - Get patient allergies',
        'GET /patients/:patientId/prescriptions - Get patient prescriptions',
        'GET /patients/:patientId/problems - Get patient problems',
        'GET /patients/:patientId/vitals - Get patient vitals',
        'GET /patients/:patientId/labs - Get patient lab results',
        'GET /patients/:patientId/alerts - Get clinical alerts',
        'POST /patients/:patientId/prescriptions - Create prescription',
        'POST /patients/:patientId/drug-interactions - Check drug interactions',
        'POST /alerts/:alertId/acknowledge - Acknowledge alert',
      ],
      encounters: [
        'GET /patients/:patientId/encounters - Get patient encounters',
        'GET /encounters/:encounterId - Get specific encounter',
        'POST /encounters - Create new encounter',
        'PUT /encounters/:encounterId - Update encounter',
      ],
    },
  });
});

// ===========================
// ADMINISTRATIVE ENDPOINTS
// ===========================

app.get('/departments', async (req: Request, res: Response) => {
  try {
    const departments = await client.getDepartments();
    res.json({ success: true, data: departments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/providers', async (req: Request, res: Response) => {
  try {
    const { name, specialty, limit } = req.query;
    const providers = await client.getProviders({
      name: name as string,
      specialty: specialty as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ success: true, data: providers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/patients/search', async (req: Request, res: Response) => {
  try {
    const patients = await client.searchPatients(req.body);
    res.json({ success: true, data: patients });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/patients', async (req: Request, res: Response) => {
  try {
    const patient = await client.createPatient(req.body);
    res.json({ success: true, data: patient });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================
// SCHEDULING ENDPOINTS
// ===========================

app.post('/appointments/availability', async (req: Request, res: Response) => {
  try {
    const availability = await client.getAppointmentAvailability(req.body);
    res.json({ success: true, data: availability });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/appointments', async (req: Request, res: Response) => {
  try {
    const appointment = await client.createAppointment(req.body);
    res.json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================
// CLINICAL ENDPOINTS
// ===========================

app.get('/patients/:patientId/allergies', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId!;
    const allergies = await client.getPatientAllergies(patientId);
    res.json({ success: true, data: allergies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/patients/:patientId/prescriptions', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId!;
    const prescriptions = await client.getPatientPrescriptions(patientId);
    res.json({ success: true, data: prescriptions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/patients/:patientId/problems', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId!;
    const problems = await client.getPatientProblems(patientId);
    res.json({ success: true, data: problems });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/patients/:patientId/vitals', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId!;
    const { startdate, enddate } = req.query;
    const vitals = await client.getPatientVitals(patientId, {
      startdate: startdate as string,
      enddate: enddate as string,
    });
    res.json({ success: true, data: vitals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/patients/:patientId/labs', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId!;
    const { startdate, enddate } = req.query;
    const labs = await client.getPatientLabResults(patientId, {
      startdate: startdate as string,
      enddate: enddate as string,
    });
    res.json({ success: true, data: labs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/patients/:patientId/alerts', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId!;
    const alerts = await client.getClinicalAlerts(patientId);
    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/patients/:patientId/prescriptions', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId!;
    const prescription = await client.createPrescription(patientId, req.body);
    res.json({ success: true, data: prescription });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/patients/:patientId/drug-interactions', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId!;
    const { medications } = req.body;
    const interactions = await client.checkDrugInteractions(patientId, medications);
    res.json({ success: true, data: interactions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
  try {
    const alertId = req.params.alertId!;
    const { acknowledged_by } = req.body;
    const result = await client.acknowledgeAlert(alertId, acknowledged_by);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================
// ENCOUNTER ENDPOINTS
// ===========================

app.get('/patients/:patientId/encounters', async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId!;
    const { departmentid, startdate, enddate, status } = req.query;

    const encounters = await client.getPatientEncounters(patientId, {
      departmentid: departmentid as string,
      startdate: startdate as string,
      enddate: enddate as string,
      status: status as 'OPEN' | 'CLOSED' | 'SIGNED',
    });
    res.json({ success: true, data: encounters });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/encounters/:encounterId', async (req: Request, res: Response) => {
  try {
    const encounterId = req.params.encounterId!;
    const encounter = await client.getEncounter(encounterId);
    res.json({ success: true, data: encounter });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/encounters', async (req: Request, res: Response) => {
  try {
    const encounter = await client.createEncounter(req.body);
    res.json({ success: true, data: encounter });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/encounters/:encounterId', async (req: Request, res: Response) => {
  try {
    const encounterId = req.params.encounterId!;
    const encounter = await client.updateEncounter(encounterId, req.body);
    res.json({ success: true, data: encounter });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 athenahealth Webhook Bridge running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API documentation: http://localhost:${PORT}/`);
  console.log(`\n✅ Ready to receive requests from n8n workflows!\n`);
});
