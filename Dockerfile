# Stage 1: Build
FROM node:18-alpine as builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Buildar o projeto
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build do React
COPY --from=builder /app/dist /usr/share/nginx/html

# Importante: Adicionar um script para substituir o index.html em runtime
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Expor porta 8080
EXPOSE 8080

# Usar o script como entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]