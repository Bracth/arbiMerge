FROM node:22-alpine AS builder
WORKDIR /app

# Copiamos los archivos de configuración del monorepo
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/frontend/package.json packages/frontend/package.json

# Instalamos todas las dependencias
# Añadimos libc6-compat para compatibilidad de módulos nativos en Alpine
RUN apk add --no-cache libc6-compat
RUN npm ci

# Parche para el bug de NPM con dependencias opcionales de Rolldown/Vite en Docker/Alpine
# Si el lockfile se generó en otro SO (como Windows), NPM CI a veces se salta los bindings nativos.
RUN npm install @rolldown/binding-linux-x64-musl@1.0.0-rc.10 lightningcss-linux-x64-musl@1.32.0 @tailwindcss/oxide-linux-x64-musl@4.2.2

# Copiamos el código fuente necesario
COPY packages/shared packages/shared
COPY packages/frontend packages/frontend

# Compilamos el paquete compartido (asumiendo que tu frontend usa tipos compartidos)
RUN npm run build -w packages/shared

# IMPORTANTE: Si tu frontend necesita variables de entorno en tiempo de compilación (ej. VITE_WS_URL), 
# descomenta estas líneas y pásalas desde Dokploy. Para el MVP, si el frontend detecta la URL dinámicamente, lo dejas así.
# ARG VITE_WS_URL
# ENV VITE_WS_URL=$VITE_WS_URL

# Compilamos el proyecto de React/Vite
RUN npm run build -w packages/frontend

# Stage 2: Production Server (Usamos Nginx para servir los archivos estáticos)
FROM nginx:alpine AS runner

# Limpiamos el HTML por defecto que trae Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos los archivos estáticos generados por Vite en el Stage 1 a la carpeta pública de Nginx
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# IMPORTANTE: Configuración genérica de Nginx para SPA (Single Page Applications).
# Si usas React Router, Nginx necesita redirigir los 404 al index.html.
# Como es una hackathon y queremos evitar crear un archivo nginx.conf extra, 
# metemos el comando directamente aquí:
RUN sed -i '10i \        try_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 (El que Dokploy / Traefik está esperando)
EXPOSE 80

# Comando para iniciar Nginx y mantenerlo corriendo en primer plano
CMD ["nginx", "-g", "daemon off;"]