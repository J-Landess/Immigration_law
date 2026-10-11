const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.log');

const STATUSES = [
  'CREATED',
  'PENDING',
  'PAID',
  'FAILED',
  'CANCELED',
  'REFUNDED',
  'UNDER_REVIEW'
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readPayments() {
  ensureDataDir();
  if (!fs.existsSync(PAYMENTS_FILE)) {
    return { payments: [], processedWebhookEvents: [] };
  }
  return JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8'));
}

function writePayments(data) {
  ensureDataDir();
  fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(data, null, 2));
}

function audit(action, meta = {}) {
  ensureDataDir();
  const line = JSON.stringify({
    at: new Date().toISOString(),
    action,
    ...meta
  });
  fs.appendFileSync(AUDIT_FILE, line + '\n');
}

function createRetentionRecord({ practiceArea, serviceType, contactEmail, contactName, notes }) {
  const data = readPayments();
  const record = {
    id: randomUUID(),
    type: 'RETAINER',
    practiceArea: practiceArea || 'general',
    serviceType: serviceType || 'consultation',
    contactEmail: contactEmail || null,
    contactName: contactName || null,
    notes: notes ? String(notes).slice(0, 500) : null,
    status: 'CREATED',
    method: null,
    amountCents: null,
    stripeSessionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.payments.push(record);
  writePayments(data);
  audit('retention.created', { id: record.id, practiceArea: record.practiceArea });
  return record;
}

function getPayment(id) {
  const data = readPayments();
  return data.payments.find(p => p.id === id) || null;
}

function updatePayment(id, patch) {
  const data = readPayments();
  const idx = data.payments.findIndex(p => p.id === id);
  if (idx === -1) return null;
  data.payments[idx] = {
    ...data.payments[idx],
    ...patch,
    updatedAt: new Date().toISOString()
  };
  writePayments(data);
  return data.payments[idx];
}

function markWebhookProcessed(eventId) {
  const data = readPayments();
  if (!data.processedWebhookEvents) data.processedWebhookEvents = [];
  if (data.processedWebhookEvents.includes(eventId)) return false;
  data.processedWebhookEvents.push(eventId);
  if (data.processedWebhookEvents.length > 5000) {
    data.processedWebhookEvents = data.processedWebhookEvents.slice(-3000);
  }
  writePayments(data);
  return true;
}

function listPaymentsForAdmin() {
  return readPayments().payments.map(sanitizeForAdmin);
}

function sanitizePublic(record) {
  if (!record) return null;
  return {
    id: record.id,
    status: record.status,
    method: record.method,
    amountCents: record.amountCents,
    updatedAt: record.updatedAt
  };
}

function sanitizeForAdmin(record) {
  return { ...record };
}

module.exports = {
  STATUSES,
  createRetentionRecord,
  getPayment,
  updatePayment,
  markWebhookProcessed,
  listPaymentsForAdmin,
  sanitizePublic,
  audit
};
