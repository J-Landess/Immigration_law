/** Public frontend config — no secrets. Point apiBaseUrl at deployed /server instance. */
window.SITE_CONFIG = {
  apiBaseUrl: 'http://localhost:10000',
  firmName: 'Justin Landess Immigration Law Group'
};

async function fetchPublicConfig() {
  try {
    const res = await fetch(`${window.SITE_CONFIG.apiBaseUrl}/api/config`, {
      credentials: 'omit'
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
