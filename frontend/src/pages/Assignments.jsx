import React, { useState, useEffect } from 'react';
import { 
  BookMarked, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Send, 
  Edit3, 
  Trash2, 
  Users, 
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { isAdmin, isHOD, isFaculty, isStudent } from '../services/permissions';
import AssignmentModal from '../components/AssignmentModal';
import AssignmentSubmissionsModal from '../components/AssignmentSubmissionsModal';
import StudentSubmitAssignmentModal from '../components/StudentSubmitAssignmentModal';

export default function Assignments({ user, departments = [] }) {
  const isStudentUser = isStudent(user);
  const canManage = isAdmin(user) || isHOD(user) || isFaculty(user);

  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState(() => {
    if (user?.department_id) return String(user.department_id);
    return '';
  });
  const [selectedSemester, setSelectedSemester] = useState(() => {
    if (user?.current_semester) return String(user.current_semester);
    return '';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewSubmissionsId, setViewSubmissionsId] = useState(null);
  const [submitAssignmentTarget, setSubmitAssignmentTarget] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [selectedDept, selectedSemester]);

  const fetchSubjects = async () => {
    try {
      const res = await api.getSubjects();
      if (res.success) setSubjects(res.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDept) params.department_id = selectedDept;
      if (selectedSemester) params.semester = selectedSemester;

      const res = await api.getAssignments(params);
      if (res.success) {
        setAssignments(res.data);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      showAlert('Failed to load assignments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlertMsg({ message, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (assign) => {
    setEditingAssignment(assign);
    setIsCreateModalOpen(true);
  };

  const handleSaveAssignment = async (formData) => {
    if (editingAssignment) {
      const res = await api.updateAssignment(editingAssignment.id, formData);
      if (res.success) {
        showAlert('Coursework assignment updated.');
        fetchAssignments();
      } else {
        throw new Error(res.message || 'Failed to update assignment.');
      }
    } else {
      const res = await api.createAssignment(formData);
      if (res.success) {
        showAlert('Coursework assignment created.');
        fetchAssignments();
      } else {
        throw new Error(res.message || 'Failed to create assignment.');
      }
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coursework assignment? All student submissions will also be deleted.')) return;
    try {
      const res = await api.deleteAssignment(id);
      if (res.success) {
        showAlert('Assignment removed.');
        setAssignments(prev => prev.filter(a => a.id !== id));
      } else {
        showAlert(res.message || 'Failed to delete assignment.', 'error');
      }
    } catch (err) {
      showAlert(err.message || 'Error deleting assignment.', 'error');
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.subject_name?.toLowerCase().includes(q) ||
      a.subject_code?.toLowerCase().includes(q) ||
      a.created_by_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Alert */}
      {alertMsg && (
        <div className={`toast ${alertMsg.type === 'error' ? 'toast-error' : 'toast-success'}`} style={{ position: 'static' }}>
          <span>{alertMsg.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Coursework & Assignments
            </h1>
            <span className="badge badge-teal">
              Continuous Evaluation
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Internal coursework assignments, problem sets, student submissions, and instructor grading
          </p>
        </div>

        {canManage && (
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #0D9488 0%, #059669 100%)' }}>
            <Plus size={16} />
            <span>Create Assignment</span>
          </button>
        )}
      </div>

      {/* Control Strip */}
      <div className="filter-toolbar">
        <div className="filter-items-wrap">
          {!isStudentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="form-label" style={{ margin: 0 }}>Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.department_name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="form-label" style={{ margin: 0 }}>Semester:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="search-input-wrap">
          <Search size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coursework..."
          />
        </div>
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
          Loading coursework assignments...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          color: '#64748B'
        }}>
          <BookMarked size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94A3B8' }}>
            No coursework assignments found
          </div>
        </div>
      ) : (
        <div className="grid-3-col">
          {filteredAssignments.map((assign) => {
            const isDueSoon = new Date(assign.due_date) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            const isPastDue = new Date(assign.due_date) < new Date();

            return (
              <div key={assign.id} className="entity-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span className="badge badge-teal">
                      {assign.subject_code} • Sem {assign.semester}
                    </span>
                    <span style={{ fontSize: '0.725rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF', background: 'rgba(15, 23, 42, 0.7)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                      {assign.max_marks} pts
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.25rem' }}>
                    {assign.title}
                  </h3>
                  <div style={{ fontSize: '0.775rem', color: '#94A3B8', marginBottom: '0.75rem' }}>
                    {assign.subject_name}
                  </div>

                  {assign.description && (
                    <p style={{
                      fontSize: '0.775rem',
                      color: '#CBD5E1',
                      background: 'rgba(15, 23, 42, 0.5)',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      lineHeight: 1.4,
                      marginBottom: '0.75rem'
                    }}>
                      {assign.description?.length > 100 ? `${assign.description.substring(0, 100)}...` : assign.description}
                    </p>
                  )}

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem',
                    color: '#94A3B8'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} color="#64748B" />
                        <span>Deadline:</span>
                      </span>
                      <strong style={{ color: isPastDue ? '#F87171' : isDueSoon ? '#FCD34D' : '#E2E8F0' }}>
                        {new Date(assign.due_date).toLocaleDateString()}
                      </strong>
                    </div>

                    {!isStudentUser ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Users size={13} color="#64748B" />
                          <span>Submissions:</span>
                        </span>
                        <span style={{ color: '#2DD4BF', fontWeight: 700 }}>
                          {assign.total_submissions || 0} received ({assign.graded_submissions || 0} graded)
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>My Status:</span>
                        {assign.my_submission_id ? (
                          <span style={{ color: '#34D399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={13} />
                            <span>Submitted ({assign.my_marks !== null ? `${assign.my_marks}/${assign.max_marks} pts` : 'Under Review'})</span>
                          </span>
                        ) : (
                          <span style={{ color: '#FCD34D', fontWeight: 700 }}>
                            Pending Turn-In
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  {isStudentUser ? (
                    <button
                      onClick={() => setSubmitAssignmentTarget(assign)}
                      className="btn btn-primary"
                      style={{ width: '100%', background: 'linear-gradient(135deg, #0D9488 0%, #059669 100%)', fontSize: '0.8rem', padding: '0.45rem' }}
                    >
                      <Send size={13} />
                      <span>{assign.my_submission_id ? 'Resubmit Solution' : 'Submit Coursework'}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setViewSubmissionsId(assign.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#5EEAD4', borderColor: 'rgba(20, 184, 166, 0.3)' }}
                      >
                        <Users size={13} />
                        <span>Submissions ({assign.total_submissions || 0})</span>
                      </button>

                      {canManage && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button
                            onClick={() => handleOpenEdit(assign)}
                            className="btn-icon"
                            title="Edit Assignment"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assign.id)}
                            className="btn-icon"
                            style={{ color: '#F87171' }}
                            title="Delete Assignment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveAssignment}
        assignment={editingAssignment}
        subjects={subjects}
        departments={departments}
      />

      <AssignmentSubmissionsModal
        isOpen={Boolean(viewSubmissionsId)}
        onClose={() => setViewSubmissionsId(null)}
        assignmentId={viewSubmissionsId}
        onUpdated={fetchAssignments}
      />

      <StudentSubmitAssignmentModal
        isOpen={Boolean(submitAssignmentTarget)}
        onClose={() => setSubmitAssignmentTarget(null)}
        assignment={submitAssignmentTarget}
        onSuccess={() => {
          showAlert('Coursework submitted successfully!');
          fetchAssignments();
        }}
      />
    </div>
  );
}
