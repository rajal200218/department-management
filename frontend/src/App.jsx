import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SqlInspector from './components/SqlInspector';
import DepartmentModal from './components/DepartmentModal';
import FacultyModal from './components/FacultyModal';
import SchoolModal from './components/SchoolModal';
import ProgramModal from './components/ProgramModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import AcademicSessionModal from './components/AcademicSessionModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import StudentModal from './components/StudentModal';
import StudentProfileModal from './components/StudentProfileModal';
import SubjectModal from './components/SubjectModal';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import DepartmentProfile from './pages/DepartmentProfile';
import FacultyDirectory from './pages/FacultyDirectory';
import Schools from './pages/Schools';
import Programs from './pages/Programs';
import Students from './pages/Students';
import Subjects from './pages/Subjects';
import Attendance from './pages/Attendance';
import Timetable from './pages/Timetable';
import Notices from './pages/Notices';
import Examinations from './pages/Examinations';
import Assignments from './pages/Assignments';

import { api } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Auth State - Never default to admin; must be explicitly verified
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App Navigation
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'departments', 'department_profile', 'faculty', 'schools', 'programs'
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);

  // Core Data
  const [departments, setDepartments] = useState([]);
  const [schools, setSchools] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dbMode, setDbMode] = useState('POSTGRES');

  // UI Modals & Drawers
  const [isSqlDrawerOpen, setIsSqlDrawerOpen] = useState(false);
  
  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  // Faculty Modal State
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [facultyDefaultDeptId, setFacultyDefaultDeptId] = useState(null);
  const [editingFaculty, setEditingFaculty] = useState(null);

  // Change Password Modal State
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // School Modal State
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);

  // Program Modal State
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  // Student Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);

  // Subject Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  // Synchronization triggers for sub-views
  const [studentsVersion, setStudentsVersion] = useState(0);
  const [subjectsVersion, setSubjectsVersion] = useState(0);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: 'department', // 'department', 'faculty', 'school', 'program', 'student', 'subject'
    item: null,
    isDeleting: false
  });

  // Academic Sessions State
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('lju_academic_sessions');
    return saved ? JSON.parse(saved) : [
      { id: 's1', name: '2026–2027', status: 'Active', term: 'Fall & Spring (Full Year)', startDate: '2026-07-01', endDate: '2027-06-30' },
      { id: 's2', name: '2025–2026', status: 'Archived', term: 'Academic Year (Completed)', startDate: '2025-07-01', endDate: '2026-06-30' },
      { id: 's3', name: '2024–2025', status: 'Archived', term: 'Academic Year (Completed)', startDate: '2024-07-01', endDate: '2025-06-30' },
      { id: 's4', name: '2027–2028', status: 'Upcoming', term: 'Academic Planning', startDate: '2027-07-01', endDate: '2028-06-30' }
    ];
  });
  const [activeSession, setActiveSession] = useState(() => {
    return localStorage.getItem('lju_active_session') || '2026–2027';
  });
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // 1. Session Verification on Load / Refresh
  useEffect(() => {
    const verifyUserSession = async () => {
      const token = localStorage.getItem('lju_token');
      const savedUser = localStorage.getItem('lju_user');

      if (!token || !savedUser) {
        setIsAuthenticated(false);
        setUser(null);
        setIsAuthChecking(false);
        return;
      }

      try {
        const res = await api.verifySession();
        if (res?.success && res.user) {
          setUser(res.user);
          setIsAuthenticated(true);
          localStorage.setItem('lju_user', JSON.stringify(res.user));
        } else {
          throw new Error('Invalid session response');
        }
      } catch (err) {
        console.warn('Session verification failed on refresh:', err.message);
        localStorage.removeItem('lju_token');
        localStorage.removeItem('lju_user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecking(false);
      }
    };

    verifyUserSession();

    // Listen for auth expiration events triggered from api service
    const handleAuthExpired = (e) => {
      setUser(null);
      setIsAuthenticated(false);
      showToast(e.detail || 'Session expired. Please sign in again.', 'error');
    };

    window.addEventListener('lju_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('lju_auth_expired', handleAuthExpired);
    };
  }, []);

  // Fetch all core data (session-aware from PostgreSQL)
  const fetchData = async (sessionToFetch = activeSession) => {
    setLoading(true);
    try {
      const [deptRes, schoolRes, facultyRes, progRes, statsRes, sessionListRes] = await Promise.all([
        api.getDepartments({ session: sessionToFetch }),
        api.getSchools(),
        api.getFaculty(null, sessionToFetch),
        api.getPrograms(null, sessionToFetch),
        api.getDashboardStats(sessionToFetch),
        api.getSessions().catch(() => null)
      ]);

      if (deptRes?.success) setDepartments(deptRes.data);
      if (schoolRes?.success) setSchools(schoolRes.data);
      if (facultyRes?.success) setFacultyList(facultyRes.data);
      if (progRes?.success) setProgramsList(progRes.data);
      if (sessionListRes?.success && sessionListRes.data?.length > 0) {
        setSessions(sessionListRes.data.map(s => ({
          id: s.id,
          name: s.session_name,
          term: s.term,
          startDate: s.start_date,
          endDate: s.end_date,
          status: s.status,
          isCurrent: s.is_current
        })));
      }
      if (statsRes?.success) {
        setDashboardStats(statsRes.data);
        if (statsRes.data.dbMode) setDbMode(statsRes.data.dbMode);
      }
    } catch (err) {
      console.error('Error fetching application data:', err);
      if (err.message && !err.message.includes('401')) {
        showToast('Unable to connect to backend server. Make sure backend is running on port 5000.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      fetchData(activeSession);
    }
  }, [isAuthenticated, user?.email, activeSession]);

  // Auth Handlers
  const handleLoginSuccess = (userData, token) => {
    localStorage.setItem('lju_user', JSON.stringify(userData));
    localStorage.setItem('lju_token', token);
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
    showToast(`Welcome back, ${userData.name}!`);
    setTimeout(() => {
      fetchData();
    }, 50);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('lju_user');
    localStorage.removeItem('lju_token');
    showToast('Logged out successfully');
  };

  // Navigation Handlers
  const handleNavigate = (view, deptId = null) => {
    setCurrentView(view);
    if (deptId) {
      setSelectedDepartmentId(deptId);
      setCurrentView('department_profile');
    }
  };

  const handleViewProfile = (deptId) => {
    setSelectedDepartmentId(deptId);
    setCurrentView('department_profile');
  };

  // Department Handlers
  const handleOpenAddDepartment = () => {
    setEditingDepartment(null);
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDepartment = (dept) => {
    setEditingDepartment(dept);
    setIsDeptModalOpen(true);
  };

  const handleSaveDepartment = async (formData) => {
    if (editingDepartment) {
      const res = await api.updateDepartment(editingDepartment.id, formData);
      if (res.success) {
        showToast(`Department '${formData.department_name}' updated successfully in database.`);
        fetchData();
      }
    } else {
      const res = await api.createDepartment(formData);
      if (res.success) {
        showToast(`Department '${formData.department_name}' (${formData.department_code}) created successfully.`);
        fetchData();
      }
    }
  };

  const handleTriggerDeleteDepartment = (dept) => {
    setDeleteModal({
      isOpen: true,
      type: 'department',
      item: dept,
      isDeleting: false
    });
  };

  // Faculty Handlers
  const handleOpenAddFaculty = (departmentId = null) => {
    setEditingFaculty(null);
    setFacultyDefaultDeptId(departmentId);
    setIsFacultyModalOpen(true);
  };

  const handleOpenEditFaculty = (faculty) => {
    setEditingFaculty(faculty);
    setFacultyDefaultDeptId(faculty.department_id);
    setIsFacultyModalOpen(true);
  };

  const handleSaveFaculty = async (formData) => {
    if (editingFaculty) {
      const res = await api.updateFaculty(editingFaculty.id, formData);
      if (res.success) {
        showToast(`Faculty member '${formData.name}' updated successfully.`);
        fetchData();
      }
    } else {
      const res = await api.createFaculty(formData);
      if (res.success) {
        showToast(`Faculty member '${formData.name}' added with login credentials.`);
        fetchData();
      }
    }
  };

  const handleTriggerDeleteFaculty = (faculty) => {
    setDeleteModal({
      isOpen: true,
      type: 'faculty',
      item: faculty,
      isDeleting: false
    });
  };

  // School Handlers
  const handleOpenAddSchool = () => {
    setEditingSchool(null);
    setIsSchoolModalOpen(true);
  };

  const handleOpenEditSchool = (school) => {
    setEditingSchool(school);
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchool = async (formData) => {
    if (editingSchool) {
      const res = await api.updateSchool(editingSchool.id, formData);
      if (res.success) {
        showToast(`School '${formData.school_name}' updated successfully.`);
        fetchData();
      }
    } else {
      const res = await api.createSchool(formData);
      if (res.success) {
        showToast(`School '${formData.school_name}' (${formData.school_code}) created.`);
        fetchData();
      }
    }
  };

  const handleTriggerDeleteSchool = (school) => {
    setDeleteModal({
      isOpen: true,
      type: 'school',
      item: school,
      isDeleting: false
    });
  };

  // Program Handlers
  const handleOpenAddProgram = () => {
    setEditingProgram(null);
    setIsProgramModalOpen(true);
  };

  const handleOpenEditProgram = (program) => {
    setEditingProgram(program);
    setIsProgramModalOpen(true);
  };

  const handleSaveProgram = async (formData) => {
    if (editingProgram) {
      const res = await api.updateProgram(editingProgram.id, formData);
      if (res.success) {
        showToast(`Program '${formData.program_name}' updated successfully.`);
        fetchData();
      }
    } else {
      const res = await api.createProgram(formData);
      if (res.success) {
        showToast(`Program '${formData.program_name}' created.`);
        fetchData();
      }
    }
  };

  const handleTriggerDeleteProgram = (program) => {
    setDeleteModal({
      isOpen: true,
      type: 'program',
      item: program,
      isDeleting: false
    });
  };

  // Student Handlers
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student) => {
    setEditingStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleOpenStudentProfile = (student) => {
    setSelectedStudentForProfile(student);
    setIsStudentProfileOpen(true);
  };

  const handleSaveStudent = async (formData) => {
    try {
      if (editingStudent) {
        const res = await api.updateStudent(editingStudent.id, formData);
        if (res.success) {
          showToast(`Student '${formData.name}' updated successfully.`);
          setStudentsVersion(v => v + 1);
          fetchData();
        }
      } else {
        const res = await api.createStudent(formData);
        if (res.success) {
          showToast(`Student '${formData.name}' enrolled successfully.`);
          setStudentsVersion(v => v + 1);
          fetchData();
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to save student', 'error');
      throw err;
    }
  };

  const handleTriggerDeleteStudent = (student) => {
    setDeleteModal({
      isOpen: true,
      type: 'student',
      item: student,
      isDeleting: false
    });
  };

  // Subject Handlers
  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (subj) => {
    setEditingSubject(subj);
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (formData) => {
    try {
      if (editingSubject) {
        const res = await api.updateSubject(editingSubject.id, formData);
        if (res.success) {
          showToast(`Course '${formData.subject_name}' updated.`);
          setSubjectsVersion(v => v + 1);
          fetchData();
        }
      } else {
        const res = await api.createSubject(formData);
        if (res.success) {
          showToast(`Course '${formData.subject_name}' created.`);
          setSubjectsVersion(v => v + 1);
          fetchData();
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to save subject', 'error');
      throw err;
    }
  };

  const handleTriggerDeleteSubject = (subj) => {
    setDeleteModal({
      isOpen: true,
      type: 'subject',
      item: subj,
      isDeleting: false
    });
  };

  // Academic Session Handlers
  const handleSelectSession = (sessionName) => {
    setActiveSession(sessionName);
    localStorage.setItem('lju_active_session', sessionName);
    showToast(`Active academic context switched to: Session ${sessionName}`);
    fetchData(sessionName);
  };

  const handleAddSession = async (newSession) => {
    try {
      const res = await api.createSession({
        session_name: newSession.name,
        term: newSession.term,
        start_date: newSession.startDate,
        end_date: newSession.endDate,
        status: newSession.status,
        is_current: newSession.status === 'Active'
      });
      if (res.success) {
        showToast(`Academic Session '${newSession.name}' created in PostgreSQL.`);
        fetchData(activeSession);
      }
    } catch (e) {
      const updated = [...sessions, newSession];
      setSessions(updated);
      localStorage.setItem('lju_academic_sessions', JSON.stringify(updated));
      showToast(`Academic Session '${newSession.name}' added.`);
    }
  };

  // Sync DB Handler: Explicit re-fetch from PostgreSQL with user toast notification
  const handleSyncDb = async () => {
    try {
      await fetchData(activeSession);
      showToast('Database synchronized successfully with PostgreSQL.');
    } catch (err) {
      showToast('Failed to sync with PostgreSQL database: ' + (err.message || ''), 'error');
    }
  };

  // Unified Delete Confirmation Handler
  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      if (deleteModal.type === 'department') {
        const res = await api.deleteDepartment(deleteModal.item.id);
        if (res.success) {
          showToast(`Department '${deleteModal.item.department_name}' deleted from database.`);
          if (currentView === 'department_profile' && selectedDepartmentId === deleteModal.item.id) {
            setCurrentView('departments');
          }
          fetchData();
        }
      } else if (deleteModal.type === 'faculty') {
        const res = await api.deleteFaculty(deleteModal.item.id);
        if (res.success) {
          showToast(`Faculty member '${deleteModal.item.name}' removed from roster.`);
          fetchData();
        }
      } else if (deleteModal.type === 'school') {
        const res = await api.deleteSchool(deleteModal.item.id);
        if (res.success) {
          showToast(`School '${deleteModal.item.school_name}' deleted.`);
          fetchData();
        }
      } else if (deleteModal.type === 'program') {
        const res = await api.deleteProgram(deleteModal.item.id);
        if (res.success) {
          showToast(`Program '${deleteModal.item.program_name}' deleted.`);
          fetchData();
        }
      } else if (deleteModal.type === 'student') {
        const res = await api.deleteStudent(deleteModal.item.id);
        if (res.success) {
          showToast(`Student record '${deleteModal.item.name}' deleted.`);
          setStudentsVersion(v => v + 1);
          fetchData();
        }
      } else if (deleteModal.type === 'subject') {
        const res = await api.deleteSubject(deleteModal.item.id);
        if (res.success) {
          showToast(`Subject '${deleteModal.item.subject_name}' deleted.`);
          setSubjectsVersion(v => v + 1);
          fetchData();
        }
      }
      setDeleteModal({ isOpen: false, type: 'department', item: null, isDeleting: false });
    } catch (err) {
      showToast(err.message || 'Delete operation failed', 'error');
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  if (isAuthChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B1120',
        color: '#94A3B8',
        gap: '1rem'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: '#3B82F6',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.02em' }}>
          Verifying session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-layout">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            {t.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} user={user} />

      {/* Main App Canvas */}
      <div className="main-content">
        <Navbar
          user={user}
          onLogout={handleLogout}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          onToggleSqlDrawer={() => setIsSqlDrawerOpen(!isSqlDrawerOpen)}
          isSqlDrawerOpen={isSqlDrawerOpen}
          dbMode={dbMode}
          activeSession={activeSession}
          onSelectSession={handleSelectSession}
          sessions={sessions}
          onOpenAddSession={() => setIsSessionModalOpen(true)}
        />

        {/* Session Notice Banner for Archived / Upcoming Sessions */}
        {(() => {
          const currentObj = sessions.find(s => s.name === activeSession);
          if (currentObj && currentObj.status !== 'Active') {
            return (
              <div style={{
                background: currentObj.status === 'Archived' ? 'rgba(51, 65, 85, 0.4)' : 'rgba(14, 116, 144, 0.3)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '0.65rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8125rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: currentObj.status === 'Archived' ? '#CBD5E1' : '#38BDF8' }}>
                  <span style={{ fontWeight: 700 }}>
                    {currentObj.status === 'Archived' ? '📁 HISTORICAL SESSION ARCHIVE:' : '🚀 UPCOMING SESSION PLANNING:'}
                  </span>
                  <span>
                    Viewing records for Session <strong>{activeSession}</strong> ({currentObj.term || 'Academic Term'}).
                  </span>
                </div>
                <button
                  onClick={() => handleSelectSession('2026–2027')}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#93C5FD',
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    cursor: 'pointer'
                  }}
                >
                  Return to Active Session (2026–2027)
                </button>
              </div>
            );
          }
          return null;
        })()}

        {/* Dynamic Screen Rendering */}
        {currentView === 'dashboard' && (
          <Dashboard
            stats={dashboardStats}
            onNavigate={handleNavigate}
            onOpenAddDepartment={handleOpenAddDepartment}
            user={user}
            activeSession={activeSession}
          />
        )}

        {currentView === 'departments' && (
          <Departments
            departments={departments}
            schools={schools}
            loading={loading}
            onRefresh={handleSyncDb}
            onViewProfile={handleViewProfile}
            onAddDepartment={handleOpenAddDepartment}
            onEditDepartment={handleOpenEditDepartment}
            onDeleteDepartment={handleTriggerDeleteDepartment}
            user={user}
            activeSession={activeSession}
          />
        )}

        {currentView === 'department_profile' && (
          <DepartmentProfile
            departmentId={selectedDepartmentId || user?.department_id}
            onBack={() => setCurrentView('departments')}
            onEdit={handleOpenEditDepartment}
            onAddFaculty={handleOpenAddFaculty}
            onEditFaculty={handleOpenEditFaculty}
            onDeleteFaculty={handleTriggerDeleteFaculty}
            user={user}
            activeSession={activeSession}
          />
        )}

        {currentView === 'faculty' && (
          <FacultyDirectory
            facultyList={facultyList}
            departments={departments}
            loading={loading}
            onAddFaculty={handleOpenAddFaculty}
            onEditFaculty={handleOpenEditFaculty}
            onDeleteFaculty={handleTriggerDeleteFaculty}
            user={user}
            activeSession={activeSession}
          />
        )}

        {currentView === 'schools' && (
          <Schools
            schools={schools}
            onSelectSchool={() => setCurrentView('departments')}
            onAddSchool={handleOpenAddSchool}
            onEditSchool={handleOpenEditSchool}
            onDeleteSchool={handleTriggerDeleteSchool}
            user={user}
            activeSession={activeSession}
          />
        )}

        {currentView === 'programs' && (
          <Programs
            programs={programsList}
            departments={departments}
            loading={loading}
            onAddProgram={handleOpenAddProgram}
            onEditProgram={handleOpenEditProgram}
            onDeleteProgram={handleTriggerDeleteProgram}
            user={user}
            activeSession={activeSession}
          />
        )}

        {currentView === 'students' && (
          <Students
            user={user}
            departments={departments}
            programs={programsList}
            refreshTrigger={studentsVersion}
            onOpenAddModal={handleOpenAddStudent}
            onOpenEditModal={handleOpenEditStudent}
            onOpenDeleteModal={handleTriggerDeleteStudent}
            onOpenProfileModal={handleOpenStudentProfile}
          />
        )}

        {currentView === 'subjects' && (
          <Subjects
            user={user}
            departments={departments}
            programs={programsList}
            faculty={facultyList}
            refreshTrigger={subjectsVersion}
            onOpenAddModal={handleOpenAddSubject}
            onOpenEditModal={handleOpenEditSubject}
            onOpenDeleteModal={handleTriggerDeleteSubject}
          />
        )}

        {currentView === 'attendance' && (
          <Attendance
            user={user}
            departments={departments}
          />
        )}

        {currentView === 'timetables' && (
          <Timetable
            user={user}
            departments={departments}
            facultyList={facultyList}
            programs={programsList}
          />
        )}

        {currentView === 'exams' && (
          <Examinations
            user={user}
            departments={departments}
          />
        )}

        {currentView === 'assignments' && (
          <Assignments
            user={user}
            departments={departments}
          />
        )}

        {currentView === 'notices' && (
          <Notices
            user={user}
            departments={departments}
          />
        )}
      </div>

      {/* Live SQL Inspection Drawer */}
      <SqlInspector
        isOpen={isSqlDrawerOpen}
        onClose={() => setIsSqlDrawerOpen(false)}
        dbMode={dbMode}
      />

      {/* Modals */}
      <DepartmentModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onSubmit={handleSaveDepartment}
        initialData={editingDepartment}
        schools={schools}
        facultyList={facultyList}
      />

      <FacultyModal
        isOpen={isFacultyModalOpen}
        onClose={() => setIsFacultyModalOpen(false)}
        onSubmit={handleSaveFaculty}
        initialData={editingFaculty}
        departments={departments}
        defaultDepartmentId={facultyDefaultDeptId}
      />

      <SchoolModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        onSubmit={handleSaveSchool}
        initialData={editingSchool}
      />

      <ProgramModal
        isOpen={isProgramModalOpen}
        onClose={() => setIsProgramModalOpen(false)}
        onSubmit={handleSaveProgram}
        initialData={editingProgram}
        departments={departments}
      />

      {/* Student Modals */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        student={editingStudent}
        departments={departments}
        programs={programsList}
      />

      <StudentProfileModal
        isOpen={isStudentProfileOpen}
        onClose={() => setIsStudentProfileOpen(false)}
        studentId={selectedStudentForProfile?.id}
      />

      {/* Subject Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSave={handleSaveSubject}
        subject={editingSubject}
        departments={departments}
        programs={programsList}
        faculty={facultyList}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: 'department', item: null, isDeleting: false })}
        onConfirm={handleConfirmDelete}
        title={
          deleteModal.type === 'department' ? 'Delete Department' :
          deleteModal.type === 'faculty' ? 'Delete Faculty Member' :
          deleteModal.type === 'school' ? 'Delete School' :
          deleteModal.type === 'program' ? 'Delete Academic Program' :
          deleteModal.type === 'student' ? 'Delete Student Record' : 'Delete Course / Subject'
        }
        message={
          deleteModal.type === 'department'
            ? 'Are you sure you want to permanently delete this department? Associated faculty mappings will be updated in the database.'
            : deleteModal.type === 'faculty'
            ? 'Are you sure you want to remove this faculty member from the academic roster?'
            : deleteModal.type === 'school'
            ? 'Are you sure you want to delete this school/institute?'
            : deleteModal.type === 'program'
            ? 'Are you sure you want to delete this degree program?'
            : deleteModal.type === 'student'
            ? 'Are you sure you want to permanently delete this student record? Associated attendance and marks will also be removed.'
            : 'Are you sure you want to delete this subject/course from the curriculum?'
        }
        itemName={
          deleteModal.item
            ? deleteModal.type === 'department'
              ? `${deleteModal.item.department_name} (${deleteModal.item.department_code})`
              : deleteModal.type === 'faculty'
              ? deleteModal.item.name
              : deleteModal.type === 'school'
              ? `${deleteModal.item.school_name} (${deleteModal.item.school_code})`
              : deleteModal.type === 'program'
              ? `${deleteModal.item.program_name} (${deleteModal.item.program_code})`
              : deleteModal.type === 'student'
              ? `${deleteModal.item.name} (${deleteModal.item.enrollment_no})`
              : `${deleteModal.item.subject_name} (${deleteModal.item.subject_code})`
            : ''
        }
        isDeleting={deleteModal.isDeleting}
      />

      {/* Academic Session Modal */}
      <AcademicSessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onAddSession={handleAddSession}
        existingSessions={sessions}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        user={user}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
}
