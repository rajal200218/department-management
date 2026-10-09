import React, { useState, useEffect } from 'react';
import { X, Building2, Save, AlertCircle } from 'lucide-react';

export default function DepartmentModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  schools = [],
  facultyList = []
}) {
  const isEdit = Boolean(initialData);

  const [formData, setFormData] = useState({
    department_name: '',
    department_code: '',
    school_id: '',
    hod_id: '',
    email: '',
    phone: '',
    established_year: new Date().getFullYear(),
    faculty_count: 0,
    building: '',
    room_no: '',
    description: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        department_name: initialData.department_name || '',
        department_code: initialData.department_code || '',
        school_id: initialData.school_id || (schools[0]?.id || ''),
        hod_id: initialData.hod_id || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        established_year: initialData.established_year || new Date().getFullYear(),
        faculty_count: initialData.faculty_count || 0,
        building: initialData.building || '',
        room_no: initialData.room_no || '',
        description: initialData.description || '',
        status: initialData.status || 'Active'
      });
    } else {
      setFormData({
        department_name: '',
        department_code: '',
        school_id: schools[0]?.id || '',
        hod_id: '',
        email: '',
        phone: '',
        established_year: new Date().getFullYear(),
        faculty_count: 0,
        building: 'Engineering Block A',
        room_no: 'Room A-101',
        description: '',
        status: 'Active'
      });
    }
    setErrors({});
  }, [initialData, schools, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.department_name.trim()) newErrors.department_name = 'Department Name is required';
    if (!formData.department_code.trim()) newErrors.department_code = 'Department Code is required';
    if (!formData.school_id) newErrors.school_id = 'Please select a School / Institute';

    if (formData.established_year !== '' && formData.established_year !== null && (isNaN(Number(formData.established_year)) || Number(formData.established_year) < 0)) {
      newErrors.established_year = 'Established Year must be a non-negative number';
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
      setErrors({ form: err.message || 'Failed to save department' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        {/* Header */}
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
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Department Profile' : 'Add New Department'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Academic Structure • Phase 2 Module 12
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
                <AlertCircle size={16} />
                <span>{errors.form}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Department Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Computer Science & Engineering"
                  value={formData.department_name}
                  onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                />
                {errors.department_name && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.department_name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Dept Code *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. CSE"
                  value={formData.department_code}
                  onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                />
                {errors.department_code && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.department_code}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">School / Faculty (Module 11) *</label>
                <select
                  className="form-select"
                  value={formData.school_id}
                  onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                >
                  <option value="">-- Select School --</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.school_name}
                    </option>
                  ))}
                </select>
                {errors.school_id && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.school_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Head of Dept (HOD)</label>
                <select
                  className="form-select"
                  value={formData.hod_id}
                  onChange={(e) => setFormData({ ...formData, hod_id: e.target.value })}
                >
                  <option value="">-- No HOD Assigned / Vacant --</option>
                  {facultyList.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name} ({faculty.designation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Official Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="hod.dept@nuv.ac.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Established Year</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={formData.established_year}
                  onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
                />
                {errors.established_year && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.established_year}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Faculty Roster</label>
                <div style={{
                  padding: '0.6rem 0.85rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  color: '#34D399',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  height: '42px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800 }}>{initialData?.faculty_count || 0}</span>
                  <span style={{ fontSize: '0.75rem', color: '#A7F3D0' }}>Assigned (Auto)</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Building / Block</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Engineering Block A"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Room / Office No</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Room A-301"
                  value={formData.room_no}
                  onChange={(e) => setFormData({ ...formData, room_no: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Department Profile & Description</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Enter academic focus, vision, and facilities of this department..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Operational Status</label>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.35rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="status"
                    value="Active"
                    checked={formData.status === 'Active'}
                    onChange={() => setFormData({ ...formData, status: 'Active' })}
                  />
                  <span>Active</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="status"
                    value="Inactive"
                    checked={formData.status === 'Inactive'}
                    onChange={() => setFormData({ ...formData, status: 'Inactive' })}
                  />
                  <span>Inactive / Proposed</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={16} />
              <span>{isSubmitting ? 'Saving to Database...' : isEdit ? 'Update Department' : 'Save Department'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
