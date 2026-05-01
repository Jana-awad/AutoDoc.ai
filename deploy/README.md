# Serving AutoDoc.ai over HTTPS

This folder contains reverse-proxy configurations that terminate TLS in front
of FastAPI and the React SPA. The application code itself stays plain HTTP
internally, which keeps deployment portable and lets the proxy handle
certificates, HSTS, gzip, rate limiting, etc.

Two scenarios are supported:

| Scenario        | Recommended config         | Cert source                        |
|-----------------|----------------------------|------------------------------------|
| Local dev       | `Caddyfile.local`          | mkcert (locally trusted)           |
| Production      | `Caddyfile`                | Let's Encrypt (automatic, by Caddy)|
| nginx (alt)     | `nginx.local.conf` / `nginx.prod.conf` | mkcert / certbot         |

We recommend Caddy because cert renewal works out of the box. nginx configs
are provided for teams that already operate nginx.

The single public origin layout used everywhere is:

- `https://<host>/`        -> frontend SPA
- `https://<host>/api/...` -> FastAPI (proxy strips `/api` before forwarding,
  matching the existing Vite dev proxy behavior so backend routes don't change)

Because the frontend and the API share the same origin, browsers do not run a
CORS preflight. CORS in `backend/app/main.py` is therefore only relevant when
you choose to host the API on a different origin.

---

## 1. Local HTTPS in development

### One-time mkcert setup

[mkcert](https://github.com/FiloSottile/mkcert) installs a local Certificate
Authority into your OS/browser trust stores so `https://localhost` is shown as
secure (no warnings).

```bash
# macOS
brew install mkcert nss
# Windows (PowerShell, as Administrator)
choco install mkcert
# Linux (Debian/Ubuntu)
sudo apt install libnss3-tools && \
  curl -L https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-linux-amd64 \
       -o /usr/local/bin/mkcert && chmod +x /usr/local/bin/mkcert

mkcert -install
```

### Generate the localhost cert

From the repo root:

```bash
mkdir -p deploy/certs
mkcert -cert-file deploy/certs/localhost.pem \
       -key-file  deploy/certs/localhost-key.pem \
       localhost 127.0.0.1 ::1
```

`deploy/certs/` is gitignored so private keys never leave your machine.

### Start the three processes

In separate terminals:

```bash
# 1) Backend - stays on plain HTTP behind the proxy
cd backend
.\venv\Scripts\activate          # Windows; or `source venv/bin/activate` on Unix
uvicorn app.main:app --host 127.0.0.1 --port 8000 \
  --proxy-headers --forwarded-allow-ips="127.0.0.1"

# 2) Frontend dev server - also plain HTTP, served via the proxy
cd frontend
npm run dev                       # default port 5173

# 3) HTTPS reverse proxy
caddy run --config deploy/Caddyfile.local
# (on Windows, run the shell as Administrator so port 443 is allowed)
```

Open `https://localhost`. Login/signup, the SPA, and `/api/*` calls all flow
through the proxy on a single trusted HTTPS origin.

> Prefer not to bind port 443? Edit `Caddyfile.local` to use
> `localhost:8443` and open `https://localhost:8443` instead.

### nginx alternative (local)

```bash
nginx -p . -c deploy/nginx.local.conf
```

---

## 2. Production HTTPS

### Caddy (recommended)

1. Point your DNS A/AAAA records at the server.
2. Build the SPA on the server (or in CI):

   ```bash
   cd frontend
   npm ci
   npm run build                 # outputs to frontend/dist
   sudo mkdir -p /var/www/autodoc
   sudo cp -r dist/* /var/www/autodoc/
   ```
3. Run FastAPI behind a process manager (systemd / supervisord / docker), e.g.:

   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 \
     --proxy-headers --forwarded-allow-ips="127.0.0.1"
   ```
4. Edit `deploy/Caddyfile`:
   - Replace `autodoc.example.com` with your real domain.
   - Set `email` to a real address (Let's Encrypt renewal notifications).
5. Run Caddy as a service:

   ```bash
   sudo caddy run --config deploy/Caddyfile
   # or with the official systemd unit (recommended):
   #   https://caddyserver.com/docs/install#linux-service
   ```

That's it. Caddy obtains and renews the certificate automatically and
redirects all HTTP traffic to HTTPS.

### nginx alternative (production)

1. Obtain a cert with certbot:

   ```bash
   sudo certbot certonly --nginx -d autodoc.example.com
   ```
2. Copy `deploy/nginx.prod.conf` into `/etc/nginx/sites-available/autodoc`,
   replace `autodoc.example.com`, then enable + reload:

   ```bash
   sudo ln -s /etc/nginx/sites-available/autodoc /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

---

## 3. Frontend configuration

The frontend reads its API base URL from `VITE_API_BASE_URL`. With the
single-origin layout above you do **not** need to set it: `getApiBaseUrl()`
falls back to the relative path `/api`, which the proxy handles.

If (and only if) you choose to host the API on a different origin (for example
`https://api.autodoc.example.com`), set:

```bash
# frontend/.env.production
VITE_API_BASE_URL=https://api.autodoc.example.com
```

Then add that origin to the CORS allowlist in `backend/app/main.py`.

---

## 4. Tradeoffs to be aware of

- **Extra moving part.** You now run a proxy in addition to FastAPI/Vite.
  In return you get TLS, HTTP/2, gzip, redirects, and HSTS without changing app
  code.
- **Local cert install.** mkcert modifies the OS trust store. If you would
  rather not, skip mkcert and accept the browser warning for the locally
  generated cert (or run plain HTTP for dev and HTTPS only in prod).
- **Privileged ports on Windows.** Binding to 443 requires an elevated shell;
  if that is inconvenient, use a high port (e.g. 8443) by editing
  `Caddyfile.local`.
- **Mixed-content risk.** Once any page is HTTPS, every API URL the frontend
  uses must also be HTTPS or browsers will block it. Setting
  `VITE_API_BASE_URL` to an `http://` value while loading the SPA over HTTPS
  is the most common cause of broken requests.
- **Backend trusts X-Forwarded-Proto.** Run uvicorn with
  `--proxy-headers --forwarded-allow-ips="127.0.0.1"` so request URLs and
  redirects use the right scheme. Skipping this rarely matters for AutoDoc but
  is required if you ever generate absolute URLs server-side.
