const db = require('./db');
const { discoverPages } = require('./scraper/discovery');
const { scanPage } = require('./scraper/scanner');
const { aggregateCsp } = require('./scraper/aggregator');
require('dotenv').config();

const SLEEP_MS = 5000;

async function processTasks() {
  console.log('[Worker] Iniciando processamento de tarefas...');

  // Auto-recuperação: Volta tarefas presas em PROCESSING (devido a falhas antigas ou crash do container) para PENDING
  try {
    const resetResult = await db.query(
      "UPDATE tasks SET status = 'PENDING', updated_at = NOW() WHERE status = 'PROCESSING' RETURNING id"
    );
    if (resetResult.rows.length > 0) {
      console.log(`[Worker] Reparado: ${resetResult.rows.length} tarefas travadas foram devolvidas para PENDING.`);
    }
  } catch (err) {
    console.error('[Worker] Falha ao tentar resetar tarefas presas:', err.message);
  }

  while (true) {
    let currentTask = null;
    try {
      // 1. Buscar a tarefa PENDENTE mais antiga
      const result = await db.query(
        'UPDATE tasks SET status = \'PROCESSING\', updated_at = NOW() WHERE id = (SELECT id FROM tasks WHERE status = \'PENDING\' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *'
      );

      if (result.rows.length === 0) {
        await new Promise(res => setTimeout(res, SLEEP_MS));
        continue;
      }

      currentTask = result.rows[0];
      const task = currentTask;
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
        const startTime = Date.now();
        const scanResult = await scanPage(url);
        const executionTime = Date.now() - startTime;
        
        // Salvar recursos encontrados -> Protegido com filtro para evitar Null values no db se algo crachar mal
        for (const res of scanResult.resources) {
            if (!res.domain || !res.url) continue;
            await db.query(
               'INSERT INTO resources_found (page_id, type, domain, source_url, duration_ms, has_error, error_message) VALUES ($1, $2, $3, $4, $5, $6, $7)',
               [pageId, res.type, res.domain, res.url, res.duration_ms, res.has_error || false, res.error_message]
            );
        }

        // Atualizar registro da página
        let status = scanResult.status === 'FAILED' ? 'FAILED' : 'SCRAPED';
        await db.query(
          'UPDATE pages_scanned SET status = $1, csp_header_found = $2, vulnerabilities = $3, error_message = $4, execution_time_ms = $5 WHERE id = $6',
          [status, scanResult.cspHeader || null, JSON.stringify(scanResult.vulnerabilities || []), scanResult.error || null, executionTime, pageId]
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
      console.error('[Worker] Erro crítico processing task:', err.message);
      if (currentTask && currentTask.id) {
         try {
           await db.query('UPDATE tasks SET status = \'FAILED\', updated_at = NOW() WHERE id = $1', [currentTask.id]);
           console.log(`[Worker] Task ID: ${currentTask.id} abortada e marcada como FAILED no BD.`);
         } catch (dbErr) {
           console.error('[Worker] DB Error ao tentar setar task pra FAILED:', dbErr.message);
         }
      }
      await new Promise(res => setTimeout(res, SLEEP_MS));
    }
  }
}

// Iniciar o worker
processTasks();
