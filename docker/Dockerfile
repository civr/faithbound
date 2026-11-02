# Faithbound: the game plus a small save server (accounts, worlds). No extra packages.
FROM node:20-alpine
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data PUBLIC_DIR=/app/public
WORKDIR /app
COPY server.js /app/server.js
COPY index.html three.min.js /app/public/
COPY js /app/public/js
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
