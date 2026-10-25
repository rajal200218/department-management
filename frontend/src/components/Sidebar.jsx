import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  GraduationCap, 
  School,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Award,
  BookMarked,
  Bell,
  Database
} from 'lucide-react';
import { isAdmin, isDean, isHOD, isStudent } from '../services/permissions';

export default function Sidebar({ currentView, setCurrentView, user }) {
  const adminOrDean = isAdmin(user) || isDean(user);
  const hod = isHOD(user);
  const student = isStudent(user);

  // Student portal navigation items
  const studentNavItems = [
    { id: 'dashboard', label: 'My Overview', icon: LayoutDashboard },
    { id: 'attendance', label: 'My Attendance', icon: CalendarCheck },
    { id: 'timetables', label: 'Class Timetable', icon: CalendarDays },
    { id: 'exams', label: 'Examinations & Marks', icon: Award },
    { id: 'assignments', label: 'Assignments & Work', icon: BookMarked },
    { id: 'notices', label: 'Notice Board', icon: Bell },
    { id: 'faculty', label: 'Faculty Directory', icon: Users },
  ];

  // Main menu items for Admin/HOD/Faculty
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(adminOrDean || hod ? [{ 
      id: 'students', 
      label: adminOrDean ? 'Students' : 'Department Students', 
      icon: GraduationCap 
    }] : [
      { id: 'students', label: 'Student Directory', icon: GraduationCap }
    ]),
    { 
      id: 'faculty', 
      label: adminOrDean ? 'Faculty & HODs' : hod ? 'Department Faculty' : 'Faculty Directory', 
      icon: Users 
    },
    { 
      id: 'departments', 
      label: adminOrDean ? 'Departments' : 'My Department', 
      icon: Building2 
    },
  ];

  // DMS Academic Modules
  const academicModules = [
    { id: 'subjects', label: 'Courses & Subjects', icon: BookOpen },
    { id: 'attendance', label: 'Attendance Register', icon: CalendarCheck },
    { id: 'timetables', label: 'Class Timetables', icon: CalendarDays },
    { id: 'exams', label: 'Examinations & Grades', icon: Award },
    { id: 'assignments', label: 'Coursework & Marks', icon: BookMarked },
    { id: 'notices', label: 'Notice Board', icon: Bell },
  ];

  // Academic structure navigation items (Admin / Dean / HOD only)
  const academicStructure = [
    ...(adminOrDean ? [{ id: 'schools', label: 'Schools & Institutes', icon: School }] : []),
    ...(adminOrDean || hod ? [{ 
      id: 'programs', 
      label: adminOrDean ? 'Academic Programs' : 'Degree Programs', 
      icon: GraduationCap 
    }] : []),
  ];

  return (
    <aside style={{
      width: '290px',
      background: '#0B1120',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
      userSelect: 'none'
    }}>
      {/* Sidebar Header */}
      <div style={{
        height: '88px',
        minHeight: '88px',
        maxHeight: '88px',
        flexShrink: 0,
        boxSizing: 'border-box',
        padding: '0 1.75rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: student ? '#38BDF8' : '#64748B',
          marginBottom: '0.25rem'
        }}>
          {student ? 'STUDENT PORTAL' : adminOrDean ? 'ACADEMIC PORTAL' : hod ? 'HOD PORTAL' : 'FACULTY PORTAL'}
        </div>
        <div style={{
          fontSize: '1rem',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.01em'
        }}>
          LJ University DMS
        </div>
      </div>

      {/* Navigation Sections */}
      <div style={{
        flex: 1,
        padding: '1.25rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        overflowY: 'auto'
      }}>
        {student ? (
          /* Student Portal Nav */
          <div>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#475569',
              padding: '0 0.85rem 0.5rem 0.85rem'
            }}>
              Academic Portal
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {studentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.65rem 0.95rem',
                      borderRadius: '10px',
                      background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.1) 100%)' : 'transparent',
                      border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                      color: isActive ? '#60A5FA' : '#94A3B8',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94A3B8';
                      }
                    }}
                  >
                    <Icon size={18} color={isActive ? '#3B82F6' : '#64748B'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Admin / Faculty Nav */
          <>
            {/* Section 1: Core Records */}
            <div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#475569',
                padding: '0 0.85rem 0.5rem 0.85rem'
              }}>
                Core Administration
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.65rem 0.95rem',
                        borderRadius: '10px',
                        background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.1) 100%)' : 'transparent',
                        border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                        color: isActive ? '#60A5FA' : '#94A3B8',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.color = '#FFFFFF';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#94A3B8';
                        }
                      }}
                    >
                      <Icon size={18} color={isActive ? '#3B82F6' : '#64748B'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Academic Modules */}
            <div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#475569',
                padding: '0 0.85rem 0.5rem 0.85rem'
              }}>
                Academic Management
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {academicModules.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.65rem 0.95rem',
                        borderRadius: '10px',
                        background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.1) 100%)' : 'transparent',
                        border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                        color: isActive ? '#60A5FA' : '#94A3B8',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.color = '#FFFFFF';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#94A3B8';
                        }
                      }}
                    >
                      <Icon size={18} color={isActive ? '#3B82F6' : '#64748B'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Academic Structure */}
            {academicStructure.length > 0 && (
              <div>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#475569',
                  padding: '0 0.85rem 0.5rem 0.85rem'
                }}>
                  Institutes & Programs
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {academicStructure.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          padding: '0.65rem 0.95rem',
                          borderRadius: '10px',
                          background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.1) 100%)' : 'transparent',
                          border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                          color: isActive ? '#60A5FA' : '#94A3B8',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                            e.currentTarget.style.color = '#FFFFFF';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#94A3B8';
                          }
                        }}
                      >
                        <Icon size={18} color={isActive ? '#3B82F6' : '#64748B'} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Database Connection Status Card */}
      <div style={{
        padding: '0.85rem 1.1rem',
        margin: '0.75rem 1rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.2rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
          }} />
          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#F1F5F9' }}>
            PostgreSQL Live
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
          Database: <span style={{ color: '#94A3B8' }}>lj_department_db</span>
        </div>
      </div>
    </aside>
  );
}
