const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('[Setup DB] Conectando ao banco...');
    await client.connect();
    
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('[Setup DB] Executando schema.sql...');
    await client.query(schema);

    console.log('[Setup DB] Banco de dados configurado com sucesso! 🚀');
  } catch (err) {
    console.error('[Setup DB] Erro ao configurar banco:', err.message);
    if (err.code === '3D000') {
       console.log('\x1b[31mErro: O banco de dados especificado no .env não existe. Por favor, crie-o primeiro no PostgreSQL.\x1b[0m');
    }
  } finally {
    await client.end();
  }
}

setup();
