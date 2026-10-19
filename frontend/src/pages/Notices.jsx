import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  Calendar, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Flame
} from 'lucide-react';
import { api } from '../services/api';
import { isAdmin, isHOD, isFaculty } from '../services/permissions';
import NoticeModal from '../components/NoticeModal';

const CATEGORIES = ['All', 'Academic', 'Examination', 'Holiday', 'Event', 'Placement', 'General'];

export default function Notices({ user, departments = [] }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  const canManage = isAdmin(user) || isHOD(user) || isFaculty(user);

  useEffect(() => {
    fetchNotices();
  }, [activeCategory, selectedDept, priorityFilter]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (selectedDept) params.department_id = selectedDept;
      if (priorityFilter) params.priority = priorityFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getNotices(params);
      if (res.success) {
        setNotices(res.data);
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
      showAlert('Failed to load notices & circulars.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlertMsg({ message, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingNotice(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (notice) => {
    setEditingNotice(notice);
    setIsModalOpen(true);
  };

  const handleSaveNotice = async (noticeData) => {
    if (editingNotice) {
      const res = await api.updateNotice(editingNotice.id, noticeData);
      if (res.success) {
        showAlert('Notice updated successfully.');
        fetchNotices();
      } else {
        throw new Error(res.message || 'Failed to update notice.');
      }
    } else {
      const res = await api.createNotice(noticeData);
      if (res.success) {
        showAlert('Announcement published successfully.');
        fetchNotices();
      } else {
        throw new Error(res.message || 'Failed to publish notice.');
      }
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await api.deleteNotice(id);
      if (res.success) {
        showAlert('Notice removed successfully.');
        setNotices(prev => prev.filter(n => n.id !== id));
      } else {
        showAlert(res.message || 'Failed to delete notice.', 'error');
      }
    } catch (err) {
      showAlert(err.message || 'Error deleting notice.', 'error');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Flame size={12} />
            <span>Urgent Notice</span>
          </span>
        );
      case 'High':
        return (
          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertTriangle size={12} />
            <span>High Priority</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-inactive">
            Normal
          </span>
        );
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Examination': return 'badge badge-purple';
      case 'Academic': return 'badge badge-primary';
      case 'Holiday': return 'badge badge-active';
      case 'Event': return 'badge badge-teal';
      case 'Placement': return 'badge badge-active';
      default: return 'badge badge-inactive';
    }
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
              Notice Board & Circulars
            </h1>
            <span className="badge badge-amber">
              Official University Circulars
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Official LJ University academic notices, examinations updates, and departmental announcements
          </p>
        </div>

        {canManage && (
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Category Pills Strip */}
      <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: isActive ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isActive ? '#F59E0B' : 'rgba(15, 23, 42, 0.6)',
                color: isActive ? '#0B1120' : '#94A3B8',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat === 'All' ? 'All Announcements' : cat}
            </button>
          );
        })}
      </div>

      {/* Search & Extra Filters Toolbar */}
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
            <span className="form-label" style={{ margin: 0 }}>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              <option value="">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchNotices();
          }}
          className="search-input-wrap"
        >
          <Search size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circulars..."
          />
        </form>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
          Fetching announcements...
        </div>
      ) : notices.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          background: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          color: '#64748B'
        }}>
          <Bell size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94A3B8' }}>
            No circulars found matching your filter
          </div>
        </div>
      ) : (
        <div className="grid-2-col">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="entity-card"
              style={{
                borderLeft: notice.priority === 'Urgent' 
                  ? '3px solid #EF4444' 
                  : notice.priority === 'High' 
                  ? '3px solid #F59E0B' 
                  : '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span className={getCategoryBadgeClass(notice.category)}>
                      {notice.category}
                    </span>
                    <span className="badge badge-inactive" style={{ fontSize: '0.65rem' }}>
                      {notice.target_role === 'All' ? 'For All' : `Target: ${notice.target_role}`}
                    </span>
                  </div>
                  <div>{getPriorityBadge(notice.priority)}</div>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                  {notice.title}
                </h3>

                <p style={{ fontSize: '0.825rem', color: '#CBD5E1', lineHeight: 1.5, whiteSpace: 'pre-line', marginBottom: '1rem' }}>
                  {notice.content}
                </p>
              </div>

              <div style={{
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#94A3B8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} color="#64748B" />
                    <span>{new Date(notice.publish_date || notice.created_at).toLocaleDateString()}</span>
                  </div>
                  {notice.department_name && (
                    <span style={{ color: '#FCD34D', fontWeight: 600 }}>{notice.department_name}</span>
                  )}
                </div>

                {canManage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      onClick={() => handleOpenEdit(notice)}
                      className="btn-icon"
                      title="Edit Notice"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(notice.id)}
                      className="btn-icon"
                      style={{ color: '#F87171' }}
                      title="Delete Notice"
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

      {/* Notice Modal */}
      <NoticeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNotice}
        notice={editingNotice}
        departments={departments}
      />
    </div>
  );
}
