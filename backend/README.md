# Importer Gate (Local)

This service gates the Vault bulk importer behind admin approval and expiring tokens.

## Setup
1. Install dependencies:
```bash
cd backend
npm install
```
2. Start the server:
```bash
ADMIN_USER=admin ADMIN_PASS=change-me PORT=8787 npm start
```

## Admin Approval
- Open `http://localhost:8787/admin`
- Use Basic Auth with `ADMIN_USER` / `ADMIN_PASS`
- Approve requests to generate a token

## API
- `POST /api/request` `{ name, contact, reason }`
- `GET /api/import/validate?token=...`
- `GET /api/admin/requests` (auth)
- `POST /api/admin/approve` `{ id, ttl }` (auth)
- `POST /api/admin/revoke` `{ token }` (auth)

Tokens expire based on TTL (`24h`, `7d`, `30d`).
