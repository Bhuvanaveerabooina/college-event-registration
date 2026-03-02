# College Event Registration

A full-stack app for creating, updating, searching, and managing student event registrations.

## Tech Stack
- **Backend:** Node.js, Express, SQLite
- **Frontend:** Vite + React

## Run Locally

### 1) Install dependencies

```bash
npm install --prefix backend
npm install --prefix frontend
```

> Optional Codex setup script:

```bash
./.codex/setup.sh
```

### 2) Start backend (Terminal 1)

```bash
node backend/src/server.js
```

Backend runs at `http://localhost:5000`.

### 3) Start frontend (Terminal 2)

```bash
npm run dev --prefix frontend
```

Frontend runs at `http://localhost:5173`.

## API Endpoints

- `GET /api/health` → `{ "ok": true }`
- `GET /api/registrations` → list registrations (newest first)
- `POST /api/registrations` → create registration
- `PUT /api/registrations/:id` → update registration
- `DELETE /api/registrations/:id` → delete registration

All backend errors follow:

```json
{ "error": "...", "details": "optional" }
```

## Features

- Professional UI with card layout and responsive table
- Create, edit/update, and delete registrations
- Client-side search and filters (text, department, event)
- Inline validation for required fields, email, and phone
- Toast-style success/error messages
