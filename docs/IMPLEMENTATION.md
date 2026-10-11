# Implementation report (privacy-first overhaul)

## Completed

### Content & UX
- **About Us** rewritten: privacy-first messaging, dual paths, credential placeholders, hardship link
- **Homepage**: privacy banner, free vs retain paths, removed unverified testimonial quotes
- **Tax**: `tax-services.html` with IRS/OBBBA sourced summaries + disclaimers
- **Navigation**: `js/site-nav.js`, footer legal links via `js/site-footer.js`
- **Free path**: `free-resources.html`, `documents/checklist-generator.html` (browser-local generation)
- **Paid path**: `retain.html`, `pricing.html`, `payment-success.html`, `payment-cancel.html`
- **Legal pages**: `privacy.html`, `terms.html`, `disclaimer.html`, `accessibility.html`, `hardship.html`
- **Theme**: Mexican green/white/red palette in `theme.css`

### Payments API (`/server`)
- Express API: retention intake, Stripe Checkout Session, signed webhooks, manual Zelle/Chime → `UNDER_REVIEW`
- Server-side amounts (`RETAINER_DEPOSIT_CENTS`, `ATTORNEY_HOURLY_RATE_CENTS`)
- Admin endpoints (`ADMIN_API_KEY`) to list/update payment status
- JSON store + audit log (replace with DB for production)
- `PAYMENTS_ENABLED=false` by default

### Documentation
- `docs/AUDIT.md`, `docs/CONFIG.md`, `docs/TAX-LAW-SOURCES.md`

## Placeholders / owner action required

| Item | Status |
|------|--------|
| Stripe live/test keys & webhook URL | Not configured |
| `PAYMENTS_ENABLED=true` | Off until owner confirms |
| Zelle/Chime contact details | Empty in `.env` |
| Initial retainer amount | Default $400 — confirm |
| Credential bullets on About | Marked confirm with firm |
| Bar review of privacy/terms | Draft only |
| Deploy API to Render (or similar) | Required for Stripe |
| Set `js/site-config.js` `apiBaseUrl` | Points to localhost by default |

## Tests

Run from `server/`:

```bash
npm install
npm test
```

## Environment variables

See `server/.env.example`.

## Stripe dashboard

1. Create Checkout webhook → `https://YOUR-API/api/webhooks/stripe`
2. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
3. Use test keys until go-live checklist complete

## Zelle / Chime

Manual instructions only; client submission sets `UNDER_REVIEW`; admin marks `PAID` after bank verification.

## Tax claims

OBBBA / Working Families Tax Cuts copy cites IRS URLs in `docs/TAX-LAW-SOURCES.md`. Re-verify before campaigns.

## Blockers for production launch

- GitHub Pages hosts static files only — payment API must be deployed separately with HTTPS
- CORS `ALLOWED_ORIGINS` must include Pages URL
- Owner must confirm trust accounting for deposits
