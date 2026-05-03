import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));

function resolveSslPath(p) {
  const t = (p ?? "").trim();
  if (!t) return "";
  return path.isAbsolute(t) ? t : path.join(frontendDir, t);
}

// https://vite.dev/config/
// Use TLS certs you already trust (e.g. mkcert):
//   - Set DEV_SSL_KEY_FILE / DEV_SSL_CERT_FILE in .env.local (paths absolute or
//     relative to this frontend/ folder), OR
//   - Copy your key + cert PEMs to frontend/dev-certs/ssl-key.pem and
//     frontend/dev-certs/ssl-cert.pem
// Otherwise @vitejs/plugin-basic-ssl is used (Chrome will warn until you proceed).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, frontendDir, "");
  const envKey = resolveSslPath(env.DEV_SSL_KEY_FILE);
  const envCert = resolveSslPath(env.DEV_SSL_CERT_FILE);
  const autoKey = path.join(frontendDir, "dev-certs", "ssl-key.pem");
  const autoCert = path.join(frontendDir, "dev-certs", "ssl-cert.pem");

  let keyPath = "";
  let certPath = "";
  if (envKey && envCert && fs.existsSync(envKey) && fs.existsSync(envCert)) {
    keyPath = envKey;
    certPath = envCert;
  } else if (fs.existsSync(autoKey) && fs.existsSync(autoCert)) {
    keyPath = autoKey;
    certPath = autoCert;
  }

  const useTrustedDevSsl = Boolean(keyPath && certPath);

  return {
    plugins: [react(), ...(useTrustedDevSsl ? [] : [basicSsl()])],
    server: {
      ...(useTrustedDevSsl
        ? {
            https: {
              key: fs.readFileSync(keyPath),
              cert: fs.readFileSync(certPath),
            },
          }
        : {}),
      proxy: {
        // In dev, /api/* is forwarded to backend at 127.0.0.1:8000 (strip /api prefix)
        // e.g. /api/v1/business/dashboard/metrics -> https://127.0.0.1:8000/v1/business/dashboard/metrics
        "/api": {
          target: "https://127.0.0.1:8000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err, req, res) => {
              console.warn(
                "[Vite proxy] Backend request failed. Is the backend running on https://127.0.0.1:8000?",
                err.message,
              );
            });
            proxy.on("proxyRes", (proxyRes, req, res) => {
              if (proxyRes.statusCode === 404 && req.url?.startsWith("/api/")) {
                console.warn(
                  "[Vite proxy] 404 for",
                  req.url,
                  "- Restart the backend so /v1/business/* routes are loaded.",
                );
              }
            });
          },
        },
      },
    },
  };
});
