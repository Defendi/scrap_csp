const db = require('../db');

const createTask = async (req, res) => {
  const { target_url } = req.body;
  if (!target_url) return res.status(400).json({ error: 'URL alvo é obrigatória' });

  // 1. Sanitização Estrutural e Protocolos
  let parsedUrl;
  try {
    parsedUrl = new URL(target_url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
       return res.status(400).json({ error: 'Somente links HTTP e HTTPS são suportados.' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'URL inválida ou malformada' });
  }

  // 2. Proteção Core SSRF (Bloqueio de Nuvem). Localhost permitido sob demanda do Dev.
  if (parsedUrl.hostname.startsWith('169.254.')) {
     return res.status(403).json({ error: 'Endereço bloqueado por políticas de segurança (SSRF Protection).' });
  }

  try {
    const result = await db.query(
      'INSERT INTO tasks (target_url) VALUES ($1) RETURNING *',
      [parsedUrl.toString()] // URL normalizada
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor: ' + err.message });
  }
};

const listTasks = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor: ' + err.message });
  }
};

const getTask = async (req, res) => {
  const { id } = req.params;
  try {
    const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) return res.status(404).json({ error: 'Tarefa não encontrada' });

    const pagesResult = await db.query('SELECT * FROM pages_scanned WHERE task_id = $1', [id]);
    
    // Descobre o domínio root pra fazer o filtro
    const targetUrl = taskResult.rows[0].target_url;
    let baseDomain = '';
    try { baseDomain = new URL(targetUrl).hostname.replace('www.', ''); } catch(e){}

    // Busca agregada dos domínios com a lista de cada requisição interna via json_agg
    const resourcesResult = await db.query(`
      SELECT domain, type,
             json_agg(json_build_object(
                'url', source_url,
                'duration_ms', duration_ms,
                'has_error', has_error,
                'error_message', error_message
             )) as details
      FROM resources_found 
      WHERE page_id IN (SELECT id FROM pages_scanned WHERE task_id = $1)
      GROUP BY domain, type
      ORDER BY type ASC, domain ASC
    `, [id]);

    // Filtra para mandar só os que verdadeiramente vieram de "fora" pro front
    const externalDomains = resourcesResult.rows.filter(r => {
      if (!baseDomain || !r.domain) return true;
      const d = r.domain.replace('www.', '');
      return d !== baseDomain && !d.endsWith('.' + baseDomain);
    });

    res.json({
      ...taskResult.rows[0],
      pages: pagesResult.rows,
      external_domains: externalDomains
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor: ' + err.message });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Tarefa removida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor: ' + err.message });
  }
};

module.exports = { createTask, listTasks, getTask, deleteTask };
