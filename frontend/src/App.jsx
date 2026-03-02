import { useEffect, useMemo, useState } from 'react';

const API_BASE = 'http://localhost:5000/api';

const initialForm = {
  name: '',
  department: '',
  eventName: '',
  email: '',
  phone: ''
};

function Toast({ type, message, onClose }) {
  if (!message) return null;
  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss message">
        ×
      </button>
    </div>
  );
}

export default function App() {
  const [registrations, setRegistrations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState({ type: 'success', message: '' });
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  const departments = useMemo(() => [...new Set(registrations.map((item) => item.department))], [registrations]);
  const events = useMemo(() => [...new Set(registrations.map((item) => item.eventName))], [registrations]);

  const filteredRegistrations = useMemo(() => {
    const text = searchText.trim().toLowerCase();

    return registrations.filter((item) => {
      const textMatch =
        !text ||
        [item.name, item.email, item.phone].some((value) => (value || '').toLowerCase().includes(text));
      const departmentMatch = !departmentFilter || item.department === departmentFilter;
      const eventMatch = !eventFilter || item.eventName === eventFilter;
      return textMatch && departmentMatch && eventMatch;
    });
  }, [registrations, searchText, departmentFilter, eventFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/registrations`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to load registrations');
      }
      setRegistrations(data);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.department.trim()) errors.department = 'Department is required.';
    if (!form.eventName.trim()) errors.eventName = 'Event name is required.';

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (form.phone) {
      if (!/^\d+$/.test(form.phone)) {
        errors.phone = 'Phone must contain digits only.';
      } else if (form.phone.length !== 10) {
        errors.phone = 'Phone must be exactly 10 digits.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setForm(initialForm);
    setFieldErrors({});
    setEditId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API_BASE}/registrations/${editId}` : `${API_BASE}/registrations`;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setToast({ type: 'success', message: editId ? 'Registration updated.' : 'Registration created.' });
      resetForm();
      await fetchRegistrations();
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/registrations/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Delete failed');
      }
      setToast({ type: 'success', message: 'Registration deleted.' });
      await fetchRegistrations();
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setForm({
      name: item.name || '',
      department: item.department || '',
      eventName: item.eventName || '',
      email: item.email || '',
      phone: item.phone || ''
    });
    setFieldErrors({});
  };

  return (
    <main className="page">
      <div className="container">
        <h1>College Event Registration</h1>
        <Toast type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, message: '' })} />

        <section className="card">
          <h2>{editId ? 'Edit Registration' : 'New Registration'}</h2>
          <form onSubmit={handleSubmit} className="form-grid" noValidate>
            {[
              ['name', 'Name'],
              ['department', 'Department'],
              ['eventName', 'Event Name'],
              ['email', 'Email (optional)'],
              ['phone', 'Phone (optional)']
            ].map(([field, label]) => (
              <label key={field}>
                {label}
                <input
                  type="text"
                  value={form[field]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                />
                {fieldErrors[field] ? <small className="error-text">{fieldErrors[field]}</small> : null}
              </label>
            ))}

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editId ? 'Update' : 'Register'}
              </button>
              {editId ? (
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="card">
          <h2>Registrations</h2>
          <div className="filters">
            <input
              type="text"
              placeholder="Search name, email, phone"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
              <option value="">All events</option>
              {events.map((eventName) => (
                <option key={eventName} value={eventName}>
                  {eventName}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearchText('');
                setDepartmentFilter('');
                setEventFilter('');
              }}
            >
              Clear filters
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>Event</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7">Loading...</td>
                  </tr>
                ) : filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="7">No registrations found.</td>
                  </tr>
                ) : (
                  filteredRegistrations.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.department}</td>
                      <td>{item.eventName}</td>
                      <td>{item.email || '-'}</td>
                      <td>{item.phone || '-'}</td>
                      <td>{new Date(item.created_at).toLocaleString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button type="button" className="btn-secondary" onClick={() => startEdit(item)}>
                            Edit
                          </button>
                          <button type="button" className="btn-danger" onClick={() => handleDelete(item.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
