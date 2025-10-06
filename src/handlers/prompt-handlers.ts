import { AthenaHealthClient } from '../services/athenahealth-client.js';
import { PromptMessage } from '@modelcontextprotocol/sdk/types.js';
import { ToolHandlers } from './tool-handlers.js';

export class PromptHandlers {
  private toolHandlers: ToolHandlers;

  constructor(private client: AthenaHealthClient) {
    this.toolHandlers = new ToolHandlers(client);
  }

  async handleClinicalAssessmentPrompt(args: any) {
    const { patient_id, chief_complaint } = args;
    const summary = await this.toolHandlers.handleGetClinicalSummary({ patient_id });

    const summaryText = summary.content?.[0]?.text || 'Patient summary not available';

    const prompt = `# Clinical Assessment for Patient ${patient_id}

## Chief Complaint
${chief_complaint || 'Not provided'}

## Patient Summary
${summaryText}

## Assessment Instructions
Based on the patient's clinical data above, please provide:
1. A comprehensive clinical assessment
2. Differential diagnoses to consider
3. Recommended next steps or additional tests
4. Any red flags or urgent concerns that require immediate attention

Please consider the patient's medical history, current medications, allergies, and recent vital signs and lab results in your assessment.`;

    const messages: PromptMessage[] = [
      {
        role: 'user',
        content: {
          type: 'text',
          text: prompt,
        },
      },
    ];

    return { messages };
  }

  async handleMedicationReviewPrompt(args: any) {
    const { patient_id } = args;

    try {
      const patient = await this.client.getPatient(patient_id);

      // Try to get prescriptions and allergies, but handle sandbox limitations
      let prescriptions: any[] = [];
      let allergies: any[] = [];
      const warnings: string[] = [];

      try {
        prescriptions = await this.client.getPatientPrescriptions(patient_id);
      } catch (error) {
        warnings.push('Prescription data not available in preview/sandbox environment');
      }

      try {
        allergies = await this.client.getPatientAllergies(patient_id);
      } catch (error) {
        warnings.push('Allergy data not available in preview/sandbox environment');
      }

      const warningText = warnings.length > 0
        ? `\n## Note\n${warnings.map(w => `- ${w}`).join('\n')}\n`
        : '';

      const prompt = `# Medication Review for ${patient.firstname} ${patient.lastname}

## Patient Information
- Patient ID: ${patient_id}
- Date of Birth: ${patient.dob}
- Sex: ${patient.sex}
${warningText}
## Known Allergies
${allergies.length > 0 ? JSON.stringify(allergies, null, 2) : 'No allergy data available'}

## Current Medications
${prescriptions.length > 0 ? JSON.stringify(prescriptions, null, 2) : 'No prescription data available'}

## Review Instructions
Please review the patient's current medications and provide:
1. Assessment of medication appropriateness
2. Identification of any potential drug interactions
3. Recommendations for medication optimization
4. Suggestions for deprescribing if appropriate
5. Monitoring requirements for current medications

Consider the patient's age, allergies, and any contraindications in your review.`;

      const messages: PromptMessage[] = [
        {
          role: 'user',
          content: {
            type: 'text',
            text: prompt,
          },
        },
      ];

      return { messages };
    } catch (error: any) {
      const errorPrompt = `# Medication Review Error

Unable to generate medication review for patient ${patient_id}.

Error: ${error.message || 'Unknown error'}

Note: The athenahealth preview/sandbox environment has limited endpoint availability. Clinical data endpoints (prescriptions, allergies) may not be accessible.`;

      const messages: PromptMessage[] = [
        {
          role: 'user',
          content: {
            type: 'text',
            text: errorPrompt,
          },
        },
      ];

      return { messages };
    }
  }

  async handleCarePlanPrompt(args: any) {
    const { patient_id, diagnosis } = args;
    const summary = await this.toolHandlers.handleGetClinicalSummary({ patient_id });

    const summaryText = summary.content?.[0]?.text || 'Patient clinical summary not available';

    const prompt = `# Care Plan Development for Patient ${patient_id}

## Primary Diagnosis
${diagnosis || 'Not specified'}

## Patient Clinical Summary
${summaryText}

## Care Plan Instructions
Based on the patient's clinical data and diagnosis, please develop a comprehensive care plan including:
1. Treatment goals (short-term and long-term)
2. Medication management plan
3. Lifestyle modifications and patient education
4. Follow-up schedule and monitoring requirements
5. Referrals to specialists if needed
6. Patient safety considerations
7. Discharge planning if applicable

Please ensure the care plan is evidence-based and tailored to the patient's specific needs and circumstances.`;

    const messages: PromptMessage[] = [
      {
        role: 'user',
        content: {
          type: 'text',
          text: prompt,
        },
      },
    ];

    return { messages };
  }
}
