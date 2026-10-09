import React, { useState } from 'react';
import { X, Calendar, Plus, CheckCircle, AlertCircle } from 'lucide-react';

export default function AcademicSessionModal({ isOpen, onClose, onAddSession, existingSessions }) {
  const [sessionName, setSessionName] = useState('');
  const [term, setTerm] = useState('Fall & Spring (Full Year)');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Upcoming');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sessionName.trim()) {
      setError('Academic session name is required (e.g. 2027–2028)');
      return;
    }

    if (existingSessions.some(s => s.name.toLowerCase() === sessionName.trim().toLowerCase())) {
      setError('This academic session already exists.');
      return;
    }

    onAddSession({
      id: 'session_' + Date.now(),
      name: sessionName.trim(),
      term: term.trim(),
      startDate: startDate || '2027-07-01',
      endDate: endDate || '2028-06-30',
      status: status
    });

    setSessionName('');
    setError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA'
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="modal-title">Add Academic Session</h2>
              <p className="modal-subtitle">Create a new academic calendar year for Navrachana University</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label required">Academic Session Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., 2027–2028 or 2028–2029"
              value={sessionName}
              onChange={(e) => {
                setSessionName(e.target.value);
                setError('');
              }}
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
              Standard format: YYYY–YYYY (e.g. 2027–2028)
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Academic Terms</label>
            <select
              className="form-select"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            >
              <option value="Fall & Spring (Full Year)">Fall & Spring Terms (Full Year / Odd + Even)</option>
              <option value="Odd Semester (Jul–Dec)">Odd Semester (Jul – Dec)</option>
              <option value="Even Semester (Jan–Jun)">Even Semester (Jan – Jun)</option>
              <option value="Summer Term">Summer Special Term</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Upcoming">Upcoming (Planning phase)</option>
              <option value="Active">Active (Current active academic year)</option>
              <option value="Archived">Archived (Historical records)</option>
            </select>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ padding: 0, marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              <span>Create Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
