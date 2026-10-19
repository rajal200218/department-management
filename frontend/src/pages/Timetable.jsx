import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Clock, 
  Plus, 
  MapPin, 
  User, 
  BookOpen, 
  Search, 
  Grid3X3, 
  ListFilter,
  Trash2, 
  Edit3,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { isAdmin, isHOD, isStudent } from '../services/permissions';
import TimetableModal from '../components/TimetableModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STANDARD_SLOTS = [
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:15 - 12:15',
  '12:15 - 01:15',
  '02:00 - 03:00',
  '03:00 - 04:00',
  '04:00 - 05:00'
];

export default function Timetable({ user, departments = [], facultyList = [] }) {
  const [timetables, setTimetables] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('Monday');
  const [viewMode, setViewMode] = useState('grid'); // 'day' or 'grid'

  // Filters
  const [selectedDept, setSelectedDept] = useState(() => {
    if (user?.department_id) return String(user.department_id);
    return departments[0]?.id ? String(departments[0].id) : '';
  });
  const [selectedSemester, setSelectedSemester] = useState(user?.current_semester || 4);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  const canManage = isAdmin(user) || isHOD(user);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchTimetables();
  }, [selectedDept, selectedSemester]);

  const fetchSubjects = async () => {
    try {
      const res = await api.getSubjects();
      if (res.success) setSubjects(res.data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDept) params.department_id = selectedDept;
      if (selectedSemester) params.semester = selectedSemester;

      const res = await api.getTimetables(params);
      if (res.success) {
        setTimetables(res.data);
      }
    } catch (err) {
      console.error('Error fetching timetable slots:', err);
      showAlert('Failed to load timetable entries.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlertMsg({ message, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingTimetable(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingTimetable(item);
    setIsModalOpen(true);
  };

  const handleSaveSlot = async (slotData) => {
    if (editingTimetable) {
      const res = await api.updateTimetable(editingTimetable.id, slotData);
      if (res.success) {
        showAlert('Timetable slot updated successfully.');
        fetchTimetables();
      } else {
        throw new Error(res.message || 'Failed to update slot.');
      }
    } else {
      const res = await api.createTimetable(slotData);
      if (res.success) {
        showAlert('Lecture slot scheduled without conflict.');
        fetchTimetables();
      } else {
        throw new Error(res.message || 'Failed to schedule slot.');
      }
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lecture slot?')) return;
    try {
      const res = await api.deleteTimetable(id);
      if (res.success) {
        showAlert('Timetable slot removed successfully.');
        setTimetables(prev => prev.filter(t => t.id !== id));
      } else {
        showAlert(res.message || 'Failed to remove slot.', 'error');
      }
    } catch (err) {
      showAlert(err.message || 'Error removing slot.', 'error');
    }
  };

  // Filtered timetable slots by search query
  const filteredSlots = timetables.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.subject_name?.toLowerCase().includes(q) ||
      item.subject_code?.toLowerCase().includes(q) ||
      item.faculty_name?.toLowerCase().includes(q) ||
      item.classroom?.toLowerCase().includes(q)
    );
  });

  // Current day slots
  const daySlots = filteredSlots.filter(s => s.day_of_week === activeDay);

  const getSlotForGrid = (day, slotTime) => {
    return filteredSlots.find(s => s.day_of_week === day && s.time_slot === slotTime);
  };

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
              Academic Timetable & Schedule
            </h1>
            <span className="badge badge-primary">
              Conflict-Free
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Department class schedules, classroom allocations, and faculty lecture slots
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View toggle */}
          <div className="tab-strip">
            <button
              onClick={() => setViewMode('grid')}
              className={`tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <Grid3X3 size={14} />
              <span>Weekly Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`tab-btn ${viewMode === 'day' ? 'active' : ''}`}
            >
              <ListFilter size={14} />
              <span>Daily View</span>
            </button>
          </div>

          {canManage && (
            <button onClick={handleOpenAdd} className="btn btn-primary">
              <Plus size={16} />
              <span>Schedule Class</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-toolbar">
        <div className="filter-items-wrap">
          {!isStudent(user) && (
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
                  <option key={d.id} value={d.id}>{d.department_name} ({d.department_code})</option>
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
            placeholder="Search course, room, faculty..."
          />
        </div>
      </div>

      {/* Main Timetable Content */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
          Loading academic schedule...
        </div>
      ) : viewMode === 'day' ? (
        /* DAILY VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Day Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {DAYS.map((d) => {
              const count = filteredSlots.filter(s => s.day_of_week === d).length;
              const isActive = activeDay === d;

              return (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  style={{
                    padding: '0.55rem 1.15rem',
                    borderRadius: '10px',
                    border: isActive ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isActive ? '#3B82F6' : 'rgba(15, 23, 42, 0.6)',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{d}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    background: isActive ? '#1D4ED8' : 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF'
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {daySlots.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-subtle)',
              color: '#64748B'
            }}>
              <Calendar size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94A3B8' }}>
                No lectures scheduled for {activeDay}
              </div>
              {canManage && (
                <button
                  onClick={handleOpenAdd}
                  style={{
                    marginTop: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: '#60A5FA',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Schedule a class on {activeDay}
                </button>
              )}
            </div>
          ) : (
            <div className="grid-3-col">
              {daySlots.map((slot) => (
                <div key={slot.id} className="entity-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span className="badge badge-primary">
                        <Clock size={11} />
                        <span>{slot.time_slot}</span>
                      </span>
                      <span className="badge badge-active">
                        <MapPin size={11} />
                        <span>{slot.classroom}</span>
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.25rem' }}>
                      {slot.subject_name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>
                      {slot.subject_code} • {slot.course_type || 'Theory'}
                    </div>

                    <div style={{
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.8rem',
                      color: '#E2E8F0'
                    }}>
                      <User size={13} color="#60A5FA" />
                      <span>{slot.faculty_name || 'Instructor Unassigned'}</span>
                    </div>
                  </div>

                  {canManage && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.4rem',
                      marginTop: '1rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid var(--border-subtle)'
                    }}>
                      <button
                        onClick={() => handleOpenEdit(slot)}
                        className="btn-icon"
                        title="Edit slot"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="btn-icon"
                        style={{ color: '#F87171' }}
                        title="Delete slot"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* WEEKLY MASTER GRID MATRIX */
        <div className="section-box" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Time Slot</th>
                  {DAYS.map((d) => (
                    <th key={d} style={{ textAlign: 'center', minWidth: '150px' }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STANDARD_SLOTS.map((timeSlot) => (
                  <tr key={timeSlot}>
                    <td style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: '#60A5FA',
                      background: 'rgba(15, 23, 42, 0.4)'
                    }}>
                      {timeSlot}
                    </td>
                    {DAYS.map((day) => {
                      const slot = getSlotForGrid(day, timeSlot);

                      return (
                        <td key={day} style={{ padding: '0.5rem', verticalAlign: 'top' }}>
                          {slot ? (
                            <div style={{
                              background: 'rgba(19, 30, 53, 0.95)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              borderRadius: '8px',
                              padding: '0.65rem',
                              fontSize: '0.75rem',
                              position: 'relative'
                            }}>
                              <div style={{ fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {slot.subject_code}
                              </div>
                              <div style={{ color: '#CBD5E1', fontSize: '0.7rem', margin: '0.15rem 0 0.35rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {slot.subject_name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.675rem' }}>
                                <span style={{ color: '#34D399', fontWeight: 700 }}>{slot.classroom}</span>
                                <span style={{ color: '#94A3B8' }}>{slot.faculty_name?.split(' ')[0]}</span>
                              </div>

                              {canManage && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem', marginTop: '0.35rem' }}>
                                  <button
                                    onClick={() => handleOpenEdit(slot)}
                                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                                    title="Edit"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '2px' }}
                                    title="Delete"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{
                              height: '52px',
                              border: '1px dashed rgba(255, 255, 255, 0.05)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#475569',
                              fontSize: '0.75rem'
                            }}>
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timetable Modal */}
      <TimetableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSlot}
        timetable={editingTimetable}
        departments={departments}
        subjects={subjects}
        facultyList={facultyList}
      />
    </div>
  );
}
