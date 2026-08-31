FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN mkdir -p uploads

EXPOSE 6001

CMD ["npm", "start"]