require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const {
  createRetentionRecord,
  getPayment,
  updatePayment,
  markWebhookProcessed,
  listPaymentsForAdmin,
  sanitizePublic,
  audit
} = require('./store');

const app = express();
const PORT = process.env.PORT || 10000;
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

const hourlyCents = parseInt(process.env.ATTORNEY_HOURLY_RATE_CENTS || '20000', 10);
const retainerCents = parseInt(process.env.RETAINER_DEPOSIT_CENTS || '40000', 10);
const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true';
const publicSite = process.env.PUBLIC_SITE_URL || 'http://localhost:8080';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || publicSite)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  }
}));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'immigration-law-payments-api' });
});

app.get('/api/config', (_req, res) => {
  res.json({
    hourlyRateCents: hourlyCents,
    hourlyRateDisplay: `$${(hourlyCents / 100).toFixed(2)}/hr`,
    retainerDepositCents: retainerCents,
    retainerDepositDisplay: `$${(retainerCents / 100).toFixed(2)}`,
    paymentsEnabled,
    stripeConfigured: Boolean(stripeKey && paymentsEnabled),
    zelle: process.env.ZELLE_CONTACT
      ? { displayName: process.env.ZELLE_DISPLAY_NAME || 'Firm Zelle', contact: process.env.ZELLE_CONTACT }
      : null,
    chime: process.env.CHIME_CONTACT
      ? { displayName: process.env.CHIME_DISPLAY_NAME || 'Firm Chime', contact: process.env.CHIME_CONTACT }
      : null,
    disclosures: {
      hourlyRateNote: 'Hourly billing is separate from the initial deposit amount shown at checkout.',
      engagementNote: 'Payment does not by itself create an attorney–client relationship. Representation begins only after conflicts check and a signed engagement agreement.',
      depositNote: 'Deposit terms (refundability, trust account) are provided in the engagement agreement before work begins.'
    }
  });
});

app.post('/api/retain/intake', express.json(), (req, res) => {
  const { practiceArea, serviceType, contactEmail, contactName, notes } = req.body || {};
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  const record = createRetentionRecord({
    practiceArea,
    serviceType,
    contactEmail: contactEmail || null,
    contactName: contactName || null,
    notes
  });
  res.status(201).json({
    referenceId: record.id,
    next: 'select-payment-method',
    public: sanitizePublic(record)
  });
});

app.get('/api/payments/:referenceId', (req, res) => {
  const record = getPayment(req.params.referenceId);
  if (!record) return res.status(404).json({ error: 'Not found' });
  res.json(sanitizePublic(record));
});

app.post('/api/checkout/stripe', express.json(), async (req, res) => {
  if (!stripe || !paymentsEnabled) {
    return res.status(503).json({
      error: 'Stripe checkout is not enabled. Set STRIPE_SECRET_KEY and PAYMENTS_ENABLED=true after owner confirmation.'
    });
  }
  const { referenceId } = req.body || {};
  const record = getPayment(referenceId);
  if (!record) return res.status(404).json({ error: 'Invalid reference' });
  if (record.status === 'PAID') return res.status(409).json({ error: 'Already paid' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: record.id,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: retainerCents,
          product_data: {
            name: 'Attorney retainer deposit',
            description: 'Initial deposit — see engagement terms on website'
          }
        }
      }],
      success_url: `${publicSite}/payment-success.html?ref=${encodeURIComponent(record.id)}`,
      cancel_url: `${publicSite}/payment-cancel.html?ref=${encodeURIComponent(record.id)}`,
      metadata: {
        reference_id: record.id,
        practice_area: record.practiceArea
      }
    });

    updatePayment(record.id, {
      status: 'PENDING',
      method: 'stripe',
      amountCents: retainerCents,
      stripeSessionId: session.id
    });
    audit('checkout.session.created', { id: record.id, sessionId: session.id });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    audit('checkout.session.error', { message: err.message });
    res.status(500).json({ error: 'Unable to create checkout session' });
  }
});

app.post('/api/payments/manual', express.json(), (req, res) => {
  const { referenceId, method, payerNote } = req.body || {};
  if (!['zelle', 'chime'].includes(method)) {
    return res.status(400).json({ error: 'Invalid method' });
  }
  if (method === 'zelle' && !process.env.ZELLE_CONTACT) {
    return res.status(503).json({ error: 'Zelle is not configured' });
  }
  if (method === 'chime' && !process.env.CHIME_CONTACT) {
    return res.status(503).json({ error: 'Chime is not configured' });
  }
  const record = getPayment(referenceId);
  if (!record) return res.status(404).json({ error: 'Invalid reference' });

  const updated = updatePayment(record.id, {
    status: 'UNDER_REVIEW',
    method,
    amountCents: retainerCents,
    payerNote: payerNote ? String(payerNote).slice(0, 200) : null
  });
  audit('payment.manual.submitted', { id: record.id, method });
  res.json({
    message: 'Payment reported. Funds remain unverified until the firm confirms receipt.',
    public: sanitizePublic(updated),
    instructions: method === 'zelle'
      ? { contact: process.env.ZELLE_CONTACT, amount: retainerCents / 100 }
      : { contact: process.env.CHIME_CONTACT, amount: retainerCents / 100 }
  });
});

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe) return res.status(503).send('Stripe not configured');
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(503).send('Webhook secret not configured');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    audit('webhook.signature.failed', { message: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (!markWebhookProcessed(event.id)) {
    return res.json({ received: true, duplicate: true });
  }

  if (event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object;
    const ref = session.client_reference_id || session.metadata?.reference_id;
    if (ref && session.payment_status === 'paid') {
      updatePayment(ref, { status: 'PAID', method: 'stripe', amountCents: retainerCents });
      audit('payment.stripe.paid', { id: ref, sessionId: session.id });
    }
  }
  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object;
    const ref = session.client_reference_id || session.metadata?.reference_id;
    if (ref) updatePayment(ref, { status: 'FAILED', method: 'stripe' });
  }

  res.json({ received: true });
});

function requireAdmin(req, res, next) {
  const key = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/admin/payments', requireAdmin, (_req, res) => {
  res.json({ payments: listPaymentsForAdmin() });
});

app.patch('/api/admin/payments/:id', requireAdmin, express.json(), (req, res) => {
  const { status } = req.body || {};
  const allowed = ['PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED', 'UNDER_REVIEW'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const updated = updatePayment(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  audit('admin.payment.updated', { id: req.params.id, status });
  res.json(updated);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Payments API listening on ${PORT}`);
});
