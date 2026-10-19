import React, { useState, useEffect } from 'react';
import { X, Bell, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['Academic', 'Examination', 'Holiday', 'Event', 'Placement', 'General'];
const PRIORITIES = [
  { id: 'Normal', label: 'Normal Priority' },
  { id: 'High', label: 'High Priority' },
  { id: 'Urgent', label: 'Urgent / Critical' }
];

export default function NoticeModal({
  isOpen,
  onClose,
  onSave,
  notice = null,
  departments = []
}) {
  const isEdit = Boolean(notice);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Academic',
    target_role: 'All',
    department_id: '',
    priority: 'Normal',
    content: '',
    expires_at: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (notice) {
      setFormData({
        title: notice.title || '',
        category: notice.category || 'Academic',
        target_role: notice.target_role || 'All',
        department_id: notice.department_id ? String(notice.department_id) : '',
        priority: notice.priority || 'Normal',
        content: notice.content || '',
        expires_at: notice.expires_at ? notice.expires_at.split('T')[0] : ''
      });
    } else {
      setFormData({
        title: '',
        category: 'Academic',
        target_role: 'All',
        department_id: '',
        priority: 'Normal',
        content: '',
        expires_at: ''
      });
    }
    setErrors({});
  }, [notice, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Announcement title is required';
    if (!formData.content.trim()) newErrors.content = 'Announcement message content is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: formData.title.trim(),
        category: formData.category,
        target_role: formData.target_role,
        department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
        priority: formData.priority,
        content: formData.content.trim(),
        expires_at: formData.expires_at || null
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to publish notice' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FBBF24'
            }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Notice' : 'Publish New Notice & Circular'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Broadcast announcements across LJ University departments
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: 'calc(80vh - 140px)' }}>
            {errors.form && (
              <div style={{
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} />
                <span>{errors.form}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Notice Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Mid-Semester Exam Schedule Announcement Spring 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              {errors.title && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.title}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-select"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Audience *</label>
                <select
                  value={formData.target_role}
                  onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                  className="form-select"
                >
                  <option value="All">All University Members</option>
                  <option value="Student">Students Only</option>
                  <option value="Faculty">Faculty & Staff Only</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Department Scope</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Campus-Wide (All Departments)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.department_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority Flag *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="form-select"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notice Content & Instructions *</label>
              <textarea
                rows={5}
                className="form-control"
                style={{ resize: 'vertical' }}
                placeholder="Provide full announcement details, schedules, requirements, or guidelines..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              {errors.content && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.content}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Expiration Date (Optional)</label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                className="form-control"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }} disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : isEdit ? 'Update Notice' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
