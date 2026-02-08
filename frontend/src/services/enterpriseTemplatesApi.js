/**
 * Mock API service for Enterprise Template Management.
 * Replace with real fetch/axios calls when backend is available.
 */

const API_BASE = '/api/v1'; // base path for future REST API

// Document types for templates
export const DOCUMENT_TYPES = ['Invoice', 'Bill', 'Statement', 'Receipt', 'Contract', 'Form', 'Other'];

// Template status enum
export const TEMPLATE_STATUS = { ACTIVE: 'Active', TRAINING: 'Training', DISABLED: 'Disabled' };

// Dummy templates for list/table
export const MOCK_TEMPLATES = [
  {
    id: 'tpl_001',
    name: 'Standard Invoice',
    templateId: 'inv_std_001',
    documentType: 'Invoice',
    status: 'Active',
    lastUpdated: '2025-02-07T14:30:00Z',
    version: '1.2.0',
    fieldCount: 12,
  },
  {
    id: 'tpl_002',
    name: 'Utility Bill',
    templateId: 'bill_util_002',
    documentType: 'Bill',
    status: 'Active',
    lastUpdated: '2025-02-06T09:15:00Z',
    version: '2.0.0',
    fieldCount: 8,
  },
  {
    id: 'tpl_003',
    name: 'Bank Statement',
    templateId: 'stmt_bank_003',
    documentType: 'Statement',
    status: 'Training',
    lastUpdated: '2025-02-08T11:00:00Z',
    version: '0.9.0',
    fieldCount: 15,
  },
  {
    id: 'tpl_004',
    name: 'Vendor Receipt',
    templateId: 'rcpt_vendor_004',
    documentType: 'Receipt',
    status: 'Disabled',
    lastUpdated: '2025-01-20T16:45:00Z',
    version: '1.0.0',
    fieldCount: 6,
  },
  {
    id: 'tpl_005',
    name: 'NDA Contract',
    templateId: 'contract_nda_005',
    documentType: 'Contract',
    status: 'Active',
    lastUpdated: '2025-02-05T08:00:00Z',
    version: '1.1.0',
    fieldCount: 10,
  },
];

// Dummy usage analytics
export const MOCK_USAGE = {
  documentsProcessed: 12450,
  successRate: 98.2,
  thisMonth: 3420,
  lastMonth: 2890,
};

// Dummy support/account manager
export const MOCK_SUPPORT = {
  accountManager: { name: 'Sarah Chen', email: 'sarah.chen@autodoc.ai', phone: '+1 (555) 123-4567' },
  sla: '99.9% uptime • 4h response',
  supportAvailable: true,
};

// Dummy audit log entries
export const MOCK_AUDIT_LOG = [
  { id: 1, action: 'Template updated', user: 'admin@company.com', role: 'Admin', timestamp: '2025-02-08T10:30:00Z', details: 'Standard Invoice - fields changed' },
  { id: 2, action: 'Template created', user: 'editor@company.com', role: 'Editor', timestamp: '2025-02-07T14:00:00Z', details: 'Bank Statement' },
  { id: 3, action: 'Template disabled', user: 'admin@company.com', role: 'Admin', timestamp: '2025-01-20T16:45:00Z', details: 'Vendor Receipt' },
  { id: 4, action: 'Training started', user: 'editor@company.com', role: 'Editor', timestamp: '2025-02-08T09:00:00Z', details: 'Bank Statement' },
];

// Dummy training progress
export const MOCK_TRAINING = {
  templateId: 'tpl_003',
  templateName: 'Bank Statement',
  status: 'Training',
  progress: 67,
  confidenceScore: 0.89,
  estimatedCompletion: '2025-02-08T18:00:00Z',
};

// Dummy sample fields for a template
export const MOCK_FIELDS = [
  { id: 'f1', name: 'invoice_number', label: 'Invoice Number', type: 'text', required: true, confidence: 0.95 },
  { id: 'f2', name: 'date', label: 'Date', type: 'date', required: true, confidence: 0.92 },
  { id: 'f3', name: 'vendor', label: 'Vendor', type: 'text', required: true, confidence: 0.88 },
  { id: 'f4', name: 'total', label: 'Total Amount', type: 'currency', required: true, confidence: 0.97 },
];

/**
 * Fetch all templates (mock).
 */
export async function fetchTemplates() {
  await delay(400);
  return { data: [...MOCK_TEMPLATES], total: MOCK_TEMPLATES.length };
}

/**
 * Create template (mock).
 */
export async function createTemplate(payload) {
  await delay(500);
  const id = `tpl_${Date.now()}`;
  const templateId = `tpl_${String(Date.now()).slice(-6)}`;
  return {
    data: {
      id,
      templateId,
      name: payload.name ?? 'New Template',
      documentType: payload.documentType ?? 'Invoice',
      status: TEMPLATE_STATUS.TRAINING,
      lastUpdated: new Date().toISOString(),
      version: payload.version ?? '0.1.0',
      fieldCount: payload.fields?.length ?? 0,
    },
  };
}

/**
 * Update template (mock).
 */
export async function updateTemplate(id, payload) {
  await delay(400);
  return { data: { id, ...payload, lastUpdated: new Date().toISOString() } };
}

/**
 * Delete template (mock).
 */
export async function deleteTemplate(id) {
  await delay(300);
  return { success: true };
}

/**
 * Fetch template by id (mock).
 */
export async function fetchTemplateById(id) {
  await delay(300);
  const t = MOCK_TEMPLATES.find((x) => x.id === id) || MOCK_TEMPLATES[0];
  return { data: { ...t, fields: MOCK_FIELDS } };
}

/**
 * Fetch usage analytics (mock).
 */
export async function fetchUsageAnalytics() {
  await delay(350);
  return { data: MOCK_USAGE };
}

/**
 * Fetch audit log (mock).
 */
export async function fetchAuditLog() {
  await delay(300);
  return { data: MOCK_AUDIT_LOG };
}

/**
 * Fetch training status (mock).
 */
export async function fetchTrainingStatus(templateId) {
  await delay(250);
  return { data: { ...MOCK_TRAINING, templateId: templateId || MOCK_TRAINING.templateId } };
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
