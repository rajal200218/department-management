import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Download, 
  Edit3, 
  Trash2, 
  UserCheck, 
  Search, 
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';
import { isAdmin, isHOD, isFaculty, isStudent } from '../services/permissions';
import ExamModal from '../components/ExamModal';
import ExamMarksModal from '../components/ExamMarksModal';

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

function getOverallGrade(totalMarks, totalMax) {
  if (!totalMax || totalMax <= 0) return '—';
  const pct = (parseFloat(totalMarks) / parseFloat(totalMax)) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 40) return 'C';
  return 'F';
}

export default function Examinations({ user, departments = [] }) {
  const isStudentUser = isStudent(user);
  const canManage = isAdmin(user) || isHOD(user) || isFaculty(user);

  // Active Tab
  const [activeTab, setActiveTab] = useState(isStudentUser ? 'my_report' : 'schedules');

  // Core Data
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [myResults, setMyResults] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExamDetails, setSelectedExamDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportSem, setSelectedReportSem] = useState('All');

  // Modals
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [marksExamId, setMarksExamId] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    fetchSubjects();
    if (isStudentUser) {
      fetchMyResults();
    } else {
      fetchStudentsList();
    }
  }, [isStudentUser]);

  useEffect(() => {
    fetchExams();
  }, [selectedDept, statusFilter]);

  useEffect(() => {
    if (selectedExamId) {
      fetchExamResultsSheet(selectedExamId);
    }
  }, [selectedExamId]);

  useEffect(() => {
    if (activeTab === 'my_report') {
      if (isStudentUser) {
        fetchMyResults();
      } else if (selectedStudentId) {
        fetchMyResults(selectedStudentId);
      }
    }
  }, [activeTab, selectedStudentId]);

  const fetchStudentsList = async () => {
    try {
      const res = await api.getStudents();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setStudentsList(res.data);
        if (!selectedStudentId) {
          setSelectedStudentId(String(res.data[0].id));
        }
      }
    } catch (err) {
      console.error('Error fetching students list:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.getSubjects();
      if (res.success) setSubjects(res.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDept) params.department_id = selectedDept;
      if (statusFilter) params.status = statusFilter;

      const res = await api.getExams(params);
      if (res.success) {
        setExams(res.data);
        if (res.data.length > 0 && !selectedExamId) {
          setSelectedExamId(String(res.data[0].id));
        }
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
      showAlert('Failed to load exam schedules.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyResults = async (studentId) => {
    setLoading(true);
    try {
      const res = await api.getMyExamResults(studentId);
      if (res.success && res.data) {
        if (res.data.student && Array.isArray(res.data.results)) {
          setMyResults(res.data);
        } else if (Array.isArray(res.data)) {
          // Fallback if raw array is returned
          const totalMarks = res.data.reduce((sum, r) => sum + parseFloat(r.marks_obtained || 0), 0);
          const totalMax = res.data.reduce((sum, r) => sum + parseFloat(r.max_marks || 0), 0);
          setMyResults({
            student: user && user.isStudent ? user : { name: 'Student', enrollment_no: '', current_semester: '', department_name: '' },
            totalMarks,
            totalMax,
            percentage: totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : 0,
            results: res.data
          });
        } else {
          setMyResults(res.data);
        }
      } else {
        setMyResults(null);
      }
    } catch (err) {
      console.error('Error fetching student report card:', err);
      setMyResults(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamResultsSheet = async (id) => {
    setLoadingDetails(true);
    try {
      const res = await api.getExamById(id);
      if (res.success) {
        setSelectedExamDetails(res.data);
      }
    } catch (err) {
      console.error('Error fetching exam roster:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlertMsg({ message, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleOpenAddExam = () => {
    setEditingExam(null);
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam) => {
    setEditingExam(exam);
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (examData) => {
    if (editingExam) {
      const res = await api.updateExam(editingExam.id, examData);
      if (res.success) {
        showAlert('Exam schedule updated successfully.');
        fetchExams();
      } else {
        throw new Error(res.message || 'Failed to update exam');
      }
    } else {
      const res = await api.createExam(examData);
      if (res.success) {
        showAlert('New examination scheduled successfully.');
        fetchExams();
      } else {
        throw new Error(res.message || 'Failed to schedule exam');
      }
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Are you sure you want to delete this examination schedule and any recorded marks?')) return;
    try {
      const res = await api.deleteExam(id);
      if (res.success) {
        showAlert('Exam schedule deleted successfully.');
        fetchExams();
        if (String(id) === selectedExamId) setSelectedExamId('');
      } else {
        showAlert(res.message || 'Failed to delete exam.', 'error');
      }
    } catch (err) {
      showAlert(err.message || 'Error deleting exam.', 'error');
    }
  };

  const exportResultsToCSV = () => {
    if (!selectedExamDetails || !selectedExamDetails.students) return;

    const rows = [
      ['LJ UNIVERSITY - DEPARTMENT EXAMINATION RESULT SHEET'],
      [`Exam: ${selectedExamDetails.exam_name}`],
      [`Course: ${selectedExamDetails.subject_name} (${selectedExamDetails.subject_code})`],
      [`Max Marks: ${selectedExamDetails.max_marks}`, `Passing Marks: ${selectedExamDetails.passing_marks}`],
      [],
      ['Enrollment No', 'Student Name', 'Marks Obtained', 'Percentage', 'Grade', 'Status', 'Remarks']
    ];

    selectedExamDetails.students.forEach(s => {
      const marks = s.marks_obtained !== null ? s.marks_obtained : 'N/A';
      const pct = s.marks_obtained !== null ? `${((s.marks_obtained / selectedExamDetails.max_marks) * 100).toFixed(1)}%` : 'N/A';
      const status = s.marks_obtained !== null && s.marks_obtained >= selectedExamDetails.passing_marks ? 'PASS' : s.marks_obtained !== null ? 'FAIL' : 'ABSENT';
      rows.push([
        s.enrollment_no,
        s.student_name,
        marks,
        pct,
        s.grade || '—',
        status,
        s.remarks || ''
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedExamDetails.exam_name.replace(/\s+/g, '_')}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredExams = exams.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.exam_name?.toLowerCase().includes(q) ||
      e.subject_name?.toLowerCase().includes(q) ||
      e.subject_code?.toLowerCase().includes(q) ||
      e.classroom?.toLowerCase().includes(q)
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

      {/* Header */}
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
              Examinations & Grading Register
            </h1>
            <span className="badge badge-purple">
              Evaluation Portal
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Internal evaluations, exam schedules, class grading rosters, and academic report cards
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Tabs */}
          <div className="tab-strip">
            {!isStudentUser && (
              <>
                <button
                  onClick={() => setActiveTab('schedules')}
                  className={`tab-btn ${activeTab === 'schedules' ? 'active-purple' : ''}`}
                >
                  Exam Schedules
                </button>
                <button
                  onClick={() => setActiveTab('results_sheet')}
                  className={`tab-btn ${activeTab === 'results_sheet' ? 'active-purple' : ''}`}
                >
                  Grading Register
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('my_report')}
              className={`tab-btn ${activeTab === 'my_report' ? 'active-purple' : ''}`}
            >
              {isStudentUser ? 'My Academic Report Card' : 'Student Report Card'}
            </button>
          </div>

          {canManage && activeTab === 'schedules' && (
            <button onClick={handleOpenAddExam} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
              <Plus size={16} />
              <span>Schedule Exam</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: EXAM SCHEDULES */}
      {activeTab === 'schedules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filter Bar */}
          <div className="filter-toolbar">
            <div className="filter-items-wrap">
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="form-label" style={{ margin: 0 }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="search-input-wrap">
              <Search size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exams..."
              />
            </div>
          </div>

          {/* Exam Cards Grid */}
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
              Loading examinations...
            </div>
          ) : filteredExams.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              color: '#64748B'
            }}>
              <Award size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94A3B8' }}>
                No examinations found matching your filter
              </div>
            </div>
          ) : (
            <div className="grid-3-col">
              {filteredExams.map((exam) => (
                <div key={exam.id} className="entity-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span className={exam.status === 'Completed' ? 'badge badge-active' : 'badge badge-purple'}>
                        {exam.status}
                      </span>
                      <span style={{ fontSize: '0.725rem', fontFamily: 'var(--font-mono)', color: '#CBD5E1', background: 'rgba(15, 23, 42, 0.7)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                        {exam.max_marks} pts max
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.25rem' }}>
                      {exam.exam_name}
                    </h3>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#C4B5FD', marginBottom: '0.75rem' }}>
                      {exam.subject_code} - {exam.subject_name}
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '0.775rem',
                      color: '#94A3B8'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Calendar size={13} color="#64748B" />
                        <span>{new Date(exam.exam_date).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Clock size={13} color="#64748B" />
                        <span>{exam.time_slot}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <MapPin size={13} color="#64748B" />
                        <span>{exam.classroom}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)'
                  }}>
                    <button
                      onClick={() => setMarksExamId(exam.id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#C4B5FD', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                    >
                      <UserCheck size={13} />
                      <span>Enter Marks</span>
                    </button>

                    {canManage && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                          onClick={() => handleOpenEditExam(exam)}
                          className="btn-icon"
                          title="Edit Exam"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="btn-icon"
                          style={{ color: '#F87171' }}
                          title="Delete Exam"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GRADING REGISTER & RESULTS SHEET */}
      {activeTab === 'results_sheet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Exam Selector Toolbar */}
          <div className="filter-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="form-label" style={{ margin: 0 }}>Select Exam:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '280px', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              >
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.exam_name} ({e.subject_code} - Sem {e.semester})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                onClick={() => setMarksExamId(selectedExamId)}
                disabled={!selectedExamId}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', padding: '0.45rem 0.95rem', fontSize: '0.78rem' }}
              >
                <UserCheck size={14} />
                <span>Update Marks</span>
              </button>
              <button
                onClick={exportResultsToCSV}
                disabled={!selectedExamDetails}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.78rem' }}
              >
                <Download size={14} />
                <span>Export Marks CSV</span>
              </button>
            </div>
          </div>

          {/* Roster & Marks Table */}
          {loadingDetails ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
              Loading results roster...
            </div>
          ) : !selectedExamDetails ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              Please select an exam schedule above
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Summary Stats Grid */}
              <div className="stats-grid-4">
                <div className="stat-card" style={{ cursor: 'default' }}>
                  <div className="stat-label">Enrolled Students</div>
                  <div className="stat-value">{selectedExamDetails.students?.length || 0}</div>
                  <div className="stat-sub">Class size</div>
                </div>
                <div className="stat-card" style={{ cursor: 'default' }}>
                  <div className="stat-label">Graded Count</div>
                  <div className="stat-value" style={{ color: '#A78BFA' }}>
                    {selectedExamDetails.students?.filter(s => s.marks_obtained !== null).length || 0}
                  </div>
                  <div className="stat-sub">Evaluated</div>
                </div>
                <div className="stat-card" style={{ cursor: 'default' }}>
                  <div className="stat-label">Passed Count</div>
                  <div className="stat-value" style={{ color: '#34D399' }}>
                    {selectedExamDetails.students?.filter(s => s.marks_obtained !== null && s.marks_obtained >= selectedExamDetails.passing_marks).length || 0}
                  </div>
                  <div className="stat-sub">Passing threshold met</div>
                </div>
                <div className="stat-card" style={{ cursor: 'default' }}>
                  <div className="stat-label">Max / Pass Threshold</div>
                  <div className="stat-value" style={{ color: '#FCD34D' }}>
                    {selectedExamDetails.max_marks} / {selectedExamDetails.passing_marks}
                  </div>
                  <div className="stat-sub">Passing marks</div>
                </div>
              </div>

              {/* Data Table */}
              <div className="section-box" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Enrollment No</th>
                        <th>Student Name</th>
                        <th style={{ textAlign: 'center' }}>Marks Obtained</th>
                        <th style={{ textAlign: 'center' }}>Percentage</th>
                        <th style={{ textAlign: 'center' }}>Grade</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedExamDetails.students?.map((s, idx) => {
                        const hasMarks = s.marks_obtained !== null && s.marks_obtained !== undefined;
                        const pct = hasMarks ? ((s.marks_obtained / selectedExamDetails.max_marks) * 100).toFixed(1) : null;
                        const isPassing = hasMarks && s.marks_obtained >= selectedExamDetails.passing_marks;

                        return (
                          <tr key={s.student_id}>
                            <td style={{ color: '#64748B', fontSize: '0.75rem' }}>{idx + 1}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>{s.enrollment_no}</td>
                            <td style={{ fontWeight: 600, color: '#E2E8F0' }}>{s.student_name}</td>
                            <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>
                              {hasMarks ? `${s.marks_obtained} / ${selectedExamDetails.max_marks}` : '—'}
                            </td>
                            <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#CBD5E1' }}>
                              {pct ? `${pct}%` : '—'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={getGradeBadgeClass(s.grade)}>
                                {s.grade || '—'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {hasMarks ? (
                                <span className={isPassing ? 'badge badge-active' : 'badge badge-red'}>
                                  {isPassing ? 'PASS' : 'FAIL'}
                                </span>
                              ) : (
                                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>Unrecorded</span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                              {s.remarks || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDENT REPORT CARD */}
      {activeTab === 'my_report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Student Selector Toolbar for Admin / Faculty */}
          {!isStudentUser && (
            <div className="filter-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="form-label" style={{ margin: 0, fontWeight: 700 }}>Select Student:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setSelectedStudentId(sid);
                    fetchMyResults(sid);
                  }}
                  className="form-select"
                  style={{ width: 'auto', minWidth: '320px', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                >
                  {studentsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.enrollment_no} - Sem {s.current_semester})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Official university transcript and evaluation dossier
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
              Generating academic transcript...
            </div>
          ) : !myResults || !myResults.student || !myResults.results || myResults.results.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              color: '#64748B'
            }}>
              <GraduationCap size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94A3B8' }}>
                {myResults && myResults.student ? `No examination records found for ${myResults.student.name} (${myResults.student.enrollment_no})` : 'No examination records found for this student account'}
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                Marks will appear here as soon as course instructors evaluate and publish results.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Transcript Overview Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.45) 0%, rgba(30, 27, 75, 0.95) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '16px',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>
                      OFFICIAL GRADE TRANSCRIPT & ACADEMIC DOSSIER
                    </span>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: '0.35rem 0' }}>
                      {myResults.student.name}
                    </h2>
                    <p style={{ color: '#CBD5E1', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>
                      Enrollment: <strong style={{ color: '#C4B5FD' }}>{myResults.student.enrollment_no}</strong> • Current Semester {myResults.student.current_semester} • {myResults.student.department_name}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.725rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>Cumulative CGPA</div>
                      <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FBCFE8' }}>
                        {myResults.cgpa || (myResults.totalMax > 0 ? ((myResults.totalMarks / myResults.totalMax) * 10 / 10).toFixed(2) : '—')}
                        <span style={{ fontSize: '0.85rem', color: '#A78BFA' }}> / 10.0</span>
                      </div>
                    </div>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      background: 'rgba(139, 92, 246, 0.3)',
                      border: '1px solid rgba(139, 92, 246, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#C4B5FD',
                      fontWeight: 800,
                      fontSize: '1.35rem'
                    }}>
                      {getOverallGrade(myResults.totalMarks, myResults.totalMax)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Progression Over Time (Past Semesters) */}
              {myResults.academic_history?.length > 0 && (
                <div className="section-box" style={{ background: 'rgba(15, 23, 42, 0.7)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.725rem', textTransform: 'uppercase', fontWeight: 800, color: '#A78BFA', letterSpacing: '0.05em' }}>
                        Performance Over Time
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: '0.2rem 0 0 0' }}>
                        Semester-by-Semester Academic Progression
                      </h3>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      Track SGPA & cumulative CGPA evolution
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`, gap: '0.85rem' }}>
                    {myResults.academic_history.map((h) => (
                      <div
                        key={h.semester}
                        onClick={() => setSelectedReportSem(String(h.semester))}
                        style={{
                          background: selectedReportSem === String(h.semester) 
                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)' 
                            : 'rgba(0, 0, 0, 0.3)',
                          border: selectedReportSem === String(h.semester)
                            ? '1px solid rgba(139, 92, 246, 0.6)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          padding: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1' }}>
                            Sem {h.semester}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#64748B' }}>
                            {h.academic_year || ''}
                          </span>
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38BDF8', margin: '0.15rem 0' }}>
                          {h.sgpa} <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>SGPA</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', marginTop: '0.35rem' }}>
                          <span style={{ color: '#94A3B8' }}>CGPA: <strong style={{ color: '#FBCFE8' }}>{h.cgpa}</strong></span>
                          <span style={{ color: '#34D399', fontWeight: 700 }}>{h.status || 'Passed'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary KPIs */}
              <div className="stats-grid-4">
                <div className="stat-card" style={{ cursor: 'default' }}>
                  <div className="stat-label">Cumulative CGPA</div>
                  <div className="stat-value" style={{ color: '#FBCFE8' }}>
                    {myResults.cgpa || (myResults.totalMax > 0 ? ((myResults.totalMarks / myResults.totalMax) * 10 / 10).toFixed(2) : '—')}
                  </div>
                  <div className="stat-sub">Scale of 10.00</div>
                </div>
                <div className="stat-card" style={{ cursor: 'default' }}>
                  <div className="stat-label">Credits Earned</div>
                  <div className="stat-value" style={{ color: '#60A5FA' }}>
                    {myResults.academic_history?.reduce((acc, h) => acc + (parseInt(h.credits_earned, 10) || 0), 0) || myResults.results?.reduce((acc, r) => acc + (parseInt(r.credits, 10) || 3), 0) || 0}
                  </div>
                  <div className="stat-sub">Academic credits</div>
                </div>
                <div className="stat-card" style={{ cursor: 'default' }}>
                  <div className="stat-label">Semesters Completed</div>
                  <div className="stat-value" style={{ color: '#A78BFA' }}>
                    {myResults.academic_history?.length || 0}
                  </div>
                  <div className="stat-sub">Degree progression</div>
                </div>
                <div className="stat-card" style={{ cursor: 'default' }}>
                  <div className="stat-label">Overall Aggregate</div>
                  <div className="stat-value" style={{ color: '#34D399' }}>
                    {myResults.totalMax > 0 ? `${((myResults.totalMarks / myResults.totalMax) * 100).toFixed(1)}%` : '0%'}
                  </div>
                  <div className="stat-sub">{myResults.totalMarks} / {myResults.totalMax} marks</div>
                </div>
              </div>

              {/* Semester Filter Tabs */}
              <div className="filter-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="form-label" style={{ margin: 0, fontWeight: 700 }}>Filter Semester:</span>
                <button
                  type="button"
                  onClick={() => setSelectedReportSem('All')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: selectedReportSem === 'All' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedReportSem === 'All' ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: selectedReportSem === 'All' ? '#60A5FA' : '#94A3B8'
                  }}
                >
                  All Semesters ({myResults.results?.length || 0})
                </button>
                {Array.from(new Set(myResults.results?.map(r => r.subject_semester || myResults.student?.current_semester))).sort((a, b) => a - b).map(sem => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedReportSem(String(sem))}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: selectedReportSem === String(sem) ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: selectedReportSem === String(sem) ? '1px solid #8B5CF6' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: selectedReportSem === String(sem) ? '#C4B5FD' : '#94A3B8'
                    }}
                  >
                    Semester {sem} ({myResults.results?.filter(r => (r.subject_semester || myResults.student?.current_semester) === sem).length})
                  </button>
                ))}
              </div>

              {/* Marksheet Table */}
              <div className="section-box" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-responsive">
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Sem</th>
                        <th>Subject Code</th>
                        <th>Course Title</th>
                        <th>Exam</th>
                        <th style={{ textAlign: 'center' }}>Credits</th>
                        <th style={{ textAlign: 'center' }}>Marks</th>
                        <th style={{ textAlign: 'center' }}>Percentage</th>
                        <th style={{ textAlign: 'center' }}>Grade</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                        <th>Evaluator Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myResults.results
                        ?.filter(r => selectedReportSem === 'All' || String(r.subject_semester || myResults.student?.current_semester) === String(selectedReportSem))
                        .map((r, idx) => {
                          const pct = ((r.marks_obtained / r.max_marks) * 100).toFixed(1);
                          const isPassing = r.marks_obtained >= r.passing_marks;

                          return (
                            <tr key={idx}>
                              <td>
                                <span style={{
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  color: '#93C5FD'
                                }}>
                                  Sem {r.subject_semester || myResults.student?.current_semester}
                                </span>
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#C4B5FD' }}>{r.subject_code}</td>
                              <td style={{ fontWeight: 700, color: '#FFFFFF' }}>{r.subject_name}</td>
                              <td style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>{r.exam_name}</td>
                              <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#CBD5E1' }}>
                                {r.credits || 3}
                              </td>
                              <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>
                                {r.marks_obtained} / {r.max_marks}
                              </td>
                              <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#CBD5E1' }}>{pct}%</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={getGradeBadgeClass(r.grade)}>
                                  {r.grade}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={isPassing ? 'badge badge-active' : 'badge badge-red'}>
                                  {isPassing ? 'PASS' : 'FAIL'}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                {r.remarks || 'Standard evaluation'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        onSave={handleSaveExam}
        exam={editingExam}
        subjects={subjects}
        departments={departments}
      />

      <ExamMarksModal
        isOpen={Boolean(marksExamId)}
        onClose={() => setMarksExamId(null)}
        examId={marksExamId}
        onSuccess={() => {
          showAlert('Marks recorded and published successfully.');
          fetchExams();
          if (selectedExamId) fetchExamResultsSheet(selectedExamId);
          fetchMyResults(isStudentUser ? undefined : selectedStudentId);
        }}
      />
    </div>
  );
}
