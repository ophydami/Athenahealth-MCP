# athenahealth MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with athenahealth's clinical data and services for AI-powered clinical decision support.

## 📊 Tool Status Overview

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Working in Sandbox | 5 | 56% |
| ❌ Not Working (Sandbox Limitations) | 4 | 44% |
| 🧪 Total Tools | 9 | 100% |

## Features

### 🏥 Clinical Decision Support
- **Patient Data Access**: Comprehensive patient information including demographics, medical history, and clinical data
- **Prescription Management**: Medication history, drug interaction checking, and prescription creation (Production only)
- **Provider Management**: Healthcare provider directory and practice information
- **Clinical Alerts**: Real-time clinical decision support alerts and warnings (Production only)
- **Lab Results**: Access to laboratory results and diagnostic reports (Production only)
- **Vital Signs**: Patient vital signs history and trending (Production only)

### 🔒 HIPAA Compliance
- **Data Sanitization**: Automatic sanitization of sensitive healthcare data in logs
- **Audit Logging**: Comprehensive audit trails for all data access and modifications
- **Access Controls**: Role-based access controls and authentication
- **Data Encryption**: Secure data transmission and storage

### 🚀 AI-Powered Workflows
- **Clinical Assessment**: AI-powered clinical assessment prompts
- **Medication Review**: Automated medication review and optimization (handles sandbox limitations)
- **Care Plan Generation**: Evidence-based care plan development
- **Clinical Summarization**: Comprehensive patient clinical summaries

## Installation

### Prerequisites

