# 🛡️ Scrap-CSP Analysis

Uma ferramenta robusta para **auditoria recursiva de CSP** (Content Security Policy). O projeto permite escanear sites, identificar vulnerabilidades de cabeçalhos de segurança e sugerir políticas otimizadas baseadas em um inventário completo de recursos (scripts, estilos, imagens) capturados via motor híbrido.

---

## 🛠️ Tecnologias Utilizadas

* **Backend:** Node.js + Express
* **Banco de Dados:** PostgreSQL 15
* **Scraping Engine:** Puppeteer (Headless Chrome) + Cheerio (Análise Estática)
* **Worker:** Processamento assíncrono para scans recursivos (até 2 níveis / 10 páginas)
* **Frontend:** React 18 + Vite + Tailwind CSS v4
* **Animações:** Framer Motion + Lucide React para ícones premium

---

## 🚀 Como Executar Localmente (Self-Hosted)

Siga estes passos para rodar o projeto em seu ambiente de desenvolvimento.

### 1. Requisitos:

* **Node.js** (v18 ou superior)
* **PostgreSQL** (v14 ou superior)

### 2. Configurar o Backend:

1. Crie um banco de dados chamado `scrap_csp` no seu PostgreSQL.

2. Entre na pasta `/backend`:
   
   ```bash
   cd backend
   npm install
   ```

3. Configure o arquivo `.env` com sua URL de conexão e uma chave JWT:
   
   ```env
   DATABASE_URL=postgres://usuario:senha@localhost:5432/scrap_csp
   JWT_SECRET=sua_chave_secreta_aqui
   ```

4. Execute o script de inicialização do banco de dados:
   
   ```bash
   node setup_db.js
   ```

5. Inicie a API e o Motor de Auditoria (duas abas do terminal):
   
   ```bash
   npm run dev    # Inicia o servidor na porta 5000
   npm run worker # Inicia o motor de scraping recursivo
   ```

### 3. Configurar o Frontend:

1. Entre na pasta `/frontend`:
   
   ```bash
   cd frontend
   npm install
   npm run dev # Inicia o Vite na porta 5173
   ```

---

## 🐳 Como Executar via Container (Docker)

Esta é a forma recomendada para rodar o projeto completo de forma isolada e profissional.

### 1. Pré-requisitos:

* **Docker** e **Docker Compose** instalados.

### 2. Rodar a Orquestração:

Na raiz do projeto (onde está o arquivo `docker-compose.yml`), execute:

```bash
docker-compose up --build
```

### 3. Inicializar o Banco (Apenas no primeiro uso):

Com os containers rodando, execute o comando abaixo em um novo terminal para criar as tabelas do sistema:

```bash
docker exec -it scrap_csp_api node setup_db.js
```

### 📍 Endereços de Acesso:

* **Painel de Usuário (Interface):** `http://localhost` (Porta 80)
* **API Backend:** `http://localhost:5000`

---

## 🔥 Funcionalidades Principais

* **Scraping Híbrido:** Detecta recursos carregados dinamicamente via JS e também pelo HTML estático.
* **Recursividade:** Segue links internos e sitemap para mapear subpáginas e agregar domínios.
* **Dashboard Colaborativo:** CRUD de tarefas com status em tempo real (`PENDENTE`, `PROCESSANDO`, `CONCLUÍDO`, `FALHA`).
* **Análise de Falhas:** Identifica políticas fracas (uso de `*`, `unsafe-inline`, `unsafe-eval`).
* **Regra Recomendada:** Gera e exibe a regra CSP final pronta para copiar e aplicar (.htaccess, Nginx, etc.).

---

*Desenvolvido para profissionais de segurança e desenvolvedores que buscam políticas de segurança robustas.* ⚖️🛡️
