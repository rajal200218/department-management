import React, { useState, useEffect } from 'react';
import { X, BookMarked, CheckCircle2, AlertCircle, ExternalLink, MessageSquare, Award, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function AssignmentSubmissionsModal({
  isOpen,
  onClose,
  assignmentId,
  onUpdated
}) {
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradingState, setGradingState] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    if (isOpen && assignmentId) {
      loadSubmissions();
    } else {
      setAssignment(null);
      setSubmissions([]);
      setGradingState({});
      setFeedbackMsg(null);
    }
  }, [isOpen, assignmentId]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.getAssignmentById(assignmentId);
      if (res.success && res.data) {
        setAssignment(res.data);
        setSubmissions(res.data.submissions || []);
        
        // Initialize grading state
        const initialGrading = {};
        (res.data.submissions || []).forEach(sub => {
          initialGrading[sub.id] = {
            marks_obtained: sub.marks_obtained !== null && sub.marks_obtained !== undefined ? sub.marks_obtained : '',
            feedback: sub.feedback || ''
          };
        });
        setGradingState(initialGrading);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (submissionId) => {
    const gradeData = gradingState[submissionId];
    if (!gradeData || gradeData.marks_obtained === '') return;

    setSubmittingId(submissionId);
    setFeedbackMsg(null);
    try {
      const res = await api.gradeSubmission(submissionId, {
        marks_obtained: parseFloat(gradeData.marks_obtained),
        feedback: gradeData.feedback || null
      });

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Grade and feedback saved successfully!' });
        loadSubmissions();
        if (onUpdated) onUpdated();
      } else {
        throw new Error(res.message || 'Failed to save grade');
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error grading submission' });
    } finally {
      setSubmittingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        style={{ maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(20, 184, 166, 0.15)',
              color: '#14b8a6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(20, 184, 166, 0.3)'
            }}>
              <BookMarked size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  {assignment?.title || 'Coursework Submissions'}
                </h3>
                {assignment && (
                  <span className="badge badge-teal">
                    Max: {assignment.max_marks} Marks
                  </span>
                )}
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {assignment ? `${assignment.subject_code} - ${assignment.subject_name} • Due: ${new Date(assignment.due_date).toLocaleDateString()}` : 'Loading assignment...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div style={{
            margin: '1rem 1.5rem 0',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: feedbackMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: feedbackMsg.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Submissions List */}
        <div className="modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {loading ? (
            <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <div className="spinner" />
              <span>Loading student submissions...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ padding: '3.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Clock size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.25rem' }}>No student submissions received yet</p>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Students will appear here as they turn in their coursework.</p>
            </div>
          ) : (
            submissions.map((sub) => {
              const currentGrade = gradingState[sub.id] || { marks_obtained: '', feedback: '' };
              const isGraded = sub.status === 'Graded';

              return (
                <div
                  key={sub.id}
                  style={{
                    padding: '1rem 1.15rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  {/* Student info & details */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>{sub.student_name}</span>
                      <span className="badge badge-blue font-mono" style={{ fontSize: '0.75rem' }}>
                        {sub.enrollment_no}
                      </span>
                      <span className={`badge ${isGraded ? 'badge-green' : 'badge-amber'}`}>
                        {sub.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Submitted: {new Date(sub.submitted_at).toLocaleString()}
                    </span>
                  </div>

                  {sub.submission_text && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      color: 'var(--text-main)',
                      fontFamily: 'monospace',
                      lineHeight: '1.5',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {sub.submission_text}
                    </div>
                  )}

                  {sub.submission_file_url && (
                    <div>
                      <a
                        href={sub.submission_file_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.8rem',
                          color: '#60a5fa',
                          textDecoration: 'none',
                          fontWeight: 600
                        }}
                      >
                        <ExternalLink size={14} />
                        <span>View Attachment / Project Link</span>
                      </a>
                    </div>
                  )}

                  {/* Grading Input Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.04)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                          Marks (Max {assignment?.max_marks}):
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={assignment?.max_marks || 100}
                          step="0.5"
                          value={currentGrade.marks_obtained}
                          onChange={(e) => setGradingState({
                            ...gradingState,
                            [sub.id]: { ...currentGrade, marks_obtained: e.target.value }
                          })}
                          placeholder="Marks"
                          className="form-control"
                          style={{ width: '85px', padding: '0.35rem 0.6rem', fontSize: '0.85rem', textAlign: 'center', fontWeight: 700 }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                          Feedback:
                        </label>
                        <input
                          type="text"
                          value={currentGrade.feedback}
                          onChange={(e) => setGradingState({
                            ...gradingState,
                            [sub.id]: { ...currentGrade, feedback: e.target.value }
                          })}
                          placeholder="Notes / Feedback..."
                          className="form-control"
                          style={{ minWidth: '220px', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGradeSubmit(sub.id)}
                      disabled={submittingId === sub.id}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                    >
                      {submittingId === sub.id ? 'Saving...' : isGraded ? 'Update Grade' : 'Save Grade'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total Submissions: {submissions.length} ({submissions.filter(s => s.status === 'Graded').length} graded)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
