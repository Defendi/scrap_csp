FROM node:20-slim

# Instalar dependências para o Puppeteer rodar no Linux (Chrome Headless)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libxtst6 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expor a porta da API padrão (5000)
EXPOSE 5000

# Por padrão inicia a API, mas o compose pode trocar pro worker
CMD ["npm", "run", "start"]
