import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Sparkles } from 'lucide-react';

const STANDARD_TIME_SLOTS = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:15 - 12:15',
  '12:15 - 01:15',
  '02:00 - 03:00',
  '03:00 - 04:00',
  '04:00 - 05:00'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableModal({
  isOpen,
  onClose,
  onSave,
  timetable = null,
  departments = [],
  programs = [],
  subjects = [],
  facultyList = []
}) {
  const isEdit = Boolean(timetable);

  const [formData, setFormData] = useState({
    department_id: '',
    program_id: '',
    semester: 4,
    day_of_week: 'Monday',
    time_slot: STANDARD_TIME_SLOTS[0],
    custom_time_slot: '',
    use_custom_time: false,
    subject_id: '',
    faculty_id: '',
    classroom: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timetable) {
      const isCustomTime = !STANDARD_TIME_SLOTS.includes(timetable.time_slot);
      setFormData({
        department_id: timetable.department_id ? String(timetable.department_id) : '',
        program_id: timetable.program_id ? String(timetable.program_id) : '',
        semester: timetable.semester || 1,
        day_of_week: timetable.day_of_week || 'Monday',
        time_slot: isCustomTime ? STANDARD_TIME_SLOTS[0] : timetable.time_slot,
        custom_time_slot: isCustomTime ? timetable.time_slot : '',
        use_custom_time: isCustomTime,
        subject_id: timetable.subject_id ? String(timetable.subject_id) : '',
        faculty_id: timetable.faculty_id ? String(timetable.faculty_id) : '',
        classroom: timetable.classroom || ''
      });
    } else {
      const firstDeptId = departments[0]?.id ? String(departments[0].id) : '';
      setFormData({
        department_id: firstDeptId,
        program_id: '',
        semester: 4,
        day_of_week: 'Monday',
        time_slot: STANDARD_TIME_SLOTS[0],
        custom_time_slot: '',
        use_custom_time: false,
        subject_id: '',
        faculty_id: '',
        classroom: 'LH-101'
      });
    }
    setErrorMsg('');
  }, [timetable, isOpen, departments]);

  const filteredSubjects = subjects.filter(s => 
    !formData.department_id || String(s.department_id) === String(formData.department_id)
  );

  const filteredFaculty = facultyList.filter(f => 
    !formData.department_id || String(f.department_id) === String(formData.department_id)
  );

  const filteredPrograms = programs.filter(p => 
    !formData.department_id || String(p.department_id) === String(formData.department_id)
  );

  const handleSubjectChange = (subjId) => {
    const selSubj = subjects.find(s => String(s.id) === String(subjId));
    setFormData(prev => ({
      ...prev,
      subject_id: subjId,
      faculty_id: (selSubj && selSubj.faculty_id) ? String(selSubj.faculty_id) : prev.faculty_id
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const finalTimeSlot = formData.use_custom_time ? formData.custom_time_slot.trim() : formData.time_slot;
    if (!finalTimeSlot) {
      setErrorMsg('Please specify a lecture time slot.');
      return;
    }
    if (!formData.department_id) {
      setErrorMsg('Please select a department.');
      return;
    }
    if (!formData.subject_id) {
      setErrorMsg('Please select a course/subject.');
      return;
    }
    if (!formData.classroom.trim()) {
      setErrorMsg('Please enter the classroom/lab location.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        department_id: parseInt(formData.department_id, 10),
        program_id: formData.program_id ? parseInt(formData.program_id, 10) : null,
        semester: parseInt(formData.semester, 10),
        day_of_week: formData.day_of_week,
        time_slot: finalTimeSlot,
        subject_id: parseInt(formData.subject_id, 10),
        faculty_id: formData.faculty_id ? parseInt(formData.faculty_id, 10) : null,
        classroom: formData.classroom.trim()
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save timetable slot.');
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
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA'
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>
                {isEdit ? 'Edit Timetable Slot' : 'Schedule Timetable Slot'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Allocate classroom, course lecture, and instructor schedule
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
            {errorMsg && (
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
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.department_name} ({dept.department_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Academic Program</label>
                <select
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">All Programs / General</option>
                  {filteredPrograms.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.program_name} ({prog.program_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Semester *</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="form-select"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Day of Week *</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  className="form-select"
                  required
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time Slot */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Time Slot *</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, use_custom_time: !formData.use_custom_time })}
                  style={{ background: 'none', border: 'none', color: '#60A5FA', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {formData.use_custom_time ? 'Select standard slot' : 'Enter custom slot'}
                </button>
              </div>
              {formData.use_custom_time ? (
                <input
                  type="text"
                  value={formData.custom_time_slot}
                  onChange={(e) => setFormData({ ...formData, custom_time_slot: e.target.value })}
                  placeholder="e.g. 08:30 - 09:30 or 01:30 - 03:00"
                  className="form-control"
                />
              ) : (
                <select
                  value={formData.time_slot}
                  onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                  className="form-select"
                >
                  {STANDARD_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Subject Selection */}
            <div className="form-group">
              <label className="form-label">Subject / Course *</label>
              <select
                value={formData.subject_id}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select Course</option>
                {filteredSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subject_code} - {sub.subject_name} (Sem {sub.semester || 'N/A'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Instructor / Faculty</label>
                <select
                  value={formData.faculty_id}
                  onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">No Instructor Assigned</option>
                  {filteredFaculty.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.designation || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Classroom / Room / Lab *</label>
                <input
                  type="text"
                  value={formData.classroom}
                  onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                  placeholder="e.g. LH-101, Lab 4, Aud 2"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#93C5FD',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              <Sparkles size={16} style={{ flexShrink: 0 }} />
              <span>Automated conflict detection prevents overlapping bookings of classrooms, professors, and student batches.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Validating...' : isEdit ? 'Update Slot' : 'Confirm Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
