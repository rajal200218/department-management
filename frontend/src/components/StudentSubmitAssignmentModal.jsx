import React, { useState, useEffect } from 'react';
import { X, Send, BookMarked, Link, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function StudentSubmitAssignmentModal({
  isOpen,
  onClose,
  assignment,
  onSuccess
}) {
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && assignment) {
      setSubmissionText(assignment.my_submission_text || assignment.my_submission_content || '');
      setFileUrl(assignment.my_submission_file_url || '');
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      setSubmissionText('');
      setFileUrl('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, assignment]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const text = submissionText.trim();
    const url = fileUrl.trim();

    if (!text && !url) {
      setErrorMsg('Please enter your submission text/solution or provide a project link.');
      return;
    }

    const parts = [];
    if (text) parts.push(text);
    if (url) parts.push(`Project/Attachment Link: ${url}`);
    const combinedContent = parts.join('\n\n');

    setSubmitting(true);
    try {
      const res = await api.submitAssignment(assignment.id, {
        submission_content: combinedContent,
        submission_text: text || null,
        submission_file_url: url || null
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Coursework submitted successfully!');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        throw new Error(res.message || 'Failed to submit assignment');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error submitting coursework');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        style={{ maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
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
              <Send size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                Submit Coursework
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {assignment.subject_code} - {assignment.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Assignment Brief */}
        <div style={{
          padding: '1rem 1.25rem',
          margin: '1rem 1.5rem 0',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          fontSize: '0.82rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Deadline:</span>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>{new Date(assignment.due_date).toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Maximum Marks:</span>
            <span style={{ color: '#14b8a6', fontWeight: 700 }}>{assignment.max_marks} pts</span>
          </div>
          {assignment.description && (
            <p style={{
              margin: '0.4rem 0 0',
              paddingTop: '0.4rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.4
            }}>
              {assignment.description}
            </p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div className="modal-body" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Solution / Work Notes <span style={{ color: '#f87171' }}>*</span>
              </label>
              <textarea
                rows={4}
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Paste answers, code summary, or notes for the instructor..."
                className="form-control"
                style={{ width: '100%', fontFamily: 'monospace', lineHeight: 1.5, fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Project Link / GitHub URL / Drive Link (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <Link size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://github.com/student/assignment-repo"
                  className="form-control"
                  style={{ width: '100%', paddingLeft: '2.4rem', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px' }} />
                  <span>Submitting Work...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Turn In Coursework</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
