# Owner configuration checklist

Complete these before enabling **live** payments or publishing payment instructions.

## Required decisions

1. **Initial retainer / deposit amount** (not the same as $200/hr): set `RETAINER_DEPOSIT_CENTS` in server env (default placeholder: `40000` = $400.00).
2. **Stripe**: Create account, add test keys, configure webhook URL → `POST /api/webhooks/stripe`.
3. **Zelle**: Confirm bank allows business use; set `ZELLE_CONTACT` (email or phone) and display name.
4. **Chime**: Confirm intended pay tag/account; set `CHIME_CONTACT` (no public Chime payment API — manual verification only).
5. **Engagement letter**: When attorney–client relationship begins; whether deposit is refundable; trust vs operating account (consult accountant/bar rules).
6. **Services list**: Confirm which tax/immigration services the firm actually offers.

## Environment variables (`server/.env`)

See `server/.env.example`.

## Frontend API URL

Set in `js/site-config.js` → `apiBaseUrl` to your deployed server (e.g. `https://your-service.onrender.com`).

GitHub Pages cannot run Stripe webhooks; the **server must be deployed** separately.

## Tax marketing

Review `docs/TAX-LAW-SOURCES.md` periodically. Update “last reviewed” dates on `tax-services.html` when IRS guidance changes.
