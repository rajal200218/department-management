import React from 'react';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarCheck, 
  CalendarDays, 
  Award, 
  BookMarked, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Clock, 
  MapPin, 
  School,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { isAdmin, isDean, isHOD, isStudent } from '../services/permissions';

export default function Dashboard({ stats, onNavigate, onOpenAddDepartment, user }) {
  const admin = isAdmin(user);
  const dean = isDean(user);
  const hod = isHOD(user);
  const student = isStudent(user);

  // =========================================================================
  // VIEW 1: DEDICATED STUDENT PORTAL DASHBOARD
  // =========================================================================
  if (student || stats?.isStudent) {
    const sSummary = stats?.summary || {
      totalEnrolledSubjects: 4,
      attendancePercentage: 88.5,
      isLowAttendance: false,
      upcomingExamsCount: 2,
      pendingAssignmentsCount: 1
    };

    const studentData = stats?.student || user;
    const subjects = stats?.subjects || [];
    const upcomingExams = stats?.upcomingExams || [];
    const recentNotices = stats?.recentNotices || [];
    const assignments = stats?.assignments || [];

    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Welcome Student Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.45) 0%, rgba(67, 56, 202, 0.3) 50%, rgba(17, 28, 53, 0.9) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '18px',
          padding: '2rem',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            position: 'relative',
            zIndex: 2
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#93C5FD',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.75rem'
              }}>
                <Sparkles size={13} color="#60A5FA" />
                <span>LJ University • Student Academic Workspace</span>
              </div>

              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
                Welcome, {studentData?.name || 'Student'}!
              </h1>
              <p style={{ color: '#CBD5E1', fontSize: '0.875rem' }}>
                Enrollment: <strong style={{ color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>{studentData?.enrollment_no || 'LJU2024CS001'}</strong> • Semester {studentData?.current_semester || 4} • {studentData?.department_name || 'Computer Science & Engineering'}
              </p>
            </div>

            {/* Attendance Meter Card */}
            <div style={{
              background: 'rgba(11, 17, 32, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Overall Attendance
                </div>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: sSummary.isLowAttendance ? '#EF4444' : '#10B981',
                  lineHeight: 1.1
                }}>
                  {sSummary.attendancePercentage}%
                </div>
              </div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: sSummary.isLowAttendance ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: sSummary.isLowAttendance ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: sSummary.isLowAttendance ? '#F87171' : '#34D399'
              }}>
                <CalendarCheck size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Low Attendance Statutory Warning Alert */}
        {sSummary.isLowAttendance && (
          <div className="defaulter-alert-box">
            <AlertTriangle size={20} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Attendance Defaulter Warning:</strong> Your current attendance is{' '}
              <strong>{sSummary.attendancePercentage}%</strong>, which is below the statutory requirement of 75%. Please contact your course instructors to avoid exam disqualification.
            </div>
          </div>
        )}

        {/* 4 Quick Stat Cards */}
        <div className="stats-grid-4">
          <div className="stat-card" onClick={() => onNavigate('attendance')}>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>
              <CalendarCheck size={20} />
            </div>
            <div className="stat-value" style={{ color: sSummary.isLowAttendance ? '#EF4444' : '#10B981' }}>
              {sSummary.attendancePercentage}%
            </div>
            <div className="stat-label">My Attendance Log</div>
            <div className="stat-sub">View daily attendance history</div>
          </div>

          <div className="stat-card" onClick={() => onNavigate('timetables')}>
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' }}>
              <CalendarDays size={20} />
            </div>
            <div className="stat-value">Daily Schedule</div>
            <div className="stat-label">Class Timetable</div>
            <div className="stat-sub">Room numbers & lecture slots</div>
          </div>

          <div className="stat-card" onClick={() => onNavigate('exams')}>
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA' }}>
              <Award size={20} />
            </div>
            <div className="stat-value">{sSummary.upcomingExamsCount} Upcoming</div>
            <div className="stat-label">Examinations & Marks</div>
            <div className="stat-sub">Official grade transcript</div>
          </div>

          <div className="stat-card" onClick={() => onNavigate('assignments')}>
            <div className="stat-icon" style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2DD4BF' }}>
              <BookMarked size={20} />
            </div>
            <div className="stat-value">{sSummary.pendingAssignmentsCount} Due</div>
            <div className="stat-label">Assignments & Work</div>
            <div className="stat-sub">Submit coursework online</div>
          </div>
        </div>

        {/* 2-Column: Enrolled Courses & Upcoming Exams */}
        <div className="grid-2-col">
          {/* Enrolled Subjects */}
          <div className="section-box">
            <div className="section-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <BookOpen size={18} color="#60A5FA" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Enrolled Subjects</h2>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                {subjects.length} Courses this semester
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {subjects.map((sub) => (
                <div key={sub.id} className="item-list-row">
                  <div>
                    <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.875rem' }}>
                      {sub.subject_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                      {sub.subject_code} • {sub.credits} Credits • {sub.course_type}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.775rem', color: '#93C5FD', fontWeight: 600 }}>
                    {sub.faculty_name || 'Department Faculty'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Examinations */}
          <div className="section-box">
            <div className="section-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Award size={18} color="#A78BFA" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Upcoming Examinations</h2>
              </div>
              <button 
                onClick={() => onNavigate('exams')}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                <span>Full Schedule</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {upcomingExams.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                No upcoming examinations currently scheduled.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcomingExams.map((e) => (
                  <div key={e.id} className="item-list-row">
                    <div>
                      <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.875rem' }}>
                        {e.exam_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                        {e.subject_code} - {e.subject_name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#C4B5FD' }}>
                        {new Date(e.exam_date).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>{e.classroom}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notices Section */}
        <div className="section-box">
          <div className="section-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bell size={18} color="#FBBF24" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Campus & Academic Notices</h2>
            </div>
            <button 
              onClick={() => onNavigate('notices')}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              <span>View All Circulars</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {recentNotices.slice(0, 4).map((n) => (
              <div 
                key={n.id} 
                style={{
                  background: 'rgba(15, 23, 42, 0.55)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                    <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                      {n.category}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: '#64748B' }}>
                      {new Date(n.publish_date || n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                    {n.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4, margin: 0 }}>
                    {n.content?.length > 120 ? `${n.content.substring(0, 120)}...` : n.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ADMIN / DEAN / HOD / FACULTY DASHBOARD
  // =========================================================================
  const summary = stats?.summary || {
    totalStudents: 10,
    totalFaculty: 18,
    totalSubjects: 8,
    totalPrograms: 10,
    totalDepartments: 12,
    totalSchools: 5,
    overallAttendancePct: 86.5,
    defaultersCount: 1,
    departmentsWithHOD: 11,
    departmentsWithoutHOD: 1
  };

  const departmentStats = stats?.departmentStats || [];
  const recentNotices = stats?.recentNotices || [];
  const upcomingExams = stats?.upcomingExams || [];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Dashboard Top Header Bar */}
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
              {admin 
                ? 'LJ University • Department Management Dashboard' 
                : hod 
                ? `Department Head Portal • ${user?.department_name || ''}` 
                : 'Faculty Academic Portal'}
            </h1>
            <span className="badge badge-active">
              Live System
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Centralized academic administration, student records, timetable schedules, and examinations
          </p>
        </div>

        {admin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button onClick={onOpenAddDepartment} className="btn btn-primary">
              <Plus size={16} />
              <span>Add Department</span>
            </button>
          </div>
        )}
      </div>

      {/* 6 Primary Key Metric Cards */}
      <div className="stats-grid-6">
        {/* 1. Students */}
        <div className="stat-card" onClick={() => onNavigate('students')}>
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA' }}>
            <GraduationCap size={20} />
          </div>
          <div className="stat-value">{summary.totalStudents}</div>
          <div className="stat-label">Enrolled Students</div>
          <div className="stat-sub">Active academic roster</div>
        </div>

        {/* 2. Faculty */}
        <div className="stat-card" onClick={() => onNavigate('faculty')}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
            <Users size={20} />
          </div>
          <div className="stat-value">{summary.totalFaculty}</div>
          <div className="stat-label">Faculty Members</div>
          <div className="stat-sub">Professors & Instructors</div>
        </div>

        {/* 3. Subjects & Courses */}
        <div className="stat-card" onClick={() => onNavigate('subjects')}>
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22D3EE' }}>
            <BookOpen size={20} />
          </div>
          <div className="stat-value">{summary.totalSubjects}</div>
          <div className="stat-label">Courses & Subjects</div>
          <div className="stat-sub">Curricula & credits</div>
        </div>

        {/* 4. Academic Programs */}
        <div className="stat-card" onClick={() => onNavigate('programs')}>
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA' }}>
            <School size={20} />
          </div>
          <div className="stat-value">{summary.totalPrograms}</div>
          <div className="stat-label">Academic Programs</div>
          <div className="stat-sub">Degree certifications</div>
        </div>

        {/* 5. Attendance Average */}
        <div className="stat-card" onClick={() => onNavigate('attendance')}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
            <CalendarCheck size={20} />
          </div>
          <div className="stat-value" style={{ color: '#34D399' }}>{summary.overallAttendancePct}%</div>
          <div className="stat-label">Avg Attendance</div>
          <div className="stat-sub">University benchmark 75%</div>
        </div>

        {/* 6. Defaulters */}
        <div className="stat-card" onClick={() => onNavigate('attendance')}>
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#F87171' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-value" style={{ color: '#F87171' }}>{summary.defaultersCount}</div>
          <div className="stat-label">Shortage (&lt;75%)</div>
          <div className="stat-sub">Defaulters flagged</div>
        </div>
      </div>

      {/* Quick Access Action Matrix */}
      <div className="quick-access-box">
        <div style={{
          fontSize: '0.725rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#94A3B8',
          marginBottom: '0.5rem'
        }}>
          Quick Access & Module Actions
        </div>
        <div className="quick-actions-grid">
          <button onClick={() => onNavigate('students')} className="quick-action-tile">
            <span className="title">Manage Students</span>
            <span className="subtitle">Enrollment & Profile</span>
          </button>

          <button onClick={() => onNavigate('subjects')} className="quick-action-tile">
            <span className="title">Courses & Subjects</span>
            <span className="subtitle">Credits & Syllabi</span>
          </button>

          <button onClick={() => onNavigate('attendance')} className="quick-action-tile">
            <span className="title">Take Attendance</span>
            <span className="subtitle">Daily Marking & Excel</span>
          </button>

          <button onClick={() => onNavigate('timetables')} className="quick-action-tile">
            <span className="title">Class Schedules</span>
            <span className="subtitle">Conflict-Free Grid</span>
          </button>

          <button onClick={() => onNavigate('exams')} className="quick-action-tile">
            <span className="title">Examinations</span>
            <span className="subtitle">Grading & Marksheets</span>
          </button>

          <button onClick={() => onNavigate('notices')} className="quick-action-tile">
            <span className="title">Notice Board</span>
            <span className="subtitle">Broadcast Circulars</span>
          </button>
        </div>
      </div>

      {/* Department-wise Academic Statistics Table */}
      <div className="section-box">
        <div className="section-header-row">
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.2rem' }}>
              Department Academic Statistics
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: 0 }}>
              Live metrics across academic departments in LJ University
            </p>
          </div>
          <button 
            onClick={() => onNavigate('departments')}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
          >
            <span>View All Departments</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Code</th>
                <th style={{ textAlign: 'center' }}>Faculty</th>
                <th style={{ textAlign: 'center' }}>Students</th>
                <th style={{ textAlign: 'center' }}>Courses</th>
                <th style={{ textAlign: 'center' }}>Degree Programs</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((d) => (
                <tr 
                  key={d.id} 
                  onClick={() => onNavigate('department_profile', d.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 700, color: '#FFFFFF' }}>{d.department_name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#60A5FA', fontWeight: 600 }}>{d.department_code}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#F1F5F9' }}>{d.faculty_count}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#60A5FA' }}>{d.student_count}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#22D3EE' }}>{d.subject_count}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: '#A78BFA' }}>{d.program_count}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={d.status === 'Active' ? 'badge badge-active' : 'badge badge-inactive'}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column: Recent Circulars & Upcoming Exams */}
      <div className="grid-2-col">
        {/* Recent Circulars */}
        <div className="section-box">
          <div className="section-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bell size={18} color="#FBBF24" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Recent Notices & Circulars</h2>
            </div>
            <button 
              onClick={() => onNavigate('notices')}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              <span>Notice Board</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentNotices.slice(0, 4).map((n) => (
              <div key={n.id} className="item-list-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                      {n.category}
                    </span>
                    <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {n.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.content}
                  </p>
                </div>
                <div style={{ fontSize: '0.725rem', color: '#64748B', whiteSpace: 'nowrap', marginLeft: '0.75rem' }}>
                  {new Date(n.publish_date || n.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Examinations */}
        <div className="section-box">
          <div className="section-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Award size={18} color="#A78BFA" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Upcoming Examinations</h2>
            </div>
            <button 
              onClick={() => onNavigate('exams')}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              <span>Exam Schedule</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingExams.slice(0, 4).map((e) => (
              <div key={e.id} className="item-list-row">
                <div>
                  <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.875rem' }}>
                    {e.exam_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                    {e.subject_code} - {e.subject_name} ({e.department_name})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#C4B5FD' }}>
                    {new Date(e.exam_date).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748B' }}>{e.classroom}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
