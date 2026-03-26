const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

async function scanPage(url) {
  const result = {
    url,
    resources: [],
    cspHeader: null,
    vulnerabilities: [],
    status: 'SCRAPED'
  };

  try {
    // 1. Análise Estática e Headers
    const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
    result.cspHeader = response.headers['content-security-policy'] || null;
    
    const $ = cheerio.load(response.data);
    
    // Captura estática básica
    $('script[src]').each((_, el) => result.resources.push({ type: 'script', url: $(el).attr('src') }));
    $('link[rel="stylesheet"]').each((_, el) => result.resources.push({ type: 'style', url: $(el).attr('href') }));
    $('img[src]').each((_, el) => result.resources.push({ type: 'img', url: $(el).attr('src') }));

    // 2. Análise Dinâmica (Headless)
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Monitorar rede
    page.on('request', req => {
      const typeMap = {
        'script': 'script',
        'stylesheet': 'style',
        'image': 'img',
        'font': 'font',
        'xhr': 'api',
        'fetch': 'api',
        'document': 'frame'
      };
      
      const resType = typeMap[req.resourceType()] || 'other';
      result.resources.push({
        type: resType,
        url: req.url()
      });
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await browser.close();

    // 3. Limpeza e normalização de recursos
    result.resources = normalizeResources(result.resources, url);

    // 4. Auditoria básica de vulnerabilidades no CSP atual
    if (result.cspHeader) {
       if (result.cspHeader.includes('unsafe-inline')) result.vulnerabilities.push('Uso de unsafe-inline detectado');
       if (result.cspHeader.includes('unsafe-eval')) result.vulnerabilities.push('Uso de unsafe-eval detectado');
       if (result.cspHeader.includes('*')) result.vulnerabilities.push('Uso de curinga (*) perigoso em diretivas de origem');
    } else {
       result.vulnerabilities.push('Site não possui política CSP implementada');
    }

    return result;
  } catch (err) {
    console.error(`[Scanner] Erro ao escanear ${url}:`, err.message);
    return { ...result, status: 'FAILED', error: err.message };
  }
}

function normalizeResources(resources, baseUrl) {
  const seenDomains = new Set();
  const baseDomain = new URL(baseUrl).hostname;

  return resources
    .filter(r => r.url && (r.url.startsWith('http') || r.url.startsWith('//')))
    .map(r => {
      try {
        const fullUrl = r.url.startsWith('//') ? `https:${r.url}` : r.url;
        const u = new URL(fullUrl);
        return {
          type: r.type,
          domain: u.hostname,
          url: fullUrl,
          isExternal: u.hostname !== baseDomain
        };
      } catch (e) {
        return null;
      }
    })
    .filter(r => r !== null);
}

module.exports = { scanPage };