- Node.js 18.0.0 or later
- athenahealth Developer Account and API credentials
- TypeScript 5.0.0 or later

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/ophydami/athenahealth-mcp-server.git
   cd athenahealth-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp config/environment.example .env
   # Edit .env with your athenahealth API credentials
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ATHENA_CLIENT_ID` | athenahealth API Client ID | Yes | - |
| `ATHENA_CLIENT_SECRET` | athenahealth API Client Secret | Yes | - |
| `ATHENA_BASE_URL` | athenahealth API Base URL | Yes | - |
| `ATHENA_VERSION` | API Version | No | `v1` |
| `ATHENA_PRACTICE_ID` | Practice ID | Yes | - |
| `NODE_ENV` | Environment | No | `development` |
| `LOG_LEVEL` | Log Level | No | `info` |

### athenahealth API Setup

1. **Create Developer Account**
   - Visit [athenahealth Developer Portal](https://www.athenahealth.com/developer-portal)
   - Create a developer account
   - Request sandbox access

2. **Create API Application**
   - Create a new application in the developer portal
   - Note down your Client ID and Client Secret
   - Configure OAuth 2.0 settings

3. **Get Practice ID**
   - Contact athenahealth support to get your Practice ID
   - This is required for API access

## MCP Tools Reference

### ✅ Working in Sandbox (5 tools)

#### 1. list_departments
**Status:** ✅ Fully Working
**Description:** Lists all departments in the athenahealth practice

**Parameters:** None required

**Example:**
```typescript
// List all departments
const departments = await mcpClient.callTool('list_departments', {});
```

---

#### 2. list_providers
**Status:** ✅ Fully Working
**Description:** Lists all healthcare providers in the practice

**Parameters:**
- `name` (optional) - Filter by provider name
- `specialty` (optional) - Filter by specialty
- `limit` (optional) - Maximum results (default: 50)

**Example:**
```typescript
// List all providers
const providers = await mcpClient.callTool('list_providers', {
  specialty: 'Cardiology',
  limit: 20
});
```

---

#### 3. search_patients
**Status:** ✅ Fully Working
**Description:** Search for patients by name, DOB, phone, or email

**Parameters (at least ONE required):**
- `firstname` - Patient first name
- `lastname` - Patient last name
- `dob` - Date of birth (MM/DD/YYYY)
- `phone` - Phone number
- `email` - Email address
- `limit` (optional) - Maximum results (default: 10)

**Example:**
```typescript
// Search for patients by name
const patients = await mcpClient.callTool('search_patients', {
  firstname: 'John',
  lastname: 'Smith',
  limit: 10
});
```

---

#### 4. create_patient
**Status:** ✅ Fully Working
**Description:** Register a new patient in the athenahealth system

**Parameters (required):**
- `firstname` - Patient first name
- `lastname` - Patient last name
- `dob` - Date of birth (MM/DD/YYYY)
- `sex` - Sex (M or F)
- `department_id` - Primary department ID

**Parameters (optional):**
- `email`, `mobile_phone`, `home_phone`, `address1`, `city`, `state`, `zip`
- `guarantor_firstname`, `guarantor_lastname`, `guarantor_dob`, `guarantor_relationship`

**Important:**
- ✅ Valid North American phone numbers required (not 555 area code)
- ✅ Date format: MM/DD/YYYY or YYYY-MM-DD

**Example:**
```typescript
const patient = await mcpClient.callTool('create_patient', {
  firstname: 'John',
  lastname: 'Test',
  dob: '05/20/1985',
  sex: 'M',
  department_id: '1',
  email: 'john.test@example.com',
  mobile_phone: '6179876543',
  address1: '123 Main St',
  city: 'Boston',
  state: 'MA',
  zip: '02101'
});
```

---

#### 5. check_appointment_availability
**Status:** ✅ Working (returns empty in sandbox)
**Description:** Check available appointment slots for a department and date range

**Parameters:**
- `department_id` (required) - Department ID
- `start_date` (required) - Start date (YYYY-MM-DD)
- `end_date` (required) - End date (YYYY-MM-DD)
- `provider_id` (optional) - Specific provider ID
- `appointment_type` (optional) - Type of appointment

**Note:** Returns empty array in sandbox (no scheduling templates configured)

**Example:**
```typescript
const availability = await mcpClient.callTool('check_appointment_availability', {
  department_id: '1',
  start_date: '2025-11-01',
  end_date: '2025-11-07',
  provider_id: '23'
});
```

---

### ❌ Not Working in Sandbox (4 tools)

These tools require production environment with full clinical access.

#### 6. create_appointment
**Status:** ❌ Not Working - 404 Error
**Reason:** Endpoint not available in sandbox, requires scheduling templates

#### 7. check_drug_interactions
**Status:** ❌ Not Working - Tool Execution Failed
**Reason:** Requires clinical endpoints and drug interaction database

#### 8. get_clinical_summary
**Status:** ❌ Not Working - Clinical Endpoints Unavailable
**Reason:** Clinical data endpoints (allergies, prescriptions, problems, vitals, labs, alerts) return 404

#### 9. create_prescription
**Status:** ❌ Not Working - 404 Error
**Reason:** E-prescribing endpoint not available in sandbox

**Note:** See [athenahealth-mcp-tools-readme.md](athenahealth-mcp-tools-readme.md) for detailed information on production requirements for these tools.

---

## MCP Prompts

### clinical_assessment
Generate clinical assessment prompts with patient data

**Parameters:**
- `patient_id` (required)
- `chief_complaint` (optional)

### medication_review
Generate medication review prompts (handles sandbox limitations gracefully)

**Parameters:**
- `patient_id` (required)

### care_plan
Generate care plan development prompts

**Parameters:**
- `patient_id` (required)
- `diagnosis` (optional)

---

## Working Sample Workflow (Sandbox)

```typescript
// Step 1: List departments
const departments = await mcpClient.callTool('list_departments', {});
const departmentId = departments[0].departmentid;

// Step 2: Create a test patient
const patient = await mcpClient.callTool('create_patient', {
  firstname: 'John',
  lastname: 'Test',
  dob: '05/20/1985',
  sex: 'M',
  department_id: departmentId,
  email: 'john.test@example.com',
  mobile_phone: '6179876543',
  address1: '123 Main St',
  city: 'Boston',
  state: 'MA',
  zip: '02101'
});
// Returns: { patientid: "61378" }

// Step 3: Search for the patient
const searchResults = await mcpClient.callTool('search_patients', {
  lastname: 'Test',
  dob: '05/20/1985'
});

