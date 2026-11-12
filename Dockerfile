# Imagen de producción del frontend (build estático de Vite servido con nginx).

# ---------- build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vite "hornea" la URL de la API en el build: debe llegar como variable de build.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN test -n "$VITE_API_URL" || (echo "ERROR: falta la variable VITE_API_URL (URL pública del backend)" && exit 1)
RUN npm run build
RUN node scripts/security-headers.mjs > security-headers.conf

# ---------- runtime ----------
FROM nginx:1.27-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/security-headers.conf /etc/nginx/snippets/security-headers.conf
# Railway inyecta PORT; nginx lo usa vía la plantilla.
ENV PORT=8080
EXPOSE 8080
