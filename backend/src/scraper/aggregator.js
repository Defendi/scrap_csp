function aggregateCsp(allPages) {
  const domains = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"], // unsafe-inline by default for styles
    'img-src': ["'self'", "data:"],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-src': ["'self'"],
    'media-src': ["'self'"]
  };

  allPages.forEach(page => {
    page.resources.forEach(res => {
      const directive = mapResourceType(res.type);
      if (res.isExternal && !domains[directive].includes(res.domain)) {
        domains[directive].push(res.domain);
      }
    });
  });

  // Construir a string de regra CSP final
  let rule = "";
  for (const [key, values] of Object.entries(domains)) {
    if (values.length > 0) {
      rule += `${key} ${values.join(' ')}; `;
    }
  }

  // Adicionar diretivas de segurança padrão
  rule += "object-src 'none'; base-uri 'self'; upgrade-insecure-requests;";

  return rule.trim();
}

function mapResourceType(type) {
  const map = {
    'script': 'script-src',
    'style': 'style-src',
    'img': 'img-src',
    'font': 'font-src',
    'api': 'connect-src',
    'frame': 'frame-src',
    'media': 'media-src'
  };
  return map[type] || 'default-src';
}

module.exports = { aggregateCsp };
