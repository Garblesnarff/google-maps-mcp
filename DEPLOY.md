# DEPLOY.md — Hosting the Google Maps MCP server

This guide covers deploying the **Streamable HTTP** version of the server
(`node dist/http.js`). The stdio version (`node dist/index.js`) is for local
use only and is not deployable.

## What you need

- A Google Maps API key with these APIs enabled: Geocoding, Places API
  (**New**), Routes API, Elevation API, Maps Static API, Street View Static
  API. (Address Validation, Time Zone, and Roads APIs only if you use those
  tools.)
- A bearer token you invent (long random string) for client auth.
- A host that runs one non-interactive Node.js process. These instructions
  use [Botkeep](https://botkeep.cloud), but any host works.

## Environment variables (set on the host, never in the repo)

| Variable | Required | Purpose |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | yes | Server-side Google key. Never committed, never sent to clients. |
| `MCP_BEARER_TOKEN` | yes (prod) | Bearer token clients must present. If unset, the server runs **without auth** (local dev only) and logs a warning. |
| `PORT` | no | Listen port. Default `3000`. Most hosts (including Botkeep) inject their own. |
| `MCP_HOST` | no | Bind address. Default `0.0.0.0`. |

## Botkeep deployment (GitHub)

1. In the Botkeep panel, create an application from GitHub:
   - Repository: `Garblesnarff/google-maps-mcp`
   - Branch: the branch you want live (e.g. `upgrade/maps-platform-new-apis` until merged)
   - Build command: `npm ci && npm run build`
   - Start command: `node dist/http.js`
2. Add the environment variables above in the Botkeep secrets panel.
3. Give the app ~512 MB RAM (the server is light; one slot of the Founder plan is plenty).
4. Deploy. The process logs to stdout/stderr — watch them in the panel.

### Public URL

Botkeep's docs say not to assume public ports. After deploy, check the panel
for an assigned domain/port and open `https://<your-domain>/healthz` — you
should get `{"status":"ok","tools":15}`.

- **If the panel exposes a public HTTPS domain:** your MCP endpoint is
  `https://<your-domain>/mcp`. Done.
- **If there is no public port:** run a Cloudflare Tunnel from inside the app
  so the server dials out and gets a public URL:
  1. Install `cloudflared` in the app environment (or add it to the Dockerfile).
  2. `cloudflared tunnel --url http://localhost:3000` (use the real `$PORT`).
  3. Use the `https://*.trycloudflare.com` URL it prints as your MCP endpoint.
  4. For a stable URL, create a named tunnel in the Cloudflare dashboard once
     and store its token as another Botkeep secret.

## Connecting a client

Any MCP client that speaks **Streamable HTTP**:

- **URL:** `https://<your-domain>/mcp`
- **Header:** `Authorization: Bearer <your MCP_BEARER_TOKEN>`

Example (Claude Code / MCP Inspector style config):

```json
{
  "mcpServers": {
    "google-maps": {
      "url": "https://<your-domain>/mcp",
      "headers": { "Authorization": "Bearer <your MCP_BEARER_TOKEN>" }
    }
  }
}
```

Health check (no auth): `GET https://<your-domain>/healthz`.

## Protecting the Google bill

1. **Bearer token** — without it, anyone with the URL can burn your quota.
   Rotate it in the Botkeep panel if it ever leaks.
2. **Quota caps in Google Cloud** — set per-API daily caps/quotas on the key
   (APIs & Services → Quotas). This is the real backstop.
3. **Built-in rate limiting** — the server allows 60 requests/minute per
   client IP with HTTP 429 responses. Tune `RATE_LIMIT_MAX_REQUESTS` in
   `src/http.ts` if needed.
4. **Response caching** — geocoding, place details, elevation, and static
   map images are cached in-memory, so repeated calls don't re-bill.

## Logs

- One process, everything to stdout/stderr — read them in the Botkeep panel.
- Request lines log `METHOD /path -> status (ms)` only. Tokens, API keys,
  and request bodies are never logged.
- `GET /healthz` is the uptime check; it needs no auth.
