FROM node:20-slim

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Install deps on start so volume mount doesn't hide node_modules (e.g. react-router-dom)
CMD ["sh", "-c", "npm install && npm run dev"]
