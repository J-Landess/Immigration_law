# Project audit (Phase 1)

## Stack (as inspected)

| Layer | Technology |
|-------|------------|
| Frontend | Static HTML, CSS (`theme.css`), inline/page JS |
| Hosting (current) | GitHub Pages (`main` branch) |
| Forms (existing) | Formspree (`intake.html`) |
| Backend (added) | Node.js + Express in `/server` (deploy separately, e.g. Render) |
| Database (added) | JSON file store (`server/data/`) — replace with Postgres when needed |
| Auth | None for public site; admin routes use `ADMIN_API_KEY` |
| Stripe | Checkout Sessions + webhooks in `/server` (test mode until configured) |

## Existing routes

- `index.html` — home
- `about-us.html`, `what-we-do.html`, `tax-shelter.html`, `intake.html`
- `images/` — firm branding assets

## Gaps addressed in this overhaul

- Privacy-first About Us and legal disclosure pages
- Free path (`free-resources.html`, document generators)
- Paid retention path (`retain.html`, `pricing.html`)
- Stripe + manual Zelle/Chime workflows via API
- Expanded navigation and footer
- Tax marketing tied to verified IRS/OBBBA sources (with disclaimers)

## Not claimed without implementation

- End-to-end encryption
- Full anonymous representation or payment
- Live Stripe/Zelle/Chime until env vars and owner confirmation
- Guaranteed pro bono or tax outcomes
