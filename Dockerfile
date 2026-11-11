# Build straight from the repository: `docker compose up -d --build` in this folder.
FROM alpine:3.20 AS build
WORKDIR /src
COPY . .
RUN sh ./build.sh

FROM node:22-alpine
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data PUBLIC_DIR=/app/public
WORKDIR /app
COPY --from=build /src/dist/server.js /app/server.js
COPY --from=build /src/dist/index.html /src/dist/three.min.js /src/dist/favicon.svg /src/dist/favicon.png /src/dist/favicon.ico /app/public/
COPY --from=build /src/dist/js /app/public/js
COPY --from=build /src/dist/assets /app/public/assets
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
