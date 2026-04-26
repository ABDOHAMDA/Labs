FROM node:20-alpine AS build
# Repo root is the build context so we can copy ../labSystem for the @lab alias in vite.config.js
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
COPY labSystem/ /app/labSystem/
ARG VITE_API_BASE=http://localhost:8080
ARG VITE_HACKME_BASE=http://localhost/HackMe
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_HACKME_BASE=$VITE_HACKME_BASE
RUN npm run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
