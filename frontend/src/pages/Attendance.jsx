import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck2, 
  Search, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  Download, 
  Save, 
  Filter, 
  UserCheck, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { exportToExcel } from '../utils/excelExporter';
import { canMarkAttendance } from '../services/permissions';

export default function Attendance({ user, departments = [], subjects = [] }) {
  const [activeTab, setActiveTab] = useState('register'); // 'register', 'mark'
  const canMark = canMarkAttendance(user);

  // Subjects state with auto-fetch fallback
  const [subjectsList, setSubjectsList] = useState(subjects || []);

  useEffect(() => {
    if (subjects && subjects.length > 0) {
      setSubjectsList(subjects);
    } else {
      api.getSubjects().then(res => {
        if (res.success && Array.isArray(res.data)) {
          setSubjectsList(res.data);
        }
      }).catch(err => console.error('Error fetching subjects in Attendance:', err));
    }
  }, [subjects]);

  // Filter States for Register
  const [selectedDept, setSelectedDept] = useState(user?.department_id ? String(user.department_id) : '');
  const [selectedSem, setSelectedSem] = useState('4');
  const [selectedSub, setSelectedSub] = useState('');
  const [reportData, setReportData] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [loadingReport, setLoadingReport] = useState(true);

  // States for Daily Marking
  const [markDept, setMarkDept] = useState(user?.department_id ? String(user.department_id) : '');
  const [markSem, setMarkSem] = useState('4');
  const [markSubject, setMarkSubject] = useState('');
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentRoster, setStudentRoster] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { student_id: { status: 'Present'/'Absent'/'Late'/'Excused', remarks: '' } }
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Load Attendance Register Report
  useEffect(() => {
    loadAttendanceReport();
  }, [selectedDept, selectedSem, selectedSub]);

  const loadAttendanceReport = async () => {
    setLoadingReport(true);
    try {
      const params = {};
      if (selectedDept) params.department_id = selectedDept;
      if (selectedSem) params.semester = selectedSem;
      if (selectedSub) params.subject_id = selectedSub;

      const res = await api.getAttendanceReport(params);
      if (res.success) {
        setReportData(res.data);
        setReportSummary(res.summary);
      }
    } catch (err) {
      console.error('Error fetching attendance report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  // Load Students for Marking Attendance
  useEffect(() => {
    if (activeTab === 'mark' && markDept && markSem) {
      loadStudentsForMarking();
    }
  }, [activeTab, markDept, markSem, markSubject, markDate]);

  const loadStudentsForMarking = async () => {
    setLoadingRoster(true);
    try {
      const res = await api.getStudents({
        department_id: markDept,
        semester: markSem,
        status: 'Active'
      });
      if (res.success) {
        setStudentRoster(res.data);
        
        // Also fetch any existing attendance for this date & subject
        let existingMap = {};
        if (markSubject && markDate) {
          try {
            const attRes = await api.getAttendance({
              subject_id: markSubject,
              date: markDate
            });
            if (attRes.success && attRes.data.length > 0) {
              attRes.data.forEach(a => {
                existingMap[a.student_id] = {
                  status: a.status,
                  remarks: a.remarks || ''
                };
              });
            }
          } catch (e) {
            // No existing records yet
          }
        }

        // Initialize default map
        const initialMap = {};
        res.data.forEach(s => {
          initialMap[s.id] = existingMap[s.id] || { status: 'Present', remarks: '' };
        });
        setAttendanceMap(initialMap);
      }
    } catch (err) {
      console.error('Error loading roster:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status
      }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        remarks
      }
    }));
  };

  const handleMarkAll = (status) => {
    setAttendanceMap(prev => {
      const updated = { ...prev };
      studentRoster.forEach(s => {
        updated[s.id] = { ...(updated[s.id] || {}), status };
      });
      return updated;
    });
  };

  const handleSaveAttendance = async () => {
    if (!markSubject) {
      alert('Please select a subject first.');
      return;
    }
    if (!markDate) {
      alert('Please select an attendance date.');
      return;
    }

    setSavingAttendance(true);
    setFeedbackMsg(null);
    try {
      const records = studentRoster.map(s => ({
        student_id: s.id,
        status: attendanceMap[s.id]?.status || 'Present',
        remarks: attendanceMap[s.id]?.remarks || ''
      }));

      const res = await api.markAttendance({
        subject_id: markSubject,
        date: markDate,
        records
      });

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: res.message });
        loadAttendanceReport();
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save attendance.' });
    } finally {
      setSavingAttendance(false);
    }
  };

  // Export Attendance Register to Excel
  const handleExportExcel = () => {
    const exportData = reportData.map(r => ({
      'Enrollment No': r.enrollment_no,
      'Student Name': r.student_name,
      'Department': r.department_name,
      'Semester': `Semester ${r.current_semester}`,
      'Total Lectures': r.total_lectures,
      'Attended': r.attended_lectures,
      'Absent': r.absent_lectures,
      'Late': r.late_lectures,
      'Attendance %': `${r.attendance_percentage}%`,
      'Defaulter Status': r.status_alert
    }));
    exportToExcel(exportData, 'LJU_Attendance_Report', 'Attendance Register');
  };

  // Filter subjects based on department and semester
  const availableSubjects = subjectsList.filter(s => {
    if (activeTab === 'mark') {
      const matchDept = !markDept || s.department_id === parseInt(markDept, 10);
      const matchSem = !markSem || s.semester === parseInt(markSem, 10);
      return matchDept && matchSem;
    } else {
      const matchDept = !selectedDept || s.department_id === parseInt(selectedDept, 10);
      const matchSem = !selectedSem || s.semester === parseInt(selectedSem, 10);
      return matchDept && matchSem;
    }
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
              Attendance Management
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              LJ University DMS
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Daily attendance recording, percentage analytics, and 75% statutory shortage monitoring
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setActiveTab('register')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: activeTab === 'register' ? '#60A5FA' : '#94A3B8',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'register' ? '2px solid #3B82F6' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          📊 Attendance Register & Defaulters List
        </button>

        {canMark && (
          <button
            onClick={() => setActiveTab('mark')}
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: activeTab === 'mark' ? '#60A5FA' : '#94A3B8',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'mark' ? '2px solid #3B82F6' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            ✍️ Mark Daily Attendance
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ATTENDANCE REGISTER & REPORTS                                      */}
      {/* ========================================================================= */}
      {activeTab === 'register' && (
        <div>
          {/* Summary KPI Cards */}
          {reportSummary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Enrolled Students
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', margin: '0.25rem 0' }}>
                  {reportSummary.totalStudents}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Active Roster</div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Average Attendance
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', margin: '0.25rem 0' }}>
                  {reportSummary.averageAttendance}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Classroom average</div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Defaulters Count (&lt;75%)
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: reportSummary.defaultersCount > 0 ? '#EF4444' : '#10B981', margin: '0.25rem 0' }}>
                  {reportSummary.defaultersCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Below minimum threshold</div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Statutory Rule
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60A5FA', margin: '0.25rem 0' }}>
                  75%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Exam eligibility criterion</div>
              </div>
            </div>
          )}

          {/* Defaulter Alert Banner */}
          {reportSummary && reportSummary.defaultersCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '1.5rem',
              color: '#F87171'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertTriangle size={20} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  <strong>Attendance Warning:</strong> {reportSummary.defaultersCount} student(s) currently fall below the required 75% attendance threshold.
                </span>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            background: '#131E35',
            padding: '0.85rem 1rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {/* Department */}
            <div style={{ width: '220px' }}>
              <select
                className="form-control"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.department_code} - {d.department_name}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div style={{ width: '160px' }}>
              <select
                className="form-control"
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div style={{ width: '250px' }}>
              <select
                className="form-control"
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
              >
                <option value="">All Subjects Aggregate</option>
                {availableSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Attendance Register Table */}
          <div style={{
            background: '#131E35',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden'
          }}>
            {loadingReport ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
                Calculating attendance percentages...
              </div>
            ) : reportData.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
                No attendance logs found for selected criteria.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Enrollment No</th>
                      <th>Student Name</th>
                      <th>Department & Sem</th>
                      <th>Lectures (Attended / Total)</th>
                      <th>Absent / Late</th>
                      <th>Attendance %</th>
                      <th>Eligibility Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => (
                      <tr key={row.student_id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#60A5FA' }}>
                            {row.enrollment_no}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#F1F5F9', whiteSpace: 'nowrap' }}>{row.student_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap' }}>{row.student_email}</div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: '#F1F5F9' }}>{row.department_code}</span>
                          <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}> • Sem {row.current_semester}</span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <strong style={{ color: '#F1F5F9' }}>{row.attended_lectures}</strong> / {row.total_lectures}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                          <span style={{ color: row.absent_lectures > 0 ? '#EF4444' : '#64748B' }}>{row.absent_lectures} Absent</span>
                          {row.late_lectures > 0 && <span style={{ color: '#F59E0B' }}> • {row.late_lectures} Late</span>}
                        </td>
                        <td style={{ minWidth: '150px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{
                              flex: 1,
                              height: '6px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              minWidth: '60px'
                            }}>
                              <div style={{
                                width: `${Math.min(row.attendance_percentage, 100)}%`,
                                height: '100%',
                                background: row.is_low_attendance ? '#EF4444' : row.attendance_percentage < 85 ? '#F59E0B' : '#10B981'
                              }} />
                            </div>
                            <strong style={{
                              color: row.is_low_attendance ? '#EF4444' : row.attendance_percentage < 85 ? '#F59E0B' : '#10B981',
                              fontSize: '0.875rem'
                            }}>
                              {row.attendance_percentage}%
                            </strong>
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            whiteSpace: 'nowrap',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: row.is_low_attendance ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: row.is_low_attendance ? '#F87171' : '#34D399',
                            border: `1px solid ${row.is_low_attendance ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                          }}>
                            {row.is_low_attendance ? (
                              <>
                                <AlertTriangle size={12} />
                                <span>Defaulter (&lt;75%)</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} />
                                <span>Exam Eligible</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MARK DAILY ATTENDANCE                                              */}
      {/* ========================================================================= */}
      {activeTab === 'mark' && canMark && (
        <div>
          {/* Controls to pick Session/Class */}
          <div style={{
            background: '#131E35',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label className="form-label">Department</label>
              <select
                className="form-control"
                value={markDept}
                onChange={(e) => { setMarkDept(e.target.value); setMarkSubject(''); }}
              >
                <option value="">-- Select Department --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.department_code} - {d.department_name}</option>
                ))}
              </select>
            </div>

            <div style={{ width: '140px' }}>
              <label className="form-label">Semester</label>
              <select
                className="form-control"
                value={markSem}
                onChange={(e) => { setMarkSem(e.target.value); setMarkSubject(''); }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: '2', minWidth: '220px' }}>
              <label className="form-label">Subject</label>
              <select
                className="form-control"
                value={markSubject}
                onChange={(e) => setMarkSubject(e.target.value)}
              >
                <option value="">-- Choose Subject to Mark --</option>
                {availableSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
                ))}
              </select>
            </div>

            <div style={{ width: '160px' }}>
              <label className="form-label">Session Date</label>
              <input
                type="date"
                className="form-control"
                value={markDate}
                onChange={(e) => setMarkDate(e.target.value)}
              />
            </div>
          </div>

          {feedbackMsg && (
            <div style={{
              padding: '0.85rem 1.1rem',
              borderRadius: '10px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: feedbackMsg.type === 'success' ? '#34D399' : '#F87171'
            }}>
              {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Marking Action Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                Mark All Absent
              </button>
            </div>

            <button
              onClick={handleSaveAttendance}
              disabled={savingAttendance || studentRoster.length === 0}
              className="btn btn-primary"
            >
              <Save size={16} /> {savingAttendance ? 'Saving...' : 'Save Attendance to Database'}
            </button>
          </div>

          {/* Student Roster Marking Table */}
          <div style={{
            background: '#131E35',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden'
          }}>
            {loadingRoster ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
                Loading students roster...
              </div>
            ) : studentRoster.length === 0 ? (
              <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
                No active students found in this department and semester.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Enrollment No</th>
                    <th>Student Name</th>
                    <th>Attendance Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRoster.map(s => {
                    const curStatus = attendanceMap[s.id]?.status || 'Present';
                    return (
                      <tr key={s.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#60A5FA' }}>
                            {s.enrollment_no}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{s.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.gender}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {[
                              { id: 'Present', label: 'Present', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' },
                              { id: 'Absent', label: 'Absent', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' },
                              { id: 'Late', label: 'Late', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' },
                              { id: 'Excused', label: 'Excused', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.2)' }
                            ].map(btn => (
                              <button
                                key={btn.id}
                                type="button"
                                onClick={() => handleStatusChange(s.id, btn.id)}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border: curStatus === btn.id ? `1.5px solid ${btn.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                                  background: curStatus === btn.id ? btn.bg : 'transparent',
                                  color: curStatus === btn.id ? btn.color : '#94A3B8',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Optional notes / reason..."
                            className="form-control"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                            value={attendanceMap[s.id]?.remarks || ''}
                            onChange={(e) => handleRemarksChange(s.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
