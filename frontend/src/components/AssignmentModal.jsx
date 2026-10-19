import React, { useState, useEffect } from 'react';
import { X, BookMarked, AlertCircle } from 'lucide-react';

export default function AssignmentModal({
  isOpen,
  onClose,
  onSave,
  assignment = null,
  subjects = [],
  departments = []
}) {
  const isEdit = Boolean(assignment);

  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    department_id: '',
    semester: 4,
    due_date: '',
    max_marks: 50,
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title || '',
        subject_id: assignment.subject_id ? String(assignment.subject_id) : '',
        department_id: assignment.department_id ? String(assignment.department_id) : '',
        semester: assignment.semester || 4,
        due_date: assignment.due_date ? assignment.due_date.split('T')[0] : '',
        max_marks: assignment.max_marks || 50,
        description: assignment.description || ''
      });
    } else {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setFormData({
        title: '',
        subject_id: subjects[0]?.id ? String(subjects[0].id) : '',
        department_id: departments[0]?.id ? String(departments[0].id) : '',
        semester: 4,
        due_date: nextWeek.toISOString().split('T')[0],
        max_marks: 50,
        description: ''
      });
    }
    setErrors({});
  }, [assignment, isOpen, subjects, departments]);

  const handleSubjectChange = (subjId) => {
    const sel = subjects.find(s => String(s.id) === String(subjId));
    setFormData(prev => ({
      ...prev,
      subject_id: subjId,
      department_id: sel?.department_id ? String(sel.department_id) : prev.department_id,
      semester: sel?.semester ? sel.semester : prev.semester
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Assignment title is required';
    if (!formData.subject_id) newErrors.subject_id = 'Please select a subject';
    if (!formData.due_date) newErrors.due_date = 'Submission deadline is required';
    if (!formData.max_marks || formData.max_marks <= 0) newErrors.max_marks = 'Valid maximum marks required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: formData.title.trim(),
        subject_id: parseInt(formData.subject_id, 10),
        department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
        semester: parseInt(formData.semester, 10),
        due_date: formData.due_date,
        max_marks: parseInt(formData.max_marks, 10),
        description: formData.description.trim()
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save coursework assignment' });
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
              background: 'rgba(20, 184, 166, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2DD4BF'
            }}>
              <BookMarked size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Coursework' : 'New Assignment'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Create graded student coursework and practical problem sets
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

            <div className="form-group">
              <label className="form-label">Assignment Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Relational Query Optimization Problem Set #2"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              {errors.title && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Subject / Course *</label>
              <select
                value={formData.subject_id}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="form-select"
              >
                <option value="">Select Course</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subject_code} - {s.subject_name} (Sem {s.semester || 'N/A'})
                  </option>
                ))}
              </select>
              {errors.subject_id && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.subject_id}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="form-select"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.department_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Submission Deadline *</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="form-control"
                />
                {errors.due_date && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.due_date}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Max Marks *</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={formData.max_marks}
                  onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                  className="form-control"
                />
                {errors.max_marks && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.max_marks}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Instructions & Questions</label>
              <textarea
                rows={4}
                className="form-control"
                style={{ resize: 'vertical' }}
                placeholder="Outline project specifications, problems, deliverables, and submission guidelines..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #0D9488 0%, #059669 100%)' }} disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : isEdit ? 'Update Assignment' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
