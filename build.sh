#!/bin/sh
# Builds a self-hostable copy in dist/: a full HTML document plus scripts.
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist/js
{ printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  sed -n '1,/<\/style>/p' index.html
  printf '</head>\n<body>\n'
  sed '1,/<\/style>/d' index.html
  printf '</body>\n</html>\n'; } > dist/index.html
cp three.min.js dist/ && cp js/*.js dist/js/
# cache-busting: every build gets its own script URLs, so browsers never run stale code
V=$(date +%s)
sed -i "s#src=\"js/\([a-z0-9_-]*\)\.js\"#src=\"js/\1.js?v=$V\"#g" dist/index.html
cp README.md server/server.js docker/Dockerfile docker/docker-compose.yml docker/.dockerignore dist/
echo built
