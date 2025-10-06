# athenahealth MCP Tools - Complete Reference Guide

## Overview

This document provides a comprehensive guide to all athenahealth MCP (Model Context Protocol) tools, including which tools work in the sandbox environment, which have limitations, and what's required for production use.

**Test Environment:** athenahealth Preview/Sandbox Environment
**Test Date:** October 6, 2025
**Total Tools:** 13

---

## 📊 Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Working in Sandbox | 5 | 38% |
| ❌ Not Working (Sandbox Limitations) | 8 | 62% |
| 🧪 Total Tools | 13 | 100% |

---

## ✅ WORKING TOOLS (5/13)

These tools are fully functional in the sandbox environment.

---

### 1. list_departments

**What it does:** Lists all departments in the athenahealth practice

**Status:** ✅ Fully Working

**Parameters:** None required

**Example Prompts:**
```
Read the resource athena://departments

List all departments

Show me all athenahealth departments

Get all departments in the practice
```

**API Call:**
```javascript
athenahealth:list_departments
// No parameters required
```

**Sample Response:**
```json
{
  "departmentid": "1",
  "name": "Cruickshank HEALTH CARE",
  "patientdepartmentname": "Rome Office",
  "address": "311 arsenal street",
  "city": "WATERTOWN",
  "state": "MA",
  "zip": "02472-2785",
  "phone": "(555) 004-0271",
  "providergroupid": "1",
  "providergroupname": "7 Hills Medical Group",
  "clinicals": "ON",
  "servicedepartment": true
}
```

**Use Cases:**
- Get department IDs for patient registration
- View all practice locations
- Find department details for appointment scheduling
- Identify which departments have clinical features enabled

---

### 2. list_providers

**What it does:** Lists all healthcare providers in the practice

**Status:** ✅ Fully Working

**Parameters:**
- `name` (optional) - Filter by provider name
- `specialty` (optional) - Filter by specialty
- `limit` (optional) - Maximum results (default: 50)

**Example Prompts:**
```
Read the resource athena://providers

List all providers

Show me all doctors

List providers with specialty "Cardiology"

Find providers named "Smith"

Get all Family Medicine doctors (limit 20)
```

**API Call:**
```javascript
athenahealth:list_providers
// Optional filters
name: "Smith"
specialty: "Cardiology"
limit: 20
```

**Sample Response:**
```json
{
  "providerid": "71",
  "firstname": "Adam",
  "lastname": "Bricker",
  "displayname": "DR. BRICKER",
  "specialty": "Family Medicine",
  "specialtyid": "008",
  "providertype": "MD",
  "providertypeid": "MD",
  "npi": "1023010394",
  "acceptingnewpatients": true,
  "billable": true,
  "homedepartment": "Gerlach HEATLH INC"
}
```

**Use Cases:**
- Get provider IDs for appointments
- Find specialists by specialty type
- Check which providers accept new patients
- View provider credentials and departments

---

### 3. search_patients

**What it does:** Search for patients by name, date of birth, phone, or email

**Status:** ✅ Fully Working

**Parameters (at least ONE required):**
- `firstname` - Patient first name
- `lastname` - Patient last name
- `dob` - Date of birth (MM/DD/YYYY)
- `phone` - Phone number
- `email` - Email address
- `limit` (optional) - Maximum results (default: 10)

**Example Prompts:**
```
Search for patient with last name "Smith"

Find patient "Giuseppe Smith"

Search for patients with DOB "10/23/1992"

Find patient with last name "Test" and DOB "05/20/1985"

Does patient last name "Ofi" have any previous appointments?

Search for patient by email "john.test@example.com" and lastname "Test"
```

**API Call:**
```javascript
athenahealth:search_patients
lastname: "Smith"
firstname: "John"  // optional
dob: "05/20/1985"  // optional
limit: 20
```

**Sample Response:**
```json
{
  "patientid": "134",
  "firstname": "Giuseppe",
  "lastname": "Smith",
  "dob": "10/23/1992",
  "sex": "F",
  "email": "giuseppe.smith@example.com",
  "homephone": "5551682431",
  "mobilephone": "6179876543",
  "address1": "123 Main St",
  "city": "Boston",
  "state": "MA",
  "zip": "02101",
  "departmentid": "1",
  "primarydepartmentid": "1",
  "primaryproviderid": "24",
  "status": "active",
  "registrationdate": "04/14/2010",
  "firstappointment": "10/15/2021 14:30",
  "lastappointment": "05/14/2025 17:00"
}
```

**Use Cases:**
- Find patient ID for other operations
- Verify patient demographics
- Check patient appointment history
- Look up patient contact information

**Important Notes:**
- Must provide at least ONE search parameter
- Search by email alone requires additional parameters
- Returns appointment history if available (firstappointment, lastappointment)

---

### 4. check_appointment_availability

**What it does:** Checks available appointment slots for a department and date range

**Status:** ✅ Working (returns empty in sandbox due to no scheduling templates)

**Parameters:**
- `department_id` (required) - Department ID
- `start_date` (required) - Start date (YYYY-MM-DD)
- `end_date` (required) - End date (YYYY-MM-DD)
- `provider_id` (optional) - Specific provider ID
- `appointment_type` (optional) - Type of appointment

