FROM node:20-bookworm-slim AS client-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client ./
RUN npm run build

FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/data/hotel.db

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

COPY server ./server
COPY --from=client-build /app/client/dist ./client/dist

RUN mkdir -p /data

EXPOSE 5000

CMD ["node", "server/index.js"]
