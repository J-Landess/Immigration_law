/** Standard navigation — pass active slug: home | about | tax | immigration | free | pricing | retain | contact */
window.renderSiteNav = function renderSiteNav(active, labels) {
  const L = labels || {
    home: 'Home',
    about: 'About Us',
    tax: 'Tax Services',
    immigration: 'Immigration',
    free: 'Free Resources',
    pricing: 'Pricing',
    retain: 'Retain Attorney',
    contact: 'Contact'
  };
  const links = [
    { slug: 'home', href: 'index.html', label: L.home },
    { slug: 'about', href: 'about-us.html', label: L.about },
    { slug: 'tax', href: 'tax-services.html', label: L.tax },
    { slug: 'immigration', href: 'immigration-services.html', label: L.immigration },
    { slug: 'free', href: 'free-resources.html', label: L.free },
    { slug: 'pricing', href: 'pricing.html', label: L.pricing },
    { slug: 'retain', href: 'retain.html', label: L.retain },
    { slug: 'contact', href: 'intake.html', label: L.contact }
  ];
  const el = document.getElementById('siteNav');
  if (!el) return;
  el.innerHTML = links.map(link => {
    if (link.slug === active) {
      return `<span class="active">${link.label}</span>`;
    }
    return `<a href="${link.href}">${link.label}</a>`;
  }).join('');
};

window.renderSiteFooter = function renderSiteFooter(extraHtml) {
  const el = document.getElementById('siteFooter');
  if (!el) return;
  el.innerHTML = `
    <nav class="footer-links" aria-label="Legal">
      <a href="privacy.html">Privacy</a>
      <a href="terms.html">Terms</a>
      <a href="disclaimer.html">Legal Disclaimer</a>
      <a href="accessibility.html">Accessibility</a>
      <a href="hardship.html">Financial Assistance</a>
    </nav>
    ${extraHtml || ''}
  `;
};
