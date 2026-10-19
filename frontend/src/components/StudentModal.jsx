import React, { useState, useEffect } from 'react';
import { X, UserPlus, GraduationCap, Building2 } from 'lucide-react';

export default function StudentModal({ isOpen, onClose, onSave, student = null, departments = [], programs = [] }) {
  const isEdit = Boolean(student);

  const [formData, setFormData] = useState({
    enrollment_no: '',
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '',
    address: '',
    admission_year: new Date().getFullYear(),
    current_semester: 1,
    department_id: '',
    program_id: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        enrollment_no: student.enrollment_no || '',
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        gender: student.gender || 'Male',
        dob: student.dob ? student.dob.split('T')[0] : '',
        address: student.address || '',
        admission_year: student.admission_year || new Date().getFullYear(),
        current_semester: student.current_semester || 1,
        department_id: student.department_id ? String(student.department_id) : '',
        program_id: student.program_id ? String(student.program_id) : '',
        status: student.status || 'Active'
      });
    } else {
      setFormData({
        enrollment_no: `LJU${new Date().getFullYear()}CS${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        email: '',
        phone: '',
        gender: 'Male',
        dob: '2004-01-01',
        address: '',
        admission_year: new Date().getFullYear(),
        current_semester: 1,
        department_id: departments[0]?.id ? String(departments[0].id) : '',
        program_id: '',
        status: 'Active'
      });
    }
    setErrors({});
  }, [student, isOpen, departments]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.enrollment_no.trim()) errs.enrollment_no = 'Enrollment number is required.';
    if (!formData.name.trim()) errs.name = 'Full name is required.';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Invalid email address format.';
    }
    if (!formData.department_id) errs.department_id = 'Department assignment is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        admission_year: parseInt(formData.admission_year, 10),
        current_semester: parseInt(formData.current_semester, 10),
        department_id: parseInt(formData.department_id, 10),
        program_id: formData.program_id ? parseInt(formData.program_id, 10) : null
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save student record.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter programs based on selected department
  const filteredPrograms = formData.department_id
    ? programs.filter(p => p.department_id === parseInt(formData.department_id, 10))
    : programs;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        
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
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Student Record' : 'Register New Student'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Academic Roster & DMS Enrollment • LJ University
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {errors.form && (
          <div style={{
            padding: '0.75rem 1rem',
            margin: '0 1.5rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: '0.85rem'
          }}>
            {errors.form}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Enrollment Number <span style={{ color: '#F87171' }}>*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. LJU2024CS001"
                  value={formData.enrollment_no}
                  onChange={(e) => setFormData({ ...formData, enrollment_no: e.target.value.toUpperCase() })}
                />
                {errors.enrollment_no && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.enrollment_no}</span>}
              </div>

              <div>
                <label className="form-label">Full Name <span style={{ color: '#F87171' }}>*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Aarav Patel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.name}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Institutional Email <span style={{ color: '#F87171' }}>*</span></label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. name@ljku.edu.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.email}</span>}
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Department <span style={{ color: '#F87171' }}>*</span></label>
                <select
                  className="form-control"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value, program_id: '' })}
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

              <div>
                <label className="form-label">Academic Program</label>
                <select
                  className="form-control"
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                >
                  <option value="">-- Select Degree Program --</option>
                  {filteredPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.program_name} ({p.program_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Current Semester</label>
                <select
                  className="form-control"
                  value={formData.current_semester}
                  onChange={(e) => setFormData({ ...formData, current_semester: parseInt(e.target.value, 10) })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Admission Year</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.admission_year}
                  onChange={(e) => setFormData({ ...formData, admission_year: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Gender</label>
                <select
                  className="form-control"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Academic Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Graduated">Graduated</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Residential Address</label>
              <textarea
                rows={2}
                className="form-control"
                placeholder="Street address, City, State..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {!isEdit && (
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', background: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.85rem', borderRadius: '6px' }}>
                🔑 Default student login password will be initialized to <strong>admin123</strong>. Students can change their password after logging in.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Student Record' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
