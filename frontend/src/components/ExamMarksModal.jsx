import React, { useState, useEffect } from 'react';
import { X, Award, CheckCircle2, AlertCircle, Save, Sparkles } from 'lucide-react';
import { api } from '../services/api';

function calculateGrade(marks, maxMarks) {
  if (marks === '' || marks === null || marks === undefined || isNaN(marks)) return '-';
  const pct = (parseFloat(marks) / parseFloat(maxMarks)) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'F';
}

function getGradeBadgeClass(grade) {
  switch (grade) {
    case 'A+': return 'badge badge-active';
    case 'A': return 'badge badge-primary';
    case 'B+': return 'badge badge-teal';
    case 'B': return 'badge badge-purple';
    case 'C': return 'badge badge-amber';
    case 'F': return 'badge badge-red';
    default: return 'badge badge-inactive';
  }
}

export default function ExamMarksModal({
  isOpen,
  onClose,
  examId,
  onSuccess
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exam, setExam] = useState(null);
  const [studentMarks, setStudentMarks] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && examId) {
      loadExamData();
    } else {
      setExam(null);
      setStudentMarks([]);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, examId]);

  const loadExamData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getExamById(examId);
      if (res.success && res.data) {
        setExam(res.data);
        const initialMarks = (res.data.students || []).map((s) => ({
          student_id: s.student_id,
          student_name: s.student_name,
          enrollment_no: s.enrollment_no,
          marks_obtained: s.marks_obtained !== null && s.marks_obtained !== undefined ? s.marks_obtained : '',
          remarks: s.remarks || ''
        }));
        setStudentMarks(initialMarks);
      } else {
        throw new Error(res.message || 'Failed to load exam roster');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error loading examination details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (index, value) => {
    const updated = [...studentMarks];
    updated[index].marks_obtained = value;
    setStudentMarks(updated);
  };

  const handleRemarksChange = (index, value) => {
    const updated = [...studentMarks];
    updated[index].remarks = value;
    setStudentMarks(updated);
  };

  const handleQuickFill = (pct) => {
    if (!exam) return;
    const targetMarks = Math.round((pct / 100) * exam.max_marks);
    const updated = studentMarks.map(s => ({
      ...s,
      marks_obtained: s.marks_obtained === '' ? targetMarks : s.marks_obtained
    }));
    setStudentMarks(updated);
  };

  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);
    try {
      const payload = studentMarks
        .filter(s => s.marks_obtained !== '' && s.marks_obtained !== null && !isNaN(s.marks_obtained))
        .map(s => ({
          student_id: s.student_id,
          marks_obtained: parseFloat(s.marks_obtained),
          remarks: s.remarks || null
        }));

      if (payload.length === 0) {
        throw new Error('Please enter marks for at least one student.');
      }

      const res = await api.saveExamResults(examId, { results: payload });
      if (res.success) {
        setSuccessMsg(res.message || 'Marks recorded successfully!');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        throw new Error(res.message || 'Failed to record marks.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error submitting marks.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                  Enter Marks: {exam?.exam_name || 'Loading...'}
                </h3>
                {exam && (
                  <span className="badge badge-purple" style={{ fontSize: '0.675rem' }}>
                    Max: {exam.max_marks} | Pass: {exam.passing_marks}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                {exam ? `${exam.subject_code} - ${exam.subject_name} • Semester ${exam.semester} • ${exam.department_name}` : 'Loading...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Action Bar & Quick Fill */}
        <div style={{
          padding: '0.65rem 1.5rem',
          background: 'rgba(15, 23, 42, 0.5)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94A3B8' }}>
            <Sparkles size={14} color="#A78BFA" />
            <span>Grading scale automatically updates letter grades based on maximum marks.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#64748B' }}>Quick fill:</span>
            <button
              type="button"
              onClick={() => handleQuickFill(75)}
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.725rem' }}
            >
              Fill 75%
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill(50)}
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.725rem' }}
            >
              Fill Passing
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="modal-body" style={{ maxHeight: 'calc(75vh - 120px)', padding: '1rem 1.5rem' }}>
          {errorMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
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

          {successMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
              Loading registered students...
            </div>
          ) : studentMarks.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              No active students enrolled in this department and semester.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Enrollment No</th>
                    <th>Student Name</th>
                    <th style={{ width: '130px' }}>Marks ({exam?.max_marks})</th>
                    <th style={{ textAlign: 'center', width: '90px' }}>Grade</th>
                    <th>Feedback / Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {studentMarks.map((s, idx) => {
                    const grade = calculateGrade(s.marks_obtained, exam?.max_marks || 50);

                    return (
                      <tr key={s.student_id}>
                        <td style={{ color: '#64748B', fontSize: '0.75rem' }}>{idx + 1}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>{s.enrollment_no}</td>
                        <td style={{ fontWeight: 600, color: '#E2E8F0' }}>{s.student_name}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={exam?.max_marks || 100}
                            step="0.5"
                            value={s.marks_obtained}
                            onChange={(e) => handleMarkChange(idx, e.target.value)}
                            placeholder="Marks"
                            className="form-control"
                            style={{ padding: '0.35rem 0.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={getGradeBadgeClass(grade)}>
                            {grade}
                          </span>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={s.remarks}
                            onChange={(e) => handleRemarksChange(idx, e.target.value)}
                            placeholder="Optional remark..."
                            className="form-control"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            {studentMarks.filter(s => s.marks_obtained !== '').length} of {studentMarks.length} students graded
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || studentMarks.length === 0}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}
            >
              <Save size={15} />
              <span>{saving ? 'Recording...' : 'Save & Publish Marks'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
