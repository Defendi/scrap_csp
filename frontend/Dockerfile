# Estágio 1: Build da aplicação React
FROM node:20-slim as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Comando de build do Vite
RUN npm run build

# Estágio 2: Servir arquivos estáticos com Nginx estável e leve
FROM nginx:alpine

# Copiar os arquivos gerados no estágio anterior para o diretório padrão do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração simples para Nginx lidar com rotas SPA (Single Page Application)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
