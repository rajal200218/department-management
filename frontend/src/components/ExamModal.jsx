import React, { useState, useEffect } from 'react';
import { X, Award, AlertCircle } from 'lucide-react';

export default function ExamModal({
  isOpen,
  onClose,
  onSave,
  exam = null,
  subjects = [],
  departments = []
}) {
  const isEdit = Boolean(exam);

  const [formData, setFormData] = useState({
    exam_name: '',
    subject_id: '',
    exam_date: '',
    time_slot: '10:00 - 12:00',
    classroom: 'LH-101',
    max_marks: 50,
    passing_marks: 20,
    status: 'Scheduled',
    department_id: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (exam) {
      setFormData({
        exam_name: exam.exam_name || '',
        subject_id: exam.subject_id ? String(exam.subject_id) : '',
        exam_date: exam.exam_date ? exam.exam_date.split('T')[0] : '',
        time_slot: exam.time_slot || '10:00 - 12:00',
        classroom: exam.classroom || '',
        max_marks: exam.max_marks || 50,
        passing_marks: exam.passing_marks || 20,
        status: exam.status || 'Scheduled',
        department_id: exam.department_id ? String(exam.department_id) : ''
      });
    } else {
      const today = new Date();
      today.setDate(today.getDate() + 7);
      setFormData({
        exam_name: 'Mid-Semester Examination',
        subject_id: subjects[0]?.id ? String(subjects[0].id) : '',
        exam_date: today.toISOString().split('T')[0],
        time_slot: '10:00 - 12:00',
        classroom: 'Exam Hall 101',
        max_marks: 50,
        passing_marks: 20,
        status: 'Scheduled',
        department_id: ''
      });
    }
    setErrors({});
  }, [exam, isOpen, subjects]);

  const filteredSubjects = formData.department_id
    ? subjects.filter(s => String(s.department_id) === String(formData.department_id))
    : subjects;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.exam_name.trim()) newErrors.exam_name = 'Exam title is required';
    if (!formData.subject_id) newErrors.subject_id = 'Please select a subject';
    if (!formData.exam_date) newErrors.exam_date = 'Exam date is required';
    if (!formData.time_slot.trim()) newErrors.time_slot = 'Time slot is required';
    if (!formData.classroom.trim()) newErrors.classroom = 'Exam venue/classroom is required';
    if (Number(formData.passing_marks) > Number(formData.max_marks)) {
      newErrors.passing_marks = 'Passing marks cannot exceed maximum marks';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        exam_name: formData.exam_name.trim(),
        subject_id: parseInt(formData.subject_id, 10),
        exam_date: formData.exam_date,
        time_slot: formData.time_slot.trim(),
        classroom: formData.classroom.trim(),
        max_marks: parseInt(formData.max_marks, 10),
        passing_marks: parseInt(formData.passing_marks, 10),
        status: formData.status
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save examination schedule' });
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
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A78BFA'
            }}>
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Examination' : 'Schedule Examination'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Setup internal evaluations, mid-terms, and final exams
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
              <label className="form-label">Exam Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Mid-Term Theory Exam, Lab Practical Evaluation"
                value={formData.exam_name}
                onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
              />
              {errors.exam_name && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.exam_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Subject / Course *</label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="form-select"
              >
                <option value="">Select Course</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subject_code} - {s.subject_name} (Sem {s.semester || 'N/A'})
                  </option>
                ))}
              </select>
              {errors.subject_id && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.subject_id}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Exam Date *</label>
                <input
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                  className="form-control"
                />
                {errors.exam_date && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.exam_date}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Time Slot *</label>
                <input
                  type="text"
                  value={formData.time_slot}
                  onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                  placeholder="e.g. 10:00 - 12:00 or 02:00 - 05:00"
                  className="form-control"
                />
                {errors.time_slot && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.time_slot}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Exam Hall / Room *</label>
                <input
                  type="text"
                  value={formData.classroom}
                  onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                  placeholder="e.g. LH-101, Central Auditorium"
                  className="form-control"
                />
                {errors.classroom && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.classroom}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-select"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Maximum Marks *</label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={formData.max_marks}
                  onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Passing Marks *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passing_marks}
                  onChange={(e) => setFormData({ ...formData, passing_marks: e.target.value })}
                  className="form-control"
                />
                {errors.passing_marks && <span style={{ color: '#F87171', fontSize: '0.75rem' }}>{errors.passing_marks}</span>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Exam' : 'Schedule Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
