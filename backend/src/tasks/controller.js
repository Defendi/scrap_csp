const db = require('../db');

const createTask = async (req, res) => {
  const { target_url } = req.body;
  if (!target_url) return res.status(400).json({ error: 'URL alvo é obrigatória' });

  try {
    const result = await db.query(
      'INSERT INTO tasks (target_url) VALUES ($1) RETURNING *',
      [target_url]
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
    
    // Para cada página, buscar os recursos se necessário (ou simplificar o JSONB de resultados na tabela de página)
    res.json({
      ...taskResult.rows[0],
      pages: pagesResult.rows
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
