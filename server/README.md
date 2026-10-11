# Payments API

Deploy this service separately from GitHub Pages (e.g. [Render Web Service](https://render.com/docs/web-services)).

```bash
cp .env.example .env
npm install
npm run dev
```

Bind: `0.0.0.0:$PORT`. Set `ALLOWED_ORIGINS` to your GitHub Pages URL.

Update `js/site-config.js` in the static site with the deployed API URL.
