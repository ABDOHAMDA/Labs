FROM node:20-slim

WORKDIR /app

COPY package.json ./

# Install dependencies during build for faster startup
RUN npm install

COPY . .

EXPOSE 5173

# Just run dev, don't re-install every time
CMD ["npm", "run", "dev"]