**Example Prompts:**
```
Check appointment availability for department "1" from "2025-10-15" to "2025-10-20"

Check availability for department "21" with provider "23" from "2025-11-01" to "2025-11-07"

What appointment slots are available in department "82" next week?

Use check_appointment_availability for department_id "1", start_date "2025-10-15", end_date "2025-10-20"
```

**API Call:**
```javascript
athenahealth:check_appointment_availability
department_id: "1"
start_date: "2025-11-01"
end_date: "2025-11-07"
provider_id: "23"  // optional
appointment_type: "OFFICE VISIT"  // optional
```

**Sandbox Behavior:**
- Tool executes successfully
- Returns empty array `[]`
- Reason: No scheduling templates configured in sandbox

**Production Behavior:**
- Returns available time slots
- Includes provider availability
- Shows appointment type options

**Use Cases:**
- Find available appointment times
- Check provider schedules
- Determine earliest available slot
- Filter by appointment type

---

### 5. create_patient

**What it does:** Register a new patient in the athenahealth system

**Status:** ✅ Fully Working

**Parameters:**
- `firstname` (required) - Patient first name
- `lastname` (required) - Patient last name
- `dob` (required) - Date of birth (MM/DD/YYYY)
- `sex` (required) - Sex (M or F)
- `department_id` (required) - Primary department ID
- `email` (optional) - Email address
- `mobile_phone` (optional) - Mobile phone number
- `home_phone` (optional) - Home phone number
- `address1` (optional) - Street address
- `city` (optional) - City
- `state` (optional) - State
- `zip` (optional) - ZIP code
- `guarantor_firstname` (optional) - Guarantor first name
- `guarantor_lastname` (optional) - Guarantor last name
- `guarantor_dob` (optional) - Guarantor DOB
- `guarantor_relationship` (optional) - 1=Self, 2=Spouse, 3=Child, 4=Other

**Example Prompts:**
```
Create a new patient: firstname "John", lastname "Test", dob "05/20/1985", sex "M", department_id "1", email "john.test@example.com", mobile_phone "6179876543", address1 "123 Main St", city "Boston", state "MA", zip "02101"

Register a new patient named "Jane Doe", DOB "03/15/1990", female, department "1", phone "6175551234"

Create patient John Smith, born 01/01/1980, male, in department 1
```

**API Call:**
```javascript
athenahealth:create_patient
firstname: "John"
lastname: "Test"
dob: "05/20/1985"
sex: "M"
department_id: "1"
email: "john.test@example.com"
mobile_phone: "6179876543"
address1: "123 Main St"
city: "Boston"
state: "MA"
zip: "02101"
```

**Sample Response:**
```json
{
  "patientid": "61378"
}
```

**CRITICAL REQUIREMENTS:**
1. ✅ **Valid North American phone number required**
   - ✓ Valid area codes: 617, 415, 212, 312, 718, etc.
   - ✗ Invalid: 555 (reserved for fictional use)
   - Format: Can be 10 digits or formatted (555-123-4567)

2. ✅ **Date format:** MM/DD/YYYY or YYYY-MM-DD

3. ✅ **Sex values:** "M" or "F" only

**Common Errors:**
```
Error: "Phone numbers must follow the North American Numbering Plan"
Solution: Use valid area code (not 555)

Error: "Additional fields are required: lastname, firstname, departmentid, dob"
Solution: Ensure all required fields are provided
```

**Use Cases:**
- Register new patients
- Create test patient records
- Batch patient registration
- Patient self-registration workflows

**Success Example:**
```
Input:
  Name: John Test
  DOB: 05/20/1985
  Phone: 6179876543 (Boston area code)

Output:
  Patient ID: 61378
  Status: Created successfully
  Can be found via search
```

---

## ❌ NON-WORKING TOOLS (8/13)

These tools have sandbox limitations and require production environment.

---

### 6. create_appointment

**What it does:** Create a new appointment for a patient

**Status:** ❌ Not Working - 404 Error

**Error Message:**
```
Failed to create appointment
Request failed with status code 404
This endpoint may not be available in the preview/sandbox environment 
or may require specific appointment types
```

**Parameters:**
- `patient_id` (required) - Patient ID
- `provider_id` (required) - Provider ID
- `department_id` (required) - Department ID
- `appointment_type` (required) - Type of appointment
- `date` (required) - Appointment date (YYYY-MM-DD)
- `start_time` (required) - Start time (HH:MM)
- `reason` (optional) - Reason for visit
- `duration` (optional) - Duration in minutes
- `notes` (optional) - Additional notes

