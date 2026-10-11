# Justin Landess — Tax & Immigration Law (Las Vegas)

Privacy-first static website with a separate **payments API** for attorney retention (Stripe + manual Zelle/Chime).

## Quick start (frontend)

```bash
python3 -m http.server 8080
# http://localhost:8080/
```

## Payments API (required for retain / Stripe)

```bash
cd server && cp .env.example .env && npm install && npm run dev
```

Set `js/site-config.js` → `apiBaseUrl` to your deployed API URL.

See [docs/CONFIG.md](docs/CONFIG.md) and [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md).

## Key pages

| Page | Purpose |
|------|---------|
| `index.html` | Home — free vs retain paths |
| `about-us.html` | Privacy-first firm story |
| `free-resources.html` | Anonymous-friendly tools |
| `retain.html` | Attorney retention + payment |
| `tax-services.html` | Tax marketing (IRS-sourced disclaimers) |
| `pricing.html` | $200/hr + deposit (from API) |

## Deploy

- **Static site:** GitHub Pages (`main`)
- **API:** Render or similar — see [server/README.md](server/README.md)

## Documentation

- [docs/AUDIT.md](docs/AUDIT.md) — stack audit
- [docs/TAX-LAW-SOURCES.md](docs/TAX-LAW-SOURCES.md) — IRS references for tax copy
