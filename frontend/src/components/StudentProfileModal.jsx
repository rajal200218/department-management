import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Building2, Phone, Mail, Calendar, AlertTriangle, CheckCircle, Award, BookOpen } from 'lucide-react';
import { api } from '../services/api';

export default function StudentProfileModal({ isOpen, onClose, studentId }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'attendance', 'results'

  useEffect(() => {
    if (isOpen && studentId) {
      loadStudentProfile();
    }
  }, [isOpen, studentId]);

  const loadStudentProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getStudentById(studentId);
      if (res.success) {
        setStudent(res.data);
      }
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const attSummary = student?.attendance_summary || {};
  const attPct = attSummary.attendance_percentage ? parseFloat(attSummary.attendance_percentage) : 100;
  const isDefaulter = attPct < 75;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src={student?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={student?.name || 'Student'}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(59, 130, 246, 0.4)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{student?.name || 'Loading...'}</h3>
                <span className={`status-badge status-${(student?.status || 'Active').toLowerCase()}`}>
                  {student?.status || 'Active'}
                </span>
                {isDefaulter && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#F87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <AlertTriangle size={12} /> Low Attendance (&lt;75%)
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                Enrollment: <strong style={{ color: '#60A5FA' }}>{student?.enrollment_no}</strong> • Semester {student?.current_semester} • {student?.department_name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 1.5rem',
          background: 'rgba(0, 0, 0, 0.15)'
        }}>
          {[
            { id: 'overview', label: 'Student Profile' },
            { id: 'attendance', label: `Attendance (${attPct}%)` },
            { id: 'results', label: `Examination Results (${student?.exam_results?.length || 0})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.85rem 1.1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: activeTab === tab.id ? '#60A5FA' : '#94A3B8',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="modal-body" style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>Loading student records...</div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div className="stat-card" style={{ padding: '1.1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                        Attendance Rate
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: isDefaulter ? '#EF4444' : '#10B981', margin: '0.3rem 0' }}>
                        {attPct}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {attSummary.present_count || 0} of {attSummary.total_classes || 0} sessions
                      </div>
                    </div>

                    <div className="stat-card" style={{ padding: '1.1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                        Current Semester
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60A5FA', margin: '0.3rem 0' }}>
                        Sem {student.current_semester}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        Admitted {student.admission_year}
                      </div>
                    </div>

                    <div className="stat-card" style={{ padding: '1.1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                        Exams Graded
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#A855F7', margin: '0.3rem 0' }}>
                        {student.exam_results?.length || 0}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        Assessments completed
                      </div>
                    </div>
                  </div>

                  {/* Personal & Academic Details Grid */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '1.25rem'
                  }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#F1F5F9' }}>
                      Academic & Personal Details
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: '#64748B' }}>Department:</span>
                        <div style={{ fontWeight: 600, color: '#F1F5F9', marginTop: '2px' }}>
                          {student.department_name} ({student.department_code})
                        </div>
                      </div>

                      <div>
                        <span style={{ color: '#64748B' }}>Program:</span>
                        <div style={{ fontWeight: 600, color: '#F1F5F9', marginTop: '2px' }}>
                          {student.program_name || 'Bachelor of Technology'}
                        </div>
                      </div>

                      <div>
                        <span style={{ color: '#64748B' }}>Institutional Email:</span>
                        <div style={{ fontWeight: 600, color: '#F1F5F9', marginTop: '2px' }}>
                          {student.email}
                        </div>
                      </div>

                      <div>
                        <span style={{ color: '#64748B' }}>Contact Phone:</span>
                        <div style={{ fontWeight: 600, color: '#F1F5F9', marginTop: '2px' }}>
                          {student.phone || 'N/A'}
                        </div>
                      </div>

                      <div>
                        <span style={{ color: '#64748B' }}>Gender & DOB:</span>
                        <div style={{ fontWeight: 600, color: '#F1F5F9', marginTop: '2px' }}>
                          {student.gender} • {student.dob ? student.dob.split('T')[0] : 'N/A'}
                        </div>
                      </div>

                      <div>
                        <span style={{ color: '#64748B' }}>Residential Address:</span>
                        <div style={{ fontWeight: 600, color: '#F1F5F9', marginTop: '2px' }}>
                          {student.address || 'Ahmedabad, Gujarat'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ATTENDANCE */}
              {activeTab === 'attendance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {isDefaulter && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#F87171',
                      fontSize: '0.85rem'
                    }}>
                      <AlertTriangle size={18} />
                      <div>
                        <strong>Low Attendance Warning:</strong> Current attendance is {attPct}%, which is below the mandatory 75% university requirement.
                      </div>
                    </div>
                  )}

                  <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Subject Code</th>
                        <th>Subject Name</th>
                        <th>Attended / Total</th>
                        <th>Percentage</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.subject_attendance?.length > 0 ? (
                        student.subject_attendance.map((sub) => {
                          const subPct = sub.percentage ? parseFloat(sub.percentage) : 0;
                          return (
                            <tr key={sub.subject_id}>
                              <td><strong style={{ color: '#60A5FA' }}>{sub.subject_code}</strong></td>
                              <td>{sub.subject_name}</td>
                              <td>{sub.attended_sessions} / {sub.total_sessions}</td>
                              <td>
                                <strong style={{ color: subPct >= 75 ? '#10B981' : '#EF4444' }}>
                                  {sub.total_sessions > 0 ? `${subPct}%` : 'N/A'}
                                </strong>
                              </td>
                              <td>
                                <span className={`status-badge ${subPct >= 75 ? 'status-active' : 'status-inactive'}`}>
                                  {sub.total_sessions === 0 ? 'No Classes' : subPct >= 75 ? 'Eligible' : 'Shortage'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>
                            No subject attendance logs found for Semester {student.current_semester}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: EXAM RESULTS & PAST ACADEMIC HISTORY */}
              {activeTab === 'results' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Academic Performance & SGPA / CGPA Summary */}
                  {student.academic_history?.length > 0 && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.25) 0%, rgba(15, 23, 42, 0.8) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '12px',
                      padding: '1.15rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#A78BFA', letterSpacing: '0.05em' }}>
                            Academic Performance & History
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.15rem' }}>
                            Semester Progression & CGPA Tracker
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>Overall CGPA</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FBCFE8' }}>
                              {student.academic_history[student.academic_history.length - 1]?.cgpa || '—'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>Credits Earned</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60A5FA' }}>
                              {student.academic_history.reduce((sum, h) => sum + (parseInt(h.credits_earned, 10) || 0), 0)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Semester-by-Semester Progression Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(130px, 1fr))`, gap: '0.65rem' }}>
                        {student.academic_history.map((h) => (
                          <div
                            key={h.semester}
                            style={{
                              background: 'rgba(0, 0, 0, 0.25)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '8px',
                              padding: '0.65rem',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8' }}>
                              Semester {h.semester}
                            </div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38BDF8', margin: '0.15rem 0' }}>
                              {h.sgpa} <span style={{ fontSize: '0.65rem', color: '#64748B' }}>SGPA</span>
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#34D399', fontWeight: 600 }}>
                              {h.status || 'Passed'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Marksheet Table */}
                  <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Sem</th>
                        <th>Subject</th>
                        <th>Exam Title</th>
                        <th>Date</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.exam_results?.length > 0 ? (
                        student.exam_results.map((res) => (
                          <tr key={res.id}>
                            <td>
                              <span style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#93C5FD'
                              }}>
                                Sem {res.subject_semester || student.current_semester}
                              </span>
                            </td>
                            <td>
                              <strong>{res.subject_code}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{res.subject_name}</div>
                            </td>
                            <td>{res.exam_name}</td>
                            <td>{res.exam_date ? res.exam_date.split('T')[0] : 'N/A'}</td>
                            <td>
                              <strong style={{ color: parseFloat(res.marks_obtained) >= parseFloat(res.passing_marks) ? '#10B981' : '#EF4444' }}>
                                {res.marks_obtained}
                              </strong> / {res.max_marks}
                            </td>
                            <td>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                background: res.grade === 'A+' || res.grade === 'A' ? 'rgba(16, 185, 129, 0.2)' : res.grade === 'F' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: res.grade === 'A+' || res.grade === 'A' ? '#34D399' : res.grade === 'F' ? '#F87171' : '#60A5FA'
                              }}>
                                {res.grade}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                              {res.remarks || '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>
                            No examination results recorded yet for this student.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
