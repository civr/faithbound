# Faithbound

A browser god game. Guide followers from the Stone Age to the Future.

## Run it with Docker (recommended)
The repository has a `docker-compose.yml` at the top. It builds the game inside Docker, so nothing else is needed on the server:

    git clone https://github.com/civr/faithbound.git
    cd faithbound
    docker compose up -d --build

To update later:

    cd faithbound
    git pull
    docker compose up -d --build

The game runs on port **8040** of that VM. In Nginx Proxy Manager, add a Proxy Host:
- Forward Hostname / IP: the IP of the VM running Docker
- Forward Port: 8040, scheme http
- Websockets are not needed. Block Common Exploits is fine. Request an SSL certificate on the SSL tab.

Saved worlds and accounts live in the Docker volume `dist_faithbound-data` (the same one the older `dist/` setup used), so they survive updates.

Coming from the older way (`./build.sh` and running compose inside `dist/`)? Stop that one once with `cd dist && docker compose down` (this keeps the volume), then use the commands above from the top folder.

The zip (`faithbound.zip`) still works too: it is the built `dist/` folder with its own compose file.

### Accounts and saves
Players make an account on the title screen (name and password). Their worlds are saved on the server, so they can continue on any device. Without an account, a world is saved in that browser only.

Settings in `docker-compose.yml`:
- `ALLOW_SIGNUP: "true"`: anyone who can reach the site can make an account. Set to `"false"` after you and your friends have accounts.
- `SIGNUP_CODE: "something"`: people need this invite code to make an account. Leave empty for no code.

Passwords are stored as salted scrypt hashes. Sessions last 30 days (HttpOnly cookie).
Each account can keep 30 worlds.

### Ready-made image (no build on your server)
Every push to `main` builds an image on GitHub: `ghcr.io/civr/faithbound:latest`. To use it, put `image: ghcr.io/civr/faithbound:latest` in `docker-compose.yml`, remove the `build: .` line, then run `docker compose pull && docker compose up -d`. If the repository is private, log in once with `docker login ghcr.io` (a GitHub token with `read:packages`).

### Play together (co-op)
Open a world, press **Together** in the top bar and then **Invite friends**. You get a link and a 6-letter code. Friends open the link, pick a name and join.
- The host's browser runs the world and sets the speed. Guests watch it live, keep their own belief and send their miracles to the host.
- Everyone sees the other gods' cursors, a chat, and a note when someone works a miracle.
- Co-op rooms live in the server's memory: they close when the host closes the world or has been away for two minutes. Nothing extra is stored.
- Behind Nginx Proxy Manager nothing needs changing: the live stream sends `X-Accel-Buffering: no` and a ping every 15 seconds, so the default proxy settings work.

### Backups
All data lives in the volume `faithbound-data` (`/data` in the container): `users.json`, `sessions.json` and `saves/<user>/`.

    docker run --rm -v faithbound-data:/data -v "$PWD":/backup alpine tar czf /backup/faithbound-backup.tgz -C /data .

Restore by extracting that archive back into the volume.

## Run without Docker
    PORT=8040 DATA_DIR=./data PUBLIC_DIR=. node server.js

(Node 18 or newer.) A plain static web server also works, but then there are no accounts; saves stay in the browser.

## Files
- `index.html` – page, HUD and styles
- `js/core.js` – data, eras, looks, shared state
- `js/render.js` – renderer, sky, camera, terrain, water, borders
- `js/props.js` – town plans, buildings, trees, fields, roads, people, fire, particles, ships
- `js/sim.js` – world generation, simulation, fleets, trade, exploration, saving
- `js/disasters.js` – storms, lightning, hurricanes, blizzards, wildfires, famine, epidemics, earthquakes
- `js/people.js` – rulers, families, dynasties, governors and portraits
- `js/audio.js` – ambience, effects and music, all synthesised in the browser
- `js/ui.js` – interface, accounts, powers, input, main loop
- `server.js` – accounts and save storage

Run `./build.sh` after editing to refresh `dist/`.

## Run it on your Mac (or any computer) without Docker
1. Install Node.js 18 or newer: download the LTS version from nodejs.org, or run `brew install node`.
2. Get the code: `git clone https://github.com/civr/faithbound.git && cd faithbound`
3. Start it: `./run-local.sh`

Your browser opens at http://localhost:8040. Saves and accounts are kept in the `data` folder next to the script.
Stop it with Ctrl+C. To update later: `git pull && ./run-local.sh`.

With Docker Desktop installed you can also run `docker compose up -d --build` in the same folder and open http://localhost:8040.
