import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Download, 
  Edit, 
  Trash2, 
  UserCheck, 
  Layers, 
  GraduationCap,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { exportToExcel } from '../utils/excelExporter';
import { canManageSubjects } from '../services/permissions';

export default function Subjects({
  user,
  departments = [],
  programs = [],
  faculty = [],
  refreshTrigger = 0,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal
}) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const canManage = canManageSubjects(user);

  useEffect(() => {
    loadSubjects();
  }, [selectedDept, selectedSem, selectedType, refreshTrigger]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDept) params.department_id = selectedDept;
      if (selectedSem) params.semester = selectedSem;
      if (selectedType !== 'All') params.type = selectedType;

      const res = await api.getSubjects(params);
      if (res.success) {
        setSubjects(res.data);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      if (!searchTerm) return true;
      const lower = searchTerm.toLowerCase();
      return (
        s.subject_name.toLowerCase().includes(lower) ||
        s.subject_code.toLowerCase().includes(lower) ||
        (s.faculty_name && s.faculty_name.toLowerCase().includes(lower)) ||
        (s.department_name && s.department_name.toLowerCase().includes(lower))
      );
    });
  }, [subjects, searchTerm]);

  const handleExportExcel = () => {
    const exportData = filteredSubjects.map(s => ({
      'Subject Code': s.subject_code,
      'Subject Name': s.subject_name,
      'Department': s.department_name,
      'Semester': `Semester ${s.semester}`,
      'Credits': s.credits,
      'Course Type': s.type,
      'Assigned Faculty': s.faculty_name || 'Unassigned',
      'Faculty Designation': s.faculty_designation || 'N/A',
      'Status': s.status
    }));
    exportToExcel(exportData, 'LJU_Course_Subjects', 'Subjects');
  };

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
              Course & Subject Management
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#A855F7',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              {filteredSubjects.length} Subjects
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Curriculum catalog, course credits, theory/practical allocations, and assigned faculty for LJ University
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary" title="Export subjects to Excel (.xlsx)">
            <Download size={16} /> Export Excel
          </button>

          {canManage && (
            <button onClick={onOpenAddModal} className="btn btn-primary">
              <Plus size={16} /> Add Subject
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
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
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by subject name, code, or faculty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        {/* Department Filter */}
        <div style={{ width: '220px' }}>
          <select
            className="form-control"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.department_code} - {d.department_name}
              </option>
            ))}
          </select>
        </div>

        {/* Semester Filter */}
        <div style={{ width: '150px' }}>
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

        {/* Type Filter */}
        <div style={{ width: '140px' }}>
          <select
            className="form-control"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Theory">Theory</option>
            <option value="Practical">Practical / Lab</option>
            <option value="Elective">Elective</option>
          </select>
        </div>
      </div>

      {/* Subjects Table */}
      <div style={{
        background: '#131E35',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
            Loading subjects and curriculum records...
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center' }}>
            <div style={{ color: '#64748B', marginBottom: '0.5rem' }}><BookOpen size={36} /></div>
            <h3 style={{ fontSize: '1.1rem', color: '#F1F5F9', marginBottom: '0.25rem' }}>No Subjects Found</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Try selecting a different department or semester.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name & Description</th>
                  <th>Department & Semester</th>
                  <th>Credits & Type</th>
                  <th>Assigned Faculty</th>
                  <th>Status</th>
                  {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((s) => (
                  <tr key={s.id}>
                    {/* Code */}
                    <td>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#A855F7',
                        background: 'rgba(168, 85, 247, 0.1)',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem'
                      }}>
                        {s.subject_code}
                      </span>
                    </td>

                    {/* Name & Description */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#F1F5F9' }}>
                        {s.subject_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.description || 'Core academic syllabus course'}
                      </div>
                    </td>

                    {/* Department & Semester */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#F1F5F9' }}>
                        {s.department_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600 }}>
                        Semester {s.semester}
                      </div>
                    </td>

                    {/* Credits & Type */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#60A5FA'
                        }}>
                          {s.credits} Credits
                        </span>
                        <span style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: s.type === 'Practical' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                          color: s.type === 'Practical' ? '#34D399' : '#CBD5E1'
                        }}>
                          {s.type}
                        </span>
                      </div>
                    </td>

                    {/* Faculty */}
                    <td>
                      {s.faculty_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <UserCheck size={14} color="#10B981" />
                          <div>
                            <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '0.85rem' }}>{s.faculty_name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{s.faculty_designation}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-badge status-${(s.status || 'Active').toLowerCase()}`}>
                        {s.status}
                      </span>
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem' }}>
                          <button
                            onClick={() => onOpenEditModal(s)}
                            className="btn-icon"
                            title="Edit Subject"
                            style={{ color: '#94A3B8' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => onOpenDeleteModal(s)}
                            className="btn-icon"
                            title="Delete Subject"
                            style={{ color: '#F87171' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
