import { AthenaHealthClient } from '../services/athenahealth-client.js';
import { auditLog, logDataAccess } from '../utils/logger.js';

export class ToolHandlers {
  constructor(private client: AthenaHealthClient) {}

  async handleSearchPatients(args: any) {
    try {
      // Validate that at least one search parameter is provided
      const searchFields = ['firstname', 'lastname', 'dob', 'departmentid', 'phone', 'email'];
      const hasSearchParam = searchFields.some(field => args[field]);

      if (!hasSearchParam) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'At least one search parameter is required',
                message: 'Please provide at least one of: firstname, lastname, dob, departmentid, phone, or email',
                example: {
                  firstname: 'John',
                  lastname: 'Doe',
                  limit: 10
                }
              }, null, 2),
            },
          ],
        };
      }

      const patients = await this.client.searchPatients(args);

      // Log the actual response for debugging
      console.error('Patient search raw response:', JSON.stringify(patients, null, 2));
      console.error('Response type:', typeof patients);
      console.error('Is array:', Array.isArray(patients));

      auditLog('PATIENT_SEARCH', { result: 'success' });

      if (!patients || typeof patients.length !== 'number') {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Patient search failed',
                message: 'The API returned an unexpected response.',
                suggestion: 'Try using list_departments first to get department IDs, then use list_patients_by_department to list patients.',
                api_response: patients,
                response_type: typeof patients,
                is_array: Array.isArray(patients),
              }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(patients, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('handleSearchPatients caught error:', error);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Patient search exception',
              message: error.message || 'Unknown error occurred',
              error_type: error.error || 'Unknown',
              details: error.details || error.message,
              detailcode: error.detailcode,
            }, null, 2),
          },
        ],
      };
    }
  }

  async handleCheckDrugInteractions(args: any) {
    const { patient_id, medications } = args;
    const interactions = await this.client.checkDrugInteractions(patient_id, medications);

    logDataAccess('DRUG_INTERACTIONS', patient_id, 'CHECK');

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(interactions, null, 2),
        },
      ],
    };
  }

  async handleCreatePrescription(args: any) {
    try {
      const { patient_id, ...prescriptionData } = args;
      const prescription = await this.client.createPrescription(patient_id, {
        medicationname: prescriptionData.medication_name,
        dosage: prescriptionData.dosage,
        route: prescriptionData.route,
        frequency: prescriptionData.frequency,
        quantity: prescriptionData.quantity,
        refills: prescriptionData.refills,
        daysupply: prescriptionData.days_supply,
        pharmacyid: prescriptionData.pharmacy_id,
        notes: prescriptionData.notes,
      });

      auditLog('PRESCRIPTION_CREATE', {
        patientId: patient_id,
        result: 'success',
        resourceType: 'PRESCRIPTION',
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(prescription, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Failed to create prescription',
              message: error.message || 'Unknown error occurred',
              status: error.status || null,
              note: 'The prescription endpoint is not available in the athenahealth preview/sandbox environment. This endpoint requires a production API account.',
            }, null, 2),
          },
        ],
      };
    }
  }

  async handleCreateAppointment(args: any) {
    try {
      const appointment = await this.client.createAppointment({
        patientid: args.patient_id,
        providerid: args.provider_id,
        departmentid: args.department_id,
        appointmenttype: args.appointment_type,
        date: args.date,
        starttime: args.start_time,
        duration: args.duration,
        reasonforvisit: args.reason,
        appointmentnotes: args.notes,
      });

      auditLog('APPOINTMENT_CREATE', {
        patientId: args.patient_id,
        result: 'success',
        resourceType: 'APPOINTMENT',
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(appointment, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Create appointment error:', error);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Failed to create appointment',
              message: error.message || 'Unknown error occurred',
              details: error.details || error.message,
              note: 'This endpoint may not be available in the preview/sandbox environment or may require specific appointment types',
            }, null, 2),
          },
        ],
      };
    }
  }

  async handleAcknowledgeAlert(args: any) {
    const { alert_id, acknowledged_by } = args;
    await this.client.acknowledgeAlert(alert_id, acknowledged_by);

    auditLog('ALERT_ACKNOWLEDGE', {
      resourceType: 'CLINICAL_ALERT',
      resourceId: alert_id,
      userId: acknowledged_by,
      result: 'success',
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ success: true, message: 'Alert acknowledged' }, null, 2),
        },
      ],
    };
  }

  async handleGetClinicalSummary(args: any) {
    const { patient_id, ...options } = args;
    const summary: any = {};
    const errors: any = {};

    // Get patient details
    try {
      summary.patient = await this.client.getPatient(patient_id);
    } catch (error: any) {
      errors.patient = error.message || 'Failed to fetch patient data';
    }

    // Get clinical data based on options - handle errors gracefully
    const warnings: string[] = [];

    if (options.include_allergies !== false) {
      try {
        summary.allergies = await this.client.getPatientAllergies(patient_id);
      } catch (error: any) {
        warnings.push('Allergies endpoint not available in preview/sandbox');
        summary.allergies = [];
      }
    }

    if (options.include_problems !== false) {
      try {
        summary.problems = await this.client.getPatientProblems(patient_id);
      } catch (error: any) {
        warnings.push('Problems endpoint not available in preview/sandbox');
        summary.problems = [];
      }
    }

    if (options.include_prescriptions !== false) {
      try {
        summary.prescriptions = await this.client.getPatientPrescriptions(patient_id);
      } catch (error: any) {
        warnings.push('Prescriptions endpoint not available in preview/sandbox');
        summary.prescriptions = [];
      }
    }

    if (options.include_vitals !== false) {
      try {
        summary.vitals = await this.client.getPatientVitals(patient_id);
      } catch (error: any) {
        warnings.push('Vitals endpoint not available in preview/sandbox');
        summary.vitals = [];
      }
    }

    if (options.include_labs !== false) {
      try {
        summary.labs = await this.client.getPatientLabResults(patient_id);
      } catch (error: any) {
        warnings.push('Labs endpoint not available in preview/sandbox');
        summary.labs = [];
      }
    }

    if (options.include_alerts !== false) {
      try {
        summary.alerts = await this.client.getClinicalAlerts(patient_id);
      } catch (error: any) {
        warnings.push('Alerts endpoint not available in preview/sandbox');
        summary.alerts = [];
      }
    }

    // Include warnings and errors
    if (warnings.length > 0) {
      summary._warnings = warnings;
      summary._note = 'Preview/Sandbox environment: Clinical endpoints unavailable. Only patient demographics accessible.';
    }

    if (Object.keys(errors).length > 0) {
      summary._errors = errors;
    }

    logDataAccess('CLINICAL_SUMMARY', patient_id, 'READ');

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  async handleListDepartments(args: any) {
    try {
      const departments = await this.client.getDepartments();

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(departments, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Failed to list departments',
              message: error.message || 'Unknown error occurred',
              details: error.details || error.message,
            }, null, 2),
          },
        ],
      };
    }
  }

  async handleListProviders(args: any) {
    try {
      const providers = await this.client.getProviders(args);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(providers, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Failed to list providers',
              message: error.message || 'Unknown error occurred',
              details: error.details || error.message,
            }, null, 2),
          },
        ],
      };
    }
  }

  async handleCheckAppointmentAvailability(args: any) {
    try {
      const { department_id, provider_id, appointment_type, start_date, end_date } = args;

      const availability = await this.client.getAppointmentAvailability({
        departmentid: department_id,
        providerid: provider_id,
        appointmenttype: appointment_type,
        startdate: start_date,
        enddate: end_date,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(availability, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Failed to check appointment availability',
              message: error.message || 'Unknown error occurred',
              details: error.details || error.message,
              note: 'This endpoint may not be available in the preview/sandbox environment',
            }, null, 2),
          },
        ],
      };
    }
  }

  async handleCreatePatient(args: any) {
    try {
      console.error('handleCreatePatient received args:', JSON.stringify(args, null, 2));

      const patientData = {
        firstname: args.firstname,
        lastname: args.lastname,
        dob: args.dob,
        sex: args.sex,
        departmentid: args.department_id,
        email: args.email,
        mobilephone: args.mobile_phone,
        homephone: args.home_phone,
        address1: args.address1,
        city: args.city,
        state: args.state,
        zip: args.zip,
        guarantorfirstname: args.guarantor_firstname,
        guarantorlastname: args.guarantor_lastname,
        guarantordob: args.guarantor_dob,
        guarantorrelationshiptopatient: args.guarantor_relationship,
      };

      console.error('patientData before cleanup:', JSON.stringify(patientData, null, 2));

      // Remove undefined fields
      Object.keys(patientData).forEach(key => {
        if (patientData[key as keyof typeof patientData] === undefined) {
          delete patientData[key as keyof typeof patientData];
        }
      });

      console.error('patientData after cleanup:', JSON.stringify(patientData, null, 2));

      const patient = await this.client.createPatient(patientData);

      auditLog('PATIENT_CREATE', {
        result: 'success',
        resourceType: 'PATIENT',
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(patient, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error('Create patient error:', error);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Failed to create patient',
              message: error.message || 'Unknown error occurred',
              error_code: error.error || null,
              detailcode: error.detailcode || null,
              api_details: error.details || null,
              api_response: error.response || null,
              status_code: error.status || null,
              note: 'Check the api_response field for specific validation errors from athenahealth',
            }, null, 2),
          },
        ],
      };
    }
  }
}
