import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Save } from 'lucide-react';

export default function ProgramModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  departments = []
}) {
  const isEdit = Boolean(initialData);

  const [formData, setFormData] = useState({
    department_id: '',
    program_name: '',
    program_code: '',
    degree_level: 'Undergraduate (B.Tech)',
    intake_capacity: 60,
    duration_years: 4,
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        department_id: initialData.department_id || (departments[0]?.id || ''),
        program_name: initialData.program_name || '',
        program_code: initialData.program_code || '',
        degree_level: initialData.degree_level || 'Undergraduate (B.Tech)',
        intake_capacity: initialData.intake_capacity || 60,
        duration_years: initialData.duration_years || 4,
        status: initialData.status || 'Active'
      });
    } else {
      setFormData({
        department_id: departments[0]?.id || '',
        program_name: '',
        program_code: '',
        degree_level: 'Undergraduate (B.Tech)',
        intake_capacity: 60,
        duration_years: 4,
        status: 'Active'
      });
    }
    setErrors({});
  }, [initialData, departments, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.program_name.trim()) newErrors.program_name = 'Program Name is required';
    if (!formData.program_code.trim()) newErrors.program_code = 'Program Code is required';
    if (!formData.department_id) newErrors.department_id = 'Please select a department';

    if (formData.intake_capacity !== '' && formData.intake_capacity !== null && (isNaN(Number(formData.intake_capacity)) || Number(formData.intake_capacity) < 0)) {
      newErrors.intake_capacity = 'Intake Capacity must be a non-negative number';
    }

    if (formData.duration_years !== '' && formData.duration_years !== null && (isNaN(Number(formData.duration_years)) || Number(formData.duration_years) < 0)) {
      newErrors.duration_years = 'Duration Years must be a non-negative number';
    }

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
      setErrors({ form: err.message || 'Failed to save program' });
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
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Academic Program' : 'Add New Academic Program'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Degree Programs & Curriculum • LJ University
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
                <label className="form-label">Program Name *</label>
                <input
                  type="text"
                  maxLength={255}
                  className="form-control"
                  placeholder="e.g. B.Tech in Computer Science & Engineering"
                  value={formData.program_name}
                  onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
                />
                {errors.program_name && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.program_name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Code *</label>
                <input
                  type="text"
                  maxLength={50}
                  className="form-control"
                  placeholder="BTECH-CSE"
                  value={formData.program_code}
                  onChange={(e) => setFormData({ ...formData, program_code: e.target.value.toUpperCase() })}
                />
                {errors.program_code && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.program_code}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select
                  className="form-select"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.department_name} ({d.department_code})</option>
                  ))}
                </select>
                {errors.department_id && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.department_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Degree Level</label>
                <select
                  className="form-select"
                  value={formData.degree_level}
                  onChange={(e) => setFormData({ ...formData, degree_level: e.target.value })}
                >
                  <option value="Undergraduate (B.Tech)">Undergraduate (B.Tech)</option>
                  <option value="Undergraduate (BBA)">Undergraduate (BBA)</option>
                  <option value="Undergraduate (BCA)">Undergraduate (BCA)</option>
                  <option value="Undergraduate (B.Arch)">Undergraduate (B.Arch)</option>
                  <option value="Postgraduate (M.Tech)">Postgraduate (M.Tech)</option>
                  <option value="Postgraduate (MBA)">Postgraduate (MBA)</option>
                  <option value="Postgraduate (MCA)">Postgraduate (MCA)</option>
                  <option value="Doctorate (Ph.D)">Doctorate (Ph.D)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Intake Capacity (Seats)</label>
                <input
                  type="number"
                  min={0}
                  max={2000}
                  className="form-control"
                  value={formData.intake_capacity}
                  onChange={(e) => setFormData({ ...formData, intake_capacity: e.target.value })}
                />
                {errors.intake_capacity && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.intake_capacity}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Duration (Years)</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  className="form-control"
                  value={formData.duration_years}
                  onChange={(e) => setFormData({ ...formData, duration_years: e.target.value })}
                />
                {errors.duration_years && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.duration_years}</span>}
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
              <span>{isSubmitting ? 'Saving...' : isEdit ? 'Update Program' : 'Save Program'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
