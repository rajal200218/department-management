import React, { useState, useEffect } from 'react';
import { X, School, Save, AlertCircle } from 'lucide-react';

export default function SchoolModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null
}) {
  const isEdit = Boolean(initialData);

  const [formData, setFormData] = useState({
    school_name: '',
    school_code: '',
    dean_name: '',
    contact_email: '',
    contact_phone: '',
    building: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        school_name: initialData.school_name || '',
        school_code: initialData.school_code || '',
        dean_name: initialData.dean_name || '',
        contact_email: initialData.contact_email || '',
        contact_phone: initialData.contact_phone || '',
        building: initialData.building || '',
        status: initialData.status || 'Active'
      });
    } else {
      setFormData({
        school_name: '',
        school_code: '',
        dean_name: '',
        contact_email: '',
        contact_phone: '',
        building: 'Main Campus Block',
        status: 'Active'
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.school_name.trim()) newErrors.school_name = 'School Name is required';
    if (!formData.school_code.trim()) newErrors.school_code = 'School Code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save school' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6'
            }}>
              <School size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit School / Institute' : 'Add New School / Institute'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Academic Structure • LJ University
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: 'calc(80vh - 140px)' }}>
            {errors.form && (
              <div style={{
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                fontSize: '0.85rem'
              }}>
                {errors.form}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">School Name *</label>
                <input
                  type="text"
                  maxLength={255}
                  className="form-control"
                  placeholder="e.g. School of Engineering & Technology (SET)"
                  value={formData.school_name}
                  onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                />
                {errors.school_name && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.school_name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Code *</label>
                <input
                  type="text"
                  maxLength={50}
                  className="form-control"
                  placeholder="NUV-SET"
                  value={formData.school_code}
                  onChange={(e) => setFormData({ ...formData, school_code: e.target.value.toUpperCase() })}
                />
                {errors.school_code && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.school_code}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Dean Name</label>
                <input
                  type="text"
                  maxLength={150}
                  className="form-control"
                  placeholder="Dr. Rajesh Sharma"
                  value={formData.dean_name}
                  onChange={(e) => setFormData({ ...formData, dean_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Building / Block</label>
                <input
                  type="text"
                  maxLength={100}
                  className="form-control"
                  placeholder="Engineering Block A"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  maxLength={150}
                  className="form-control"
                  placeholder="dean.set@nuv.ac.in"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  maxLength={50}
                  className="form-control"
                  placeholder="+91 265 2617 001"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.35rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="radio"
                    name="status"
                    value="Active"
                    checked={formData.status === 'Active'}
                    onChange={() => setFormData({ ...formData, status: 'Active' })}
                  />
                  <span>Active</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="radio"
                    name="status"
                    value="Inactive"
                    checked={formData.status === 'Inactive'}
                    onChange={() => setFormData({ ...formData, status: 'Inactive' })}
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={16} />
              <span>{isSubmitting ? 'Saving...' : isEdit ? 'Update School' : 'Save School'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