// Step 4: List providers
const providers = await mcpClient.callTool('list_providers', {
  specialty: 'Family Medicine'
});
```

---

## ⚠️ Important Notes

### Sandbox vs Production

**Sandbox Environment:**
- ✅ Patient registration workflows
- ✅ Demographics and search
- ✅ Department and provider listing
- ❌ Clinical data (allergies, prescriptions, problems, vitals, labs)
- ❌ Appointment creation
- ❌ E-prescribing
- ❌ Drug interaction checking

**Production Environment:**
Requires:
- Full athenahealth production API access
- Clinical endpoints enabled
- E-prescribing licenses and integrations
- Scheduling templates configured
- Provider credentials (NPI, DEA numbers)
- HIPAA compliance measures

### Phone Number Requirements
- ✅ MUST use valid North American area codes (617, 212, 415, etc.)
- ❌ CANNOT use 555 (reserved for fictional use)

### Date Formats
- ✅ MM/DD/YYYY (e.g., 05/20/1985)
- ✅ YYYY-MM-DD (e.g., 1985-05-20)

---

## Security and HIPAA Compliance

### Data Protection
- All sensitive healthcare data is automatically sanitized in logs
- Patient identifiers are redacted in audit logs
- API communications use form-urlencoded for POST requests
- Access controls prevent unauthorized data access

### Audit Logging
- All data access is logged with timestamps
- User actions are tracked for compliance
- Failed access attempts are recorded
- Audit logs are stored separately with extended retention

### Best Practices
1. **Environment Security**: Store credentials in environment variables, never in code
2. **Access Controls**: Implement role-based access controls
3. **Data Minimization**: Only request necessary data
4. **Regular Audits**: Review audit logs regularly
5. **Secure Deployment**: Use secure deployment practices

---

## API Rate Limits

athenahealth API has rate limits:
- **Production**: 1000 requests per minute
- **Sandbox**: 100 requests per minute

The server automatically handles rate limiting and implements exponential backoff for failed requests.

---

## Error Handling

The server provides comprehensive error handling:

- **Authentication Errors**: Automatic token refresh
- **API Errors**: Structured error responses with details
- **Network Errors**: Retry logic with exponential backoff
- **Validation Errors**: Input validation with detailed messages
- **Sandbox Limitations**: Graceful handling with informative error messages

---

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Build Project
```bash
npm run build
```

---

## Architecture

The codebase is modularized for maintainability:

- **[src/mcp-server.ts](src/mcp-server.ts)** - Main MCP server (323 lines)
- **[src/handlers/tool-handlers.ts](src/handlers/tool-handlers.ts)** - Tool implementations (444 lines)
- **[src/handlers/prompt-handlers.ts](src/handlers/prompt-handlers.ts)** - Prompt generators (125 lines)
- **[src/handlers/resource-handlers.ts](src/handlers/resource-handlers.ts)** - Resource handlers (189 lines)
- **[src/definitions/tools.ts](src/definitions/tools.ts)** - Tool schemas (168 lines)
- **[src/services/athenahealth-client.ts](src/services/athenahealth-client.ts)** - API client

---

## Documentation

- **[athenahealth-mcp-tools-readme.md](athenahealth-mcp-tools-readme.md)** - Complete tool reference guide
- **[athenahealth API Documentation](https://docs.athenahealth.com/)** - Official API docs
- **[Developer Portal](https://developer.athenahealth.com/)** - athenahealth developer resources

---

## Support

For support and questions:
- Create an issue in the GitHub repository
- Review the comprehensive [tool reference guide](athenahealth-mcp-tools-readme.md)
- Contact athenahealth Developer Support: developer-support@athenahealth.com

---

## Changelog

### Version 1.1.0
- Refactored codebase into modular architecture
- Fixed form-urlencoded POST request formatting for all endpoints
- Added graceful handling of sandbox limitations
- Enhanced medication_review prompt with sandbox support
- Improved error messages with detailed API responses
- Created comprehensive tool reference documentation

### Version 1.0.0
- Initial release
- Basic MCP server implementation
- Patient data access
- Prescription management
- Clinical decision support prompts
- HIPAA-compliant logging
- OAuth 2.0 authentication

---

**⚠️ Important**: This software handles sensitive healthcare data. Ensure you comply with all applicable healthcare regulations including HIPAA, HITECH, and other relevant standards in your jurisdiction.

**📖 For detailed tool specifications and production requirements, see [athenahealth-mcp-tools-readme.md](athenahealth-mcp-tools-readme.md)**
