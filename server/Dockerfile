FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node index.js healthcheck.js ./
RUN mkdir -p /app/server_media && chown node:node /app/server_media

USER node
EXPOSE 3000

CMD ["node", "index.js"]
