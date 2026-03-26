const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Rotas de Teste
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Importar rotas
const authRoutes = require('./auth/routes');
const taskRoutes = require('./tasks/routes');
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.listen(PORT, () => {
  console.log(`[Server] Rodando na porta ${PORT}`);
});
