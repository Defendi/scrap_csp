const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

async function scanPage(url) {
  const result = {
    url,
    resources: [],
    cspHeader: null,
    vulnerabilities: [],
    status: 'SCRAPED',
    error: null
  };
  let browser = null;

  try {
    console.log(`[Scanner] [1/2] Análise Estática iniciada: ${url}`);
    try {
      const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
      result.cspHeader = response.headers['content-security-policy'] || null;
      
      const $ = cheerio.load(response.data);
      
      // Captura estática básica
      $('script[src]').each((_, el) => result.resources.push({ type: 'script', url: $(el).attr('src'), duration_ms: null, has_error: false, error_message: null }));
      $('link[rel="stylesheet"]').each((_, el) => result.resources.push({ type: 'style', url: $(el).attr('href'), duration_ms: null, has_error: false, error_message: null }));
      $('img[src]').each((_, el) => result.resources.push({ type: 'img', url: $(el).attr('src'), duration_ms: null, has_error: false, error_message: null }));
    } catch (estaticErr) {
      console.warn(`[Scanner] Aviso: Falha na análise estática de ${url} (${estaticErr.message}). Prosseguindo apenas com Puppeteer.`);
    }

    console.log(`[Scanner] [2/2] Análise Dinâmica (Puppeteer) iniciada: ${url}`);
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    
    const resourceTracker = new Map();
    
    // Monitorar rede e bloquar SSRF em tempo real
    page.on('request', req => {
      let parsed;
      try {
        parsed = new URL(req.url());
        // Bloqueia tentativas de ler arquivos locais ou nuvem AWS/GCP
        if (parsed.protocol === 'file:' || parsed.hostname.startsWith('169.254.')) {
           return req.abort('accessdenied');
        }
      } catch(e) {}

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
      const resObj = {
        type: resType,
        url: req.url(),
        start_time: Date.now(),
        duration_ms: null,
        has_error: false,
        error_message: null
      };

      resourceTracker.set(req, resObj);
      result.resources.push(resObj);
      
      req.continue();
    });

    page.on('requestfinished', req => {
      const resObj = resourceTracker.get(req);
      if (resObj) {
         resObj.duration_ms = Date.now() - resObj.start_time;
      }
    });

    page.on('requestfailed', req => {
      const resObj = resourceTracker.get(req);
      if (resObj) {
         resObj.has_error = true;
         resObj.error_message = req.failure()?.errorText || 'Falha de requisição ou bloqueio externo';
         resObj.duration_ms = Date.now() - resObj.start_time;
      }
    });

    try {
      // waitUntil DOMContentLoaded evita travar por iframes/anúncios pesados
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Dar uma "gordurinha" pro script async agir
      await new Promise(res => setTimeout(res, 3000));
    } catch (timeoutErr) {
       console.warn(`[Scanner] Timeout parcial ignorado. Recuperando scripts do cache visual até o timeout... -> ${timeoutErr.message}`);
    }

  } catch (err) {
    console.error(`[Scanner] Erro grave ao capturar ${url}:`, err.message);
    result.status = 'FAILED';
    result.error = err.message;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (browserErr) {
        console.warn(`[Scanner] Falha ao encerrar browser: ${browserErr.message}`);
      }
    }
  }

  // 3. Limpeza e normalização de recursos (garantido tentar rodar para não retornar NULL objects)
  result.resources = normalizeResources(result.resources, url);

  // 4. Auditoria básica de vulnerabilidades no CSP atual
  if (result.cspHeader) {
     if (result.cspHeader.includes('unsafe-inline')) result.vulnerabilities.push('Uso de unsafe-inline detectado');
     if (result.cspHeader.includes('unsafe-eval')) result.vulnerabilities.push('Uso de unsafe-eval detectado');
     if (result.cspHeader.includes('*')) result.vulnerabilities.push('Uso de curinga (*) perigoso em diretivas de origem');
  } else {
     if (result.status !== 'FAILED') {
        result.vulnerabilities.push('Site não possui política CSP implementada');
     }
  }

  return result;
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
          isExternal: u.hostname !== baseDomain,
          duration_ms: r.duration_ms || null,
          has_error: r.has_error || false,
          error_message: r.error_message || null
        };
      } catch (e) {
        return null;
      }
    })
    .filter(r => r !== null);
}

module.exports = { scanPage };
