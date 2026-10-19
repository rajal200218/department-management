import React, { useState, useEffect } from 'react';
import { X, BookOpen, Layers } from 'lucide-react';

export default function SubjectModal({ isOpen, onClose, onSave, subject = null, departments = [], programs = [], faculty = [] }) {
  const isEdit = Boolean(subject);

  const [formData, setFormData] = useState({
    subject_name: '',
    subject_code: '',
    department_id: '',
    program_id: '',
    semester: 1,
    credits: 3,
    type: 'Theory',
    faculty_id: '',
    description: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subject) {
      setFormData({
        subject_name: subject.subject_name || '',
        subject_code: subject.subject_code || '',
        department_id: subject.department_id ? String(subject.department_id) : '',
        program_id: subject.program_id ? String(subject.program_id) : '',
        semester: subject.semester || 1,
        credits: subject.credits || 3,
        type: subject.type || 'Theory',
        faculty_id: subject.faculty_id ? String(subject.faculty_id) : '',
        description: subject.description || '',
        status: subject.status || 'Active'
      });
    } else {
      setFormData({
        subject_name: '',
        subject_code: '',
        department_id: departments[0]?.id ? String(departments[0].id) : '',
        program_id: '',
        semester: 1,
        credits: 3,
        type: 'Theory',
        faculty_id: '',
        description: '',
        status: 'Active'
      });
    }
    setErrors({});
  }, [subject, isOpen, departments]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.subject_name.trim()) errs.subject_name = 'Subject name is required.';
    if (!formData.subject_code.trim()) errs.subject_code = 'Subject code is required.';
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
        department_id: parseInt(formData.department_id, 10),
        program_id: formData.program_id ? parseInt(formData.program_id, 10) : null,
        semester: parseInt(formData.semester, 10),
        credits: parseInt(formData.credits, 10),
        faculty_id: formData.faculty_id ? parseInt(formData.faculty_id, 10) : null
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save subject.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter faculty by department
  const deptFaculty = formData.department_id
    ? faculty.filter(f => f.department_id === parseInt(formData.department_id, 10))
    : faculty;

  const filteredPrograms = formData.department_id
    ? programs.filter(p => p.department_id === parseInt(formData.department_id, 10))
    : programs;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A855F7'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Subject / Course' : 'Add Academic Subject'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Curriculum & Faculty Allocation • LJ University
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Subject Name <span style={{ color: '#F87171' }}>*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Database Management Systems"
                  value={formData.subject_name}
                  onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                />
                {errors.subject_name && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.subject_name}</span>}
              </div>

              <div>
                <label className="form-label">Subject Code <span style={{ color: '#F87171' }}>*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. CSE-402"
                  value={formData.subject_code}
                  onChange={(e) => setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })}
                />
                {errors.subject_code && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.subject_code}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Department <span style={{ color: '#F87171' }}>*</span></label>
                <select
                  className="form-control"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value, program_id: '', faculty_id: '' })}
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
                <label className="form-label">Associated Degree Program</label>
                <select
                  className="form-control"
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                >
                  <option value="">-- All Programs --</option>
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
                <label className="form-label">Semester</label>
                <select
                  className="form-control"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value, 10) })}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Credits</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="form-control"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">Type</label>
                <select
                  className="form-control"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical / Lab</option>
                  <option value="Elective">Elective</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Assigned Faculty Member</label>
              <select
                className="form-control"
                value={formData.faculty_id}
                onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
              >
                <option value="">-- No Faculty Assigned Yet --</option>
                {deptFaculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.designation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Course Description / Syllabus Overview</label>
              <textarea
                rows={2}
                className="form-control"
                placeholder="Key topics, prerequisites, learning outcomes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
