const axios = require('axios');
const cheerio = require('cheerio');
// Descoberta via Regex e Crawler Interno

async function discoverPages(baseUrl, maxPages = 10, maxDepth = 2) {
  const discovered = new Set([baseUrl]);
  const queue = [{ url: baseUrl, depth: 0 }];
  const baseDomain = new URL(baseUrl).hostname;

  // Tentar Sitemap primeiro
  try {
    const sitemapUrl = `${new URL(baseUrl).origin}/sitemap.xml`;
    const response = await axios.get(sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
    if (response.status === 200) {
      // Simplificado: usar regex simples para urls de sitemap em XML se não usar lib
      const urls = response.data.match(/<loc>(.*?)<\/loc>/g);
      if (urls) {
        urls.forEach(u => {
          const cleanUrl = u.replace('<loc>', '').replace('</loc>', '');
          if (new URL(cleanUrl).hostname === baseDomain && discovered.size < maxPages) {
             discovered.add(cleanUrl);
          }
        });
      }
    }
  } catch (e) {
    console.log('[Discovery] Sitemap não encontrado ou inacessível no diretório raiz.');
  }

  // Se já atingiu limite, retorna
  if (discovered.size >= maxPages) return Array.from(discovered);

  // Crawler de Link Internos para profundidade
  while (queue.length > 0 && discovered.size < maxPages) {
    const { url, depth } = queue.shift();
    if (depth >= maxDepth) continue;

    try {
      const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
      const $ = cheerio.load(response.data);
      
      $('a[href]').each((_, el) => {
        let href = $(el).attr('href');
        if (!href) return;

        try {
          const absoluteUrl = new URL(href, baseUrl).toString();
          const parsedUrl = new URL(absoluteUrl);

          if (parsedUrl.hostname === baseDomain && !discovered.has(absoluteUrl) && discovered.size < maxPages) {
             discovered.add(absoluteUrl);
             queue.push({ url: absoluteUrl, depth: depth + 1 });
          }
        } catch (e) {}
      });
    } catch (err) {
      console.error(`[Discovery] Erro ao rastrear ${url}:`, err.message);
    }
  }

  return Array.from(discovered);
}

module.exports = { discoverPages };
