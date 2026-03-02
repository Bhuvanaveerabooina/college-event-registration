const path = require('path');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;
const dbPath = path.join(__dirname, '..', 'data.sqlite');

const db = new sqlite3.Database(dbPath);

const requiredFields = ['name', 'department', 'eventName'];

function sendError(res, status, error, details) {
  const payload = { error };
  if (details) {
    payload.details = details;
  }
  return res.status(status).json(payload);
}

function validateRegistration(body) {
  const missingFields = requiredFields.filter((field) => !body[field] || !String(body[field]).trim());
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: 'Validation failed',
      details: { missingFields }
    };
  }

  return { valid: true };
}

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      eventName TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`
  );
});

app.use(
  cors({
    origin: 'http://localhost:5173'
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/registrations', (_req, res) => {
  db.all('SELECT * FROM registrations ORDER BY datetime(created_at) DESC, id DESC', (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch registrations', err.message);
    }

    return res.json(rows);
  });
});

app.post('/api/registrations', (req, res) => {
  const validation = validateRegistration(req.body);
  if (!validation.valid) {
    return sendError(res, 400, validation.error, validation.details);
  }

  const { name, department, eventName, email = '', phone = '' } = req.body;

  db.run(
    'INSERT INTO registrations (name, department, eventName, email, phone) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), department.trim(), eventName.trim(), email.trim(), phone.trim()],
    function onInsert(err) {
      if (err) {
        return sendError(res, 500, 'Failed to create registration', err.message);
      }

      db.get('SELECT * FROM registrations WHERE id = ?', [this.lastID], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch created registration', getErr.message);
        }

        return res.status(201).json(row);
      });
    }
  );
});

app.put('/api/registrations/:id', (req, res) => {
  const { id } = req.params;
  const validation = validateRegistration(req.body);
  if (!validation.valid) {
    return sendError(res, 400, validation.error, validation.details);
  }

  const { name, department, eventName, email = '', phone = '' } = req.body;

  db.run(
    'UPDATE registrations SET name = ?, department = ?, eventName = ?, email = ?, phone = ? WHERE id = ?',
    [name.trim(), department.trim(), eventName.trim(), email.trim(), phone.trim(), id],
    function onUpdate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to update registration', err.message);
      }

      if (this.changes === 0) {
        return sendError(res, 404, 'Registration not found');
      }

      db.get('SELECT * FROM registrations WHERE id = ?', [id], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch updated registration', getErr.message);
        }

        return res.json(row);
      });
    }
  );
});

app.delete('/api/registrations/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM registrations WHERE id = ?', [id], function onDelete(err) {
    if (err) {
      return sendError(res, 500, 'Failed to delete registration', err.message);
    }

    if (this.changes === 0) {
      return sendError(res, 404, 'Registration not found');
    }

    return res.json({ ok: true });
  });
});

app.use((_req, res) => sendError(res, 404, 'Not found'));

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
