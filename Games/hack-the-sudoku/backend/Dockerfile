FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server.mjs ./
EXPOSE 8080
USER node
CMD ["node", "server.mjs"]
