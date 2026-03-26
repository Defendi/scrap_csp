const db = require('./db');
const { discoverPages } = require('./scraper/discovery');
const { scanPage } = require('./scraper/scanner');
const { aggregateCsp } = require('./scraper/aggregator');
require('dotenv').config();

const SLEEP_MS = 5000;

async function processTasks() {
  console.log('[Worker] Iniciando processamento de tarefas...');

  while (true) {
    try {
      // 1. Buscar a tarefa PENDENTE mais antiga
      const result = await db.query(
        'UPDATE tasks SET status = \'PROCESSING\', updated_at = NOW() WHERE id = (SELECT id FROM tasks WHERE status = \'PENDING\' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *'
      );

      if (result.rows.length === 0) {
        await new Promise(res => setTimeout(res, SLEEP_MS));
        continue;
      }

      const task = result.rows[0];
      console.log(`[Worker] Processando Task ID: ${task.id} para ${task.target_url}`);

      // FASE 1: Descoberta Recursiva
      const urlsToScan = await discoverPages(task.target_url);
      console.log(`[Worker] Descobertas ${urlsToScan.length} páginas para escanear.`);

      const allPageResults = [];

      // FASE 2: Escaneamento Individual de cada página
      for (const url of urlsToScan) {
        // Criar registro da página no banco
        const pageRecord = await db.query(
          'INSERT INTO pages_scanned (task_id, url) VALUES ($1, $2) RETURNING id',
          [task.id, url]
        );
        const pageId = pageRecord.rows[0].id;

        // Escanear
        const scanResult = await scanPage(url);
        
        // Salvar recursos encontrados
        for (const res of scanResult.resources) {
            await db.query(
               'INSERT INTO resources_found (page_id, type, domain, source_url) VALUES ($1, $2, $3, $4)',
               [pageId, res.type, res.domain, res.url]
            );
        }

        // Atualizar registro da página
        await db.query(
          'UPDATE pages_scanned SET status = $1, csp_header_found = $2, vulnerabilities = $3 WHERE id = $4',
          [scanResult.status, scanResult.cspHeader, JSON.stringify(scanResult.vulnerabilities), pageId]
        );

        allPageResults.push(scanResult);
      }

      // FASE 3: Agregação e Sugestão Final
      const finalCsp = aggregateCsp(allPageResults);

      // Finalizar a Task
      await db.query(
        'UPDATE tasks SET status = \'COMPLETED\', suggested_rule = $1, updated_at = NOW() WHERE id = $2',
        [finalCsp, task.id]
      );
      console.log(`[Worker] Task ID: ${task.id} finalizada com sucesso.`);

    } catch (err) {
      console.error('[Worker] Erro crítico:', err.message);
      // Aqui poderíamos atualizar a task para 'FAILED' se o erro for fatal para a tarefa
      await new Promise(res => setTimeout(res, SLEEP_MS));
    }
  }
}

// Iniciar o worker
processTasks();