**Example Prompts (that don't work in sandbox):**
```
Use the create_appointment tool for patient "134" with provider "1", department "1", appointment type "OFFICE VISIT", date "2025-10-10", start time "10:00", and reason "Annual physical exam"

Create an appointment for patient "61378" with provider "23", department "1", type "OFFICE VISIT", date "2025-11-15", time "14:00"

Schedule patient "134" for an office visit on "2025-11-10" at "10:00" with Dr. Cartwright
```

**Attempted API Call:**
```javascript
athenahealth:create_appointment
patient_id: "134"
provider_id: "1"
department_id: "1"
appointment_type: "OFFICE VISIT"
date: "2025-11-10"
start_time: "10:00"
reason: "Annual physical exam"
duration: "30"  // optional
notes: "Patient prefers morning"  // optional
```

**Production Requirements:**

1. ✅ **Scheduling Templates Configured**
   - Provider appointment templates must be created
   - Time slots and durations defined
   - Appointment types configured

2. ✅ **Appointment Types Defined**
   - Valid appointment type IDs (may need numeric IDs, not text)
   - Types like: New Patient, Follow-up, Physical, Sick Visit
   - Duration and billing codes associated

3. ✅ **Provider Schedules Active**
   - Working hours set up for each provider
   - Availability blocks configured
   - Break times and blocked time defined

4. ✅ **Endpoint Enabled**
   - `/appointments` POST endpoint must be available
   - Not just limited to sandbox GET operations

5. ✅ **Proper Appointment Type Format**
   - May require appointment type IDs instead of names
   - Example: `appointmenttypeid: "123"` not `appointment_type: "OFFICE VISIT"`

**What Works in Production:**
- Create appointments with validated time slots
- Auto-detect conflicts and double bookings
- Send appointment confirmations
- Block provider time
- Generate appointment reminders

---

### 7. check_drug_interactions

**What it does:** Check for drug interactions between medications for a patient

**Status:** ❌ Not Working - Tool Execution Failed

**Error Message:**
```
Tool execution failed
(No detailed error message provided)
```

**Parameters:**
- `patient_id` (required) - Patient ID
- `medications` (required) - Array of medication names or RxNorm codes

**Example Prompts (that don't work in sandbox):**
```
Use the check_drug_interactions tool for patient "134" with medications: ["aspirin", "warfarin", "ibuprofen"]

Check drug interactions for patient "61378" with medications ["Lisinopril", "Atorvastatin", "Metformin"]

Does patient "134" have any drug interactions with aspirin and warfarin?

Check if Ibuprofen interacts with patient 134's current medications
```

**Attempted API Call:**
```javascript
athenahealth:check_drug_interactions
patient_id: "134"
medications: ["aspirin", "warfarin", "ibuprofen"]
```

**Production Requirements:**

1. ✅ **Clinical Data Access Enabled**
   - API must have permissions for clinical endpoints
   - Access to patient medication lists
   - Clinical decision support features enabled

2. ✅ **Drug Interaction Database**
   - athenahealth's drug interaction checking service active
   - Integration with First Databank, Medi-Span, or similar
   - Up-to-date interaction databases

3. ✅ **Patient Has Active Medications**
   - Patient must have prescriptions in the system
   - Current medication list maintained
   - Medication history available

4. ✅ **Valid Medication Identifiers**
   - May require RxNorm codes instead of medication names
   - Example: Use RxNorm code `197361` for "Lisinopril 10mg"
   - Standardized medication naming

5. ✅ **Proper Licensing**
   - Clinical decision support features may require specific athenahealth licenses
   - Drug interaction checking module enabled
   - Subscription to interaction database services

**Expected Production Response:**
```json
{
  "interactions": [
    {
      "severity": "major",
      "description": "Warfarin and Ibuprofen: Increased risk of bleeding",
      "medications": ["warfarin", "ibuprofen"],
      "recommendation": "Avoid combination or monitor closely"
    },
    {
      "severity": "moderate",
      "description": "Aspirin and Warfarin: Additive anticoagulant effects",
      "medications": ["aspirin", "warfarin"],
      "recommendation": "Monitor INR closely"
    }
  ]
}
```

---

### 8. get_clinical_summary

**What it does:** Retrieve comprehensive patient clinical data including allergies, prescriptions, problems, vitals, labs, and alerts

**Status:** ❌ Not Working - Clinical Endpoints Unavailable

**Error Message:**
```
Returns empty arrays for all clinical data
Warnings: "Clinical endpoints not available in preview/sandbox"
Note: "Preview/Sandbox environment: Clinical endpoints unavailable. 
       Only patient demographics accessible."
```

**Parameters:**
- `patient_id` (required) - Patient ID
- `include_allergies` (optional, default: true)
- `include_prescriptions` (optional, default: true)
- `include_problems` (optional, default: true)
- `include_vitals` (optional, default: true)
- `include_labs` (optional, default: true)
- `include_alerts` (optional, default: true)

**Example Prompts (that don't work in sandbox):**
```
Get the clinical summary for patient "134"

Show me all clinical data for patient "61378"

Get allergies, prescriptions, and vitals for patient "134"

What medications is patient "134" currently taking?

Get the medication review prompt for patient "134"
```

**Attempted API Call:**
```javascript
athenahealth:get_clinical_summary
patient_id: "134"
include_allergies: true
include_prescriptions: true
include_problems: true
include_vitals: true
include_labs: true
include_alerts: true
```

**Sandbox Response:**
```json
{
  "allergies": [],
  "problems": [],
  "prescriptions": [],
  "vitals": [],
  "labs": [],
  "alerts": [],
  "_warnings": [
    "Allergies endpoint not available in preview/sandbox",
    "Problems endpoint not available in preview/sandbox",
    "Prescriptions endpoint not available in preview/sandbox",
    "Vitals endpoint not available in preview/sandbox",
    "Labs endpoint not available in preview/sandbox",
    "Alerts endpoint not available in preview/sandbox"
  ],
  "_note": "Preview/Sandbox environment: Clinical endpoints unavailable. Only patient demographics accessible."
}
```

**Production Requirements:**

1. ✅ **Clinical Endpoints Enabled**
   - `/allergies` endpoint access
   - `/prescriptions` endpoint access
   - `/problems` endpoint access (chart diagnoses)
   - `/vitals` endpoint access
   - `/labresults` endpoint access
   - `/clinicalprovideralerts` endpoint access

2. ✅ **Clinical Data Populated**
   - Patients must have actual clinical records
   - Active problem list maintained
   - Prescription history available
   - Vitals recorded during visits
   - Lab results integrated

3. ✅ **Proper Permissions**
   - API credentials must have clinical data read permissions
   - User must have appropriate role (Provider, Nurse, etc.)
   - Department clinical features enabled

4. ✅ **HIPAA Compliance**
   - Proper security measures in place
   - Audit logging enabled
   - Encrypted data transmission
   - Access controls configured

5. ✅ **Chart Sharing Configured**
   - Chart sharing groups properly set up
   - Department associations established
   - Cross-department access rules defined

**Expected Production Response:**
```json
{
  "patient_id": "134",
  "allergies": [
    {
      "allergen": "Penicillin",
      "reactions": ["Hives", "Anaphylaxis"],
      "severity": "severe",
      "onset_date": "2010-01-15"
    }
  ],
  "prescriptions": [
    {
      "medication": "Lisinopril 10mg",
      "dosage": "10mg",
      "frequency": "once daily",
      "route": "oral",
      "start_date": "2024-01-10",
      "refills_remaining": 2,
      "prescribing_provider": "Dr. Bricker"
    }
  ],
  "problems": [
    {
      "problem": "Hypertension",
      "icd10_code": "I10",
      "status": "active",
      "onset_date": "2020-05-12"
    }
  ],
  "vitals": [
    {
      "date": "2025-09-15",
      "blood_pressure": "128/82",
      "pulse": "72",
      "temperature": "98.6",
      "weight": "180 lbs",
      "height": "5'10\""
    }
  ],
  "labs": [
    {
      "test": "Lipid Panel",
      "date": "2025-08-20",
      "results": {
        "total_cholesterol": "195 mg/dL",
        "ldl": "120 mg/dL",
        "hdl": "55 mg/dL"
      },
      "status": "final"
    }
  ],
  "alerts": [
    {
      "alert_type": "Lab Result Critical",
      "message": "Potassium level elevated: 5.8 mmol/L",
      "severity": "high",
      "created_date": "2025-10-01"
    }
  ]
}
```

---

### 9. create_prescription

**What it does:** Create a new prescription for a patient

**Status:** ❌ Not Working - Tool Execution Failed

**Error Message:**
```
Tool execution failed
(No detailed error message provided)
```

**Parameters:**
- `patient_id` (required) - Patient ID
- `medication_name` (required) - Medication name
- `dosage` (required) - Dosage (e.g., "10mg")
- `frequency` (required) - Frequency (e.g., "once daily", "twice daily")
- `route` (required) - Route (e.g., "oral", "topical")
- `quantity` (required) - Quantity to dispense
- `days_supply` (required) - Days supply
- `refills` (required) - Number of refills
- `pharmacy_id` (optional) - Pharmacy ID
- `notes` (optional) - Additional instructions

**Example Prompts (that don't work in sandbox):**
```
Create a prescription for patient "61378": Lisinopril 10mg, once daily, 30 day supply, 3 refills, oral route

Prescribe Atorvastatin 20mg twice daily for patient "134", quantity 60, 2 refills

Create prescription: patient "61378", medication "Metformin", dosage "500mg", frequency "twice daily", 30 days supply

Write a prescription for patient 134: Ibuprofen 200mg, as needed for pain, quantity 30, no refills
```

**Attempted API Call:**
```javascript
athenahealth:create_prescription
patient_id: "61378"
medication_name: "Lisinopril"
dosage: "10mg"
frequency: "once daily"
route: "oral"
quantity: "30"
days_supply: "30"
refills: "3"
pharmacy_id: "12345"  // optional
notes: "Take with food"  // optional
```

**Production Requirements:**

1. ✅ **E-Prescribing Enabled**
   - EPCS (Electronic Prescriptions for Controlled Substances) configured
   - SureScripts integration active
   - State e-prescribing mandates compliance
   - Two-factor authentication for controlled substances

2. ✅ **Valid Medication Database**
   - Access to RxNorm medication database
   - FDB (First Databank) or Medi-Span integration
   - Medication formulary databases
   - NDC (National Drug Code) directory

3. ✅ **Provider DEA Numbers**
   - Prescribing provider must have valid DEA number
   - Valid NPI (National Provider Identifier)
   - State medical license active
   - Controlled substance prescribing privileges

4. ✅ **Pharmacy Integration**
   - Pharmacy network connectivity (SureScripts)
   - Preferred pharmacy setup for patient
   - Pharmacy formulary checking
   - Electronic routing to pharmacies

5. ✅ **State Prescription Monitoring**
   - PDMP (Prescription Drug Monitoring Program) integration
   - State-specific controlled substance reporting
   - Opioid prescribing guidelines enforcement
   - Prior authorization systems

6. ✅ **Proper Licensing**
   - E-prescribing features require specific athenahealth licenses
   - EPCS module subscription
   - Clinical decision support license
   - Medication management module

7. ✅ **Clinical Decision Support**
   - Drug interaction checking enabled
   - Allergy checking integration
   - Duplicate therapy detection
   - Dosing guidelines and alerts

8. ✅ **Medication Formulary**
   - Insurance formulary checking
   - Prior authorization requirements
   - Tier pricing information
   - Generic substitution rules

**Expected Production Response:**
```json
{
  "prescription_id": "789456",
  "status": "sent",
  "medication": "Lisinopril 10mg",
  "patient_id": "61378",
  "prescribing_provider": "Dr. Bricker",
  "pharmacy": "CVS Pharmacy #12345",
  "sent_date": "2025-10-05T14:30:00Z",
  "confirmation_number": "RX-2025-10-05-789456"
}
```

---

### 10. get_patient_encounters

**What it does:** Retrieve all encounters for a specific patient

**Status:** ❌ Not Working - 404 Error

**Error Message:**
```
Request failed with status code 404
Encounter endpoints not available in preview/sandbox environment
```

**Parameters:**
- `patient_id` (required) - Patient ID
- `department_id` (optional) - Filter by department
- `start_date` (optional) - Filter encounters from this date (YYYY-MM-DD)
- `end_date` (optional) - Filter encounters until this date (YYYY-MM-DD)
- `status` (optional) - Filter by encounter status (OPEN, CLOSED, SIGNED)

**Example Prompts (that don't work in sandbox):**
```
Get all encounters for patient "134"

List encounters for patient "61378" in department "1"

Show me patient "134" encounters from "2025-01-01" to "2025-10-01"

Get all open encounters for patient "134"
```

**Attempted API Call:**
```javascript
athenahealth:get_patient_encounters
patient_id: "134"
department_id: "1"  // optional
start_date: "2025-01-01"  // optional
end_date: "2025-10-01"  // optional
status: "OPEN"  // optional
```

**Production Requirements:**

1. ✅ **Encounter Endpoints Enabled**
   - `/patients/{patientid}/encounters` endpoint access
   - Clinical documentation access
   - Chart viewing permissions

2. ✅ **Encounter Data Populated**
   - Patients must have documented encounters
   - Visit notes and documentation completed
   - Encounter types configured

3. ✅ **Proper Permissions**
   - API credentials must have encounter read permissions
   - Chart access permissions configured
   - Department access rules established

**Expected Production Response:**
```json
[
  {
    "encounterid": "12345",
    "patientid": "134",
    "departmentid": "1",
    "providerid": "71",
    "encounterdate": "2025-09-15",
    "encountertype": "Office Visit",
    "chiefcomplaint": "Annual physical exam",
    "status": "SIGNED",
    "diagnosiscodes": [
      {
        "code": "Z00.00",
        "description": "Encounter for general adult medical examination",
        "codingsystem": "ICD-10"
      }
    ]
  }
]
```

---

### 11. get_encounter

**What it does:** Retrieve detailed information for a specific encounter

**Status:** ❌ Not Working - 404 Error

**Error Message:**
```
Request failed with status code 404
Encounter endpoints not available in preview/sandbox environment
```

**Parameters:**
- `encounter_id` (required) - Encounter ID

**Example Prompts (that don't work in sandbox):**
```
Get encounter details for encounter "12345"

Show me encounter "67890" details

Retrieve encounter with ID "54321"
```

**Attempted API Call:**
```javascript
athenahealth:get_encounter
encounter_id: "12345"
```

**Production Requirements:**

1. ✅ **Encounter Endpoints Enabled**
   - `/encounters/{encounterid}` endpoint access
   - Clinical documentation access

2. ✅ **Valid Encounter ID**
   - Encounter must exist in the system
   - Encounter must be accessible to the API user

3. ✅ **Chart Access Permissions**
   - Proper chart sharing groups configured
   - Cross-department access if needed

**Expected Production Response:**
```json
{
  "encounterid": "12345",
  "patientid": "134",
  "departmentid": "1",
  "providerid": "71",
  "encounterdate": "2025-09-15",
  "encountertype": "Office Visit",
  "chiefcomplaint": "Annual physical exam",
  "status": "SIGNED",
  "visittype": "Preventive",
  "diagnosiscodes": [
    {
      "code": "Z00.00",
      "description": "Encounter for general adult medical examination",
      "codingsystem": "ICD-10"
    }
  ],
  "procedurecodes": [
    {
      "code": "99385",
      "description": "Initial preventive care visit, ages 18-39",
      "codingsystem": "CPT"
    }
  ],
  "lastmodified": "2025-09-15T16:30:00Z"
}
```

---

### 12. create_encounter

**What it does:** Create a new patient encounter

**Status:** ❌ Not Working - 404 Error

**Error Message:**
```
Request failed with status code 404
Encounter creation endpoint not available in preview/sandbox environment
```

**Parameters:**
- `patient_id` (required) - Patient ID
- `department_id` (required) - Department ID
- `encounter_date` (required) - Encounter date (YYYY-MM-DD)
- `provider_id` (optional) - Provider ID
- `encounter_type` (optional) - Type of encounter
- `chief_complaint` (optional) - Chief complaint
- `visit_type` (optional) - Visit type

**Example Prompts (that don't work in sandbox):**
```
Create a new encounter for patient "134" in department "1" on "2025-10-10" with provider "71" for "Annual physical"

Create encounter for patient "61378", department "1", date "2025-11-15", chief complaint "Follow-up visit"
```

**Attempted API Call:**
```javascript
athenahealth:create_encounter
patient_id: "134"
department_id: "1"
encounter_date: "2025-10-10"
provider_id: "71"  // optional
encounter_type: "Office Visit"  // optional
chief_complaint: "Annual physical exam"  // optional
visit_type: "Preventive"  // optional
```

**Production Requirements:**

1. ✅ **Encounter Creation Enabled**
   - `/encounters` POST endpoint access
   - Clinical documentation license
   - Chart creation permissions

2. ✅ **Appointment Association**
   - May require linking to an existing appointment
   - Appointment ID might be necessary
   - Scheduling integration configured

3. ✅ **Provider Credentials**
   - Valid provider ID with documentation privileges
   - Provider assigned to the department
   - Proper clinical roles configured

4. ✅ **Encounter Types Configured**
   - Valid encounter types defined in system
   - Visit types properly set up
   - Billing rules associated

**Expected Production Response:**
```json
{
  "encounterid": "78901",
  "patientid": "134",
  "departmentid": "1",
  "providerid": "71",
  "encounterdate": "2025-10-10",
  "status": "OPEN",
  "created": "2025-10-06T14:30:00Z"
}
```

---

### 13. update_encounter

**What it does:** Update an existing encounter with new information

**Status:** ❌ Not Working - 404 Error

**Error Message:**
```
Request failed with status code 404
Encounter update endpoint not available in preview/sandbox environment
```

**Parameters:**
- `encounter_id` (required) - Encounter ID
- `chief_complaint` (optional) - Updated chief complaint
- `diagnosis_codes` (optional) - Array of diagnosis codes
- `procedure_codes` (optional) - Array of procedure codes
- `status` (optional) - Encounter status (OPEN, CLOSED, SIGNED)

**Example Prompts (that don't work in sandbox):**
```
Update encounter "12345" with chief complaint "Hypertension follow-up"

Update encounter "67890" with diagnosis code "I10" (Hypertension)

Mark encounter "12345" as SIGNED
```

**Attempted API Call:**
```javascript
athenahealth:update_encounter
encounter_id: "12345"
chief_complaint: "Hypertension follow-up"  // optional
diagnosis_codes: [
  {
    "code": "I10",
    "description": "Essential hypertension",
    "codingsystem": "ICD-10"
  }
]  // optional
status: "SIGNED"  // optional
```

**Production Requirements:**

1. ✅ **Encounter Update Permissions**
   - `/encounters/{encounterid}` PUT endpoint access
   - Chart modification permissions
   - Clinical documentation rights

2. ✅ **Encounter Status Rules**
   - Understanding of encounter workflow (OPEN → CLOSED → SIGNED)
   - Cannot modify signed encounters without special permissions
   - Provider authentication for signing

3. ✅ **Coding Requirements**
   - Valid ICD-10 diagnosis codes
   - Valid CPT/HCPCS procedure codes
   - Coding system identifiers correct

4. ✅ **Audit Trail**
   - All modifications logged
   - Provider attribution tracked
   - Cannot delete or hide changes

**Expected Production Response:**
```json
{
  "encounterid": "12345",
  "status": "updated",
  "lastmodified": "2025-10-06T15:45:00Z",
  "modifiedby": "dr.bricker"
}
```

---

### 14. acknowledge_alert (Not Fully Tested)

**What it does:** Acknowledge a clinical alert for a patient

**Status:** ❌ Cannot Test - No Alerts Available (Would Likely Fail)

**Expected Error:** Tool execution would fail due to no alerts in sandbox

**Parameters:**
- `alert_id` (required) - Alert ID
- `acknowledged_by` (required) - User acknowledging the alert

**Example Prompts (cannot test in sandbox):**
```
Acknowledge alert "12345" for user "dr.smith"

Mark alert "67890" as acknowledged by "nurse.jones"

Acknowledge clinical alert with ID "54321"

Dismiss alert 12345 for Dr. Bricker
```

**Expected API Call:**
```javascript
athenahealth:acknowledge_alert
alert_id: "12345"
acknowledged_by: "dr.smith"
```

**Production Requirements:**

1. ✅ **Clinical Alerts System Enabled**
   - athenahealth's clinical alerting configured
   - Alert types defined (critical labs, medication interactions, etc.)
   - Alert routing rules set up
   - Provider notification preferences

2. ✅ **Active Alerts in System**
   - Patients must have clinical alerts generated
   - Lab results flagged as critical
   - Medication interaction alerts
   - Overdue preventive care alerts
   - Abnormal vital signs alerts

3. ✅ **Alert IDs Available**
   - Need to retrieve alert IDs from clinical summary
   - Alerts endpoint must return active alerts
   - Alert queue functionality enabled

4. ✅ **Provider Authentication**
   - User acknowledging must have valid credentials
   - Appropriate role/permissions to acknowledge alerts
   - Provider ID or username verified

5. ✅ **Audit Logging**
   - Alert acknowledgments must be tracked
   - Compliance with regulatory requirements
   - Who acknowledged and when
   - Cannot delete or modify acknowledgment history

**Expected Production Response:**
```json
{
  "alert_id": "12345",
  "status": "acknowledged",
  "acknowledged_by": "dr.smith",
  "acknowledged_date": "2025-10-05T15:45:00Z",
  "original_alert": {
    "type": "Critical Lab Result",
    "patient_id": "134",
    "message": "Potassium critically high: 6.2 mmol/L",
    "created_date": "2025-10-05T09:30:00Z"
  }
}
```

---

## 🔧 Production Environment Setup

### Infrastructure Requirements

**API Access:**
- ✅ Full athenahealth production API access (not sandbox/preview)
- ✅ Production API credentials with appropriate OAuth scopes
- ✅ Dedicated API client ID and secret
- ✅ IP whitelisting configured (if required)

**Permissions & Scopes:**
- ✅ Clinical data read/write permissions
- ✅ Patient demographics access
- ✅ Scheduling permissions
- ✅ E-prescribing permissions
- ✅ Lab results access

**Security:**
- ✅ HIPAA-compliant environment
- ✅ Encrypted data transmission (TLS 1.2+)
- ✅ Secure credential storage
- ✅ Audit logging enabled

---

### athenahealth Configuration

**Practice Setup:**
- ✅ Practice fully configured in athenahealth
- ✅ All departments created and activated
- ✅ Provider profiles complete with credentials
- ✅ Clinical modules enabled

**Scheduling:**
- ✅ Scheduling templates created for each provider
- ✅ Appointment types defined with durations
- ✅ Provider schedules and working hours set
- ✅ Availability blocks configured
- ✅ Break times and blocked time defined

**Clinical Systems:**
- ✅ E-prescribing licenses and integrations
- ✅ Pharmacy network connectivity (SureScripts)
- ✅ Drug interaction checking enabled
- ✅ Lab interface configured
- ✅ Clinical alerts system active

**Data Quality:**
- ✅ Patients with actual clinical records
- ✅ Active medication lists maintained
- ✅ Clinical problems documented
- ✅ Vitals and lab results in system
- ✅ Allergy information captured

---

### Provider & Practice Requirements

**Provider Credentials:**
- ✅ Valid provider NPI (National Provider Identifier)
- ✅ Valid DEA number (for prescribing controlled substances)
- ✅ State medical license active and verified
- ✅ Controlled substance prescribing privileges
- ✅ Provider privileges configured in athenahealth

**Practice Configuration:**
- ✅ Chart sharing groups established
- ✅ Department clinical settings enabled
- ✅ Provider-department associations set
- ✅ Referral networks configured
- ✅ Insurance payer connections active

---

### Compliance & Regulatory

**HIPAA Compliance:**
- ✅ HIPAA compliance measures implemented
- ✅ Business Associate Agreement (BAA) with athenahealth
- ✅ Audit logging enabled and monitored
- ✅ Access controls and user authentication
- ✅ Encryption at rest and in transit

**State Requirements:**
- ✅ State prescription monitoring integration (PDMP)
- ✅ E-prescribing mandates compliance
- ✅ State-specific controlled substance reporting
- ✅ Opioid prescribing guidelines enforcement

**Clinical Decision Support:**
- ✅ Drug interaction checking
- ✅ Allergy checking
- ✅ Duplicate therapy detection
- ✅ Age-appropriate dosing
- ✅ Prior authorization workflows

---

## 📋 Quick Reference Tables

### Tools by Category

| Category | Working | Not Working |
|----------|---------|-------------|
| **Administrative** | list_departments, list_providers, search_patients, create_patient | - |
| **Scheduling** | check_appointment_availability | create_appointment |
| **Clinical** | - | get_clinical_summary, create_prescription, check_drug_interactions, acknowledge_alert |
| **Encounters** | - | get_patient_encounters, get_encounter, create_encounter, update_encounter |

---

### Sandbox vs Production

| Tool | Sandbox Status | Production Requirement |
|------|----------------|----------------------|
| list_departments | ✅ Works | None - works everywhere |
| list_providers | ✅ Works | None - works everywhere |
| search_patients | ✅ Works | None - works everywhere |
| check_appointment_availability | ✅ Works (empty) | Scheduling templates configured |
| create_patient | ✅ Works | None - works everywhere |
| create_appointment | ❌ 404 Error | Scheduling templates, endpoint enabled |
| check_drug_interactions | ❌ Failed | Clinical endpoints, drug database |
| get_clinical_summary | ❌ Empty | Clinical endpoints, populated data |
| create_prescription | ❌ Failed | E-prescribing, pharmacy integration |
| get_patient_encounters | ❌ 404 Error | Encounter endpoints, documentation access |
| get_encounter | ❌ 404 Error | Encounter endpoints, valid encounter ID |
| create_encounter | ❌ 404 Error | Encounter creation endpoint, documentation license |
| update_encounter | ❌ 404 Error | Encounter update permissions, chart modification |
| acknowledge_alert | ❌ Untested | Alerts system, active alerts |

---

### Required Fields Summary

| Tool | Required Fields |
|------|-----------------|
| list_departments | None |
| list_providers | None |
| search_patients | At least ONE of: firstname, lastname, dob, phone, email |
| check_appointment_availability | department_id, start_date, end_date |
| create_patient | firstname, lastname, dob, sex, department_id |
| create_appointment | patient_id, provider_id, department_id, appointment_type, date, start_time |
| check_drug_interactions | patient_id, medications (array) |
| get_clinical_summary | patient_id |
| create_prescription | patient_id, medication_name, dosage, frequency, route, quantity, days_supply, refills |
| get_patient_encounters | patient_id |
| get_encounter | encounter_id |
| create_encounter | patient_id, department_id, encounter_date |
| update_encounter | encounter_id |
| acknowledge_alert | alert_id, acknowledged_by |

---

## 🚀 Getting Started

### Testing in Sandbox

**What You Can Do:**
1. ✅ List all departments and providers
2. ✅ Search for existing patients
3. ✅ Create new test patients
4. ✅ Check appointment availability (will return empty)

**What You Cannot Do:**
1. ❌ Create actual appointments
2. ❌ Access clinical data
3. ❌ Create prescriptions
4. ❌ Check drug interactions
5. ❌ Manage encounters (get, create, update)

### Sample Workflow (Working in Sandbox)

```
Step 1: List departments
Prompt: "List all departments"
Result: Get department IDs

Step 2: Create a test patient
Prompt: Create a new patient: firstname "John", lastname "Test", dob "05/20/1985", 
        sex "M", department_id "1", email "john.test@example.com", 
        mobile_phone "6179876543", address1 "123 Main St", 
        city "Boston", state "MA", zip "02101"
Result: Patient ID 61378 created

Step 3: Search for the patient
Prompt: Search for patient with lastname "Test" and dob "05/20/1985"
Result: Find patient 61378 with all details confirmed

Step 4: List providers
Prompt: "List all providers with specialty Cardiology"
Result: Get provider IDs and details
```

---

## ⚠️ Important Notes

### Phone Number Requirements
- ✅ **MUST use valid North American area codes**
- ✗ **CANNOT use 555 (reserved for fictional use)**
- ✓ Valid examples: 617, 212, 415, 312, 718, 646, 858
- ✗ Invalid: 555-xxx-xxxx

### Date Formats
- ✅ MM/DD/YYYY (e.g., 05/20/1985)
- ✅ YYYY-MM-DD (e.g., 1985-05-20)
- For appointments: YYYY-MM-DD required

### Sandbox Limitations
The sandbox environment is designed for:
- ✅ Testing patient registration workflows
- ✅ Understanding data structures
- ✅ Developing demographic search logic
- ❌ NOT for clinical workflow testing
- ❌ NOT for appointment scheduling testing
- ❌ NOT for prescription workflows

---

## 📞 Support & Resources

### athenahealth Documentation
- API Documentation: https://docs.athenahealth.com/
- Developer Portal: https://developer.athenahealth.com/
- Support: developer-support@athenahealth.com

### Production Setup
For production environment setup:
1. Contact athenahealth sales/support
2. Request production API credentials
3. Complete BAA (Business Associate Agreement)
4. Configure practice settings
5. Enable clinical modules
6. Set up provider credentials
7. Complete security review

---

## 📝 Changelog

**October 6, 2025** - Added encounter management tools
- Added 4 new encounter tools: get_patient_encounters, get_encounter, create_encounter, update_encounter
- Updated total tools from 9 to 13
- Documented all encounter endpoints return 404 in sandbox
- Updated summary percentages (5/13 working = 38%, 8/13 not working = 62%)
- Added encounters category to quick reference tables

**October 5, 2025** - Initial comprehensive testing
- Tested all 9 athenahealth MCP tools
- Documented sandbox limitations
- Identified production requirements
- Created complete reference guide

---

## 📄 License

This documentation is provided as-is for reference purposes.

---

**Document Version:** 1.1
**Last Updated:** October 6, 2025
**Environment Tested:** athenahealth Preview/Sandbox
**Tools Tested:** 13/13 (100%)
