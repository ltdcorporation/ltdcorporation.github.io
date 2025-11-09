# Visitor Counter Service

FastAPI + Postgres service to keep track of page hits. Used by the landing page to replace CountAPI.

## Features
- `POST /hit` increments (default +1) and returns current value.
- `GET /count/{namespace}` returns current total.
- Simple Postgres table with `ON CONFLICT` upsert.

## Getting Started
1. Create a Postgres database (e.g., `visitor_counter`).
2. Copy `.env.example` to `.env` and update `DATABASE_URL`.
3. Install dependencies:
   ```bash
   cd counter-service
   python3 -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
4. Run locally:
   ```bash
   uvicorn app.main:app --reload --port 8787
   ```

## Example Requests
```bash
# Increment namespace “asiafap.com” by 1
curl -X POST http://localhost:8787/hit -H 'content-type: application/json' \
  -d '{"namespace": "asiafap.com"}'

# Get current value
curl http://localhost:8787/count/asiafap.com
```

## Deploying
- Build a simple systemd service or Docker container that runs `uvicorn app.main:app`.
- Ensure the server exposes HTTPS (via Caddy/NGINX/Cloudflare Zero Trust).
- Update the landing page JS to hit your domain instead of CountAPI.
