import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Lock, Eye, EyeOff, Sparkles, Key } from 'lucide-react';

export default function FacultyModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  departments = [],
  defaultDepartmentId = null
}) {
  const isEdit = Boolean(initialData);

  const [formData, setFormData] = useState({
    department_id: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: 'Assistant Professor',
    qualification: '',
    specialization: '',
    joining_date: new Date().toISOString().split('T')[0],
    experience_years: 5,
    status: 'Active'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to generate a strong random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: generated }));
    setShowPassword(true);
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        department_id: initialData.department_id || defaultDepartmentId || (departments[0]?.id || ''),
        name: initialData.name || '',
        email: initialData.email || '',
        password: '', // Empty in edit mode so it's not changed unless user types a new one
        phone: initialData.phone || '',
        designation: initialData.designation || 'Assistant Professor',
        qualification: initialData.qualification || '',
        specialization: initialData.specialization || '',
        joining_date: initialData.joining_date ? initialData.joining_date.split('T')[0] : new Date().toISOString().split('T')[0],
        experience_years: initialData.experience_years || 0,
        status: initialData.status || 'Active'
      });
    } else {
      setFormData({
        department_id: defaultDepartmentId || (departments[0]?.id || ''),
        name: '',
        email: '',
        password: '',
        phone: '',
        designation: 'Assistant Professor',
        qualification: 'M.Tech / Ph.D.',
        specialization: 'Computer Science',
        joining_date: new Date().toISOString().split('T')[0],
        experience_years: 4,
        status: 'Active'
      });
    }
    setShowPassword(false);
    setErrors({});
  }, [initialData, departments, defaultDepartmentId, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Faculty Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.department_id) newErrors.department_id = 'Please select a department';
    
    if (formData.experience_years !== '' && formData.experience_years !== null && (isNaN(Number(formData.experience_years)) || Number(formData.experience_years) < 0)) {
      newErrors.experience_years = 'Experience Years must be a non-negative number';
    }

    // In create mode, if password provided, must be >= 6 chars
    if (!isEdit && formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    if (isEdit && formData.password && formData.password.length < 6) {
      newErrors.password = 'New password must be at least 6 characters long';
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
      setErrors({ form: err.message || 'Failed to save faculty record' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Faculty & Credentials' : 'Add Faculty & Assign Password'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Academic Roster & Authentication • LJ University
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Amit Patel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="amit.patel@nuv.ac.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.email}</span>}
              </div>
            </div>

            {/* Password Management Block */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Key size={14} color="#60A5FA" />
                  <span>{isEdit ? 'Update Login Password' : 'Set Login Password'}</span>
                  {!isEdit && <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>(Optional - default: lju@{new Date().getFullYear()})</span>}
                </label>

                <button
                  type="button"
                  onClick={generateRandomPassword}
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#93C5FD',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                  title="Generate a secure random password"
                >
                  <Sparkles size={12} />
                  <span>Auto-Generate</span>
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder={isEdit ? 'Leave blank to keep existing password' : 'Enter initial password (min 6 characters)'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '3px'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <div style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '0.35rem' }}>{errors.password}</div>}
              {isEdit && (
                <div style={{ fontSize: '0.725rem', color: '#94A3B8', marginTop: '0.35rem' }}>
                  If you do not wish to reset this user's password, leave this field empty.
                </div>
              )}
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
                    <option key={d.id} value={d.id}>
                      {d.department_name} ({d.department_code})
                    </option>
                  ))}
                </select>
                {errors.department_id && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.department_id}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Academic Designation</label>
                <select
                  className="form-select"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                >
                  <option value="HOD & Professor">HOD & Professor</option>
                  <option value="HOD & Associate Professor">HOD & Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Adjunct Faculty">Adjunct Faculty</option>
                  <option value="Research Scholar">Research Scholar</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Highest Qualification</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ph.D. in Computer Science (IIT Bombay)"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Area of Specialization</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cloud Architecture, Machine Learning"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98250 11223"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Experience (Years)</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                />
                {errors.experience_years && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.experience_years}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Joining Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={16} />
              <span>{isSubmitting ? 'Saving...' : isEdit ? 'Update Faculty' : 'Save Faculty'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
