import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Filter, 
  GraduationCap, 
  AlertTriangle,
  CheckCircle,
  Building2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { exportToExcel } from '../utils/excelExporter';
import { canManageStudents } from '../services/permissions';

export default function Students({
  user,
  departments = [],
  programs = [],
  refreshTrigger = 0,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onOpenProfileModal
}) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [onlyLowAttendance, setOnlyLowAttendance] = useState(false);

  const canManage = canManageStudents(user);

  useEffect(() => {
    loadStudents();
  }, [selectedDept, selectedSem, selectedStatus, refreshTrigger]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDept) params.department_id = selectedDept;
      if (selectedSem) params.semester = selectedSem;
      if (selectedStatus !== 'All') params.status = selectedStatus;
      
      const res = await api.getStudents(params);
      if (res.success) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter students by search term and low attendance flag
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = !searchTerm || (
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.enrollment_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.department_name && s.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return matchesSearch;
    });
  }, [students, searchTerm]);

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredStudents.map(s => ({
      'Enrollment No': s.enrollment_no,
      'Full Name': s.name,
      'Institutional Email': s.email,
      'Phone': s.phone || 'N/A',
      'Gender': s.gender || 'N/A',
      'Department': s.department_name || 'N/A',
      'Degree Program': s.program_name || 'N/A',
      'Semester': `Semester ${s.current_semester}`,
      'Admission Year': s.admission_year,
      'Status': s.status
    }));
    exportToExcel(exportData, 'LJU_Student_Roster', 'Students');
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
              Student Management
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60A5FA',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              {filteredStudents.length} Students
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Centralized enrollment, academic profiles, semester tracking, and performance records for LJ University
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary" title="Export roster to Excel (.xlsx)">
            <Download size={16} /> Export Excel
          </button>

          {canManage && (
            <button onClick={onOpenAddModal} className="btn btn-primary">
              <Plus size={16} /> Register Student
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
            placeholder="Search student by name, enrollment no, or email..."
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

        {/* Status Filter */}
        <div style={{ width: '130px' }}>
          <select
            className="form-control"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Graduated">Graduated</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div style={{
        background: '#131E35',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
            Loading student records from PostgreSQL...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center' }}>
            <div style={{ color: '#64748B', marginBottom: '0.5rem' }}><Users size={36} /></div>
            <h3 style={{ fontSize: '1.1rem', color: '#F1F5F9', marginBottom: '0.25rem' }}>No Students Found</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Try clearing filters or search query.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Enrollment No</th>
                  <th>Department & Program</th>
                  <th>Semester</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    {/* Student Info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={s.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={s.name}
                          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div 
                            style={{ fontWeight: 700, color: '#F1F5F9', cursor: 'pointer' }}
                            onClick={() => onOpenProfileModal(s)}
                            title="Click to view academic profile"
                          >
                            {s.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            {s.gender} • Admitted {s.admission_year}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Enrollment No */}
                    <td>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#60A5FA',
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px'
                      }}>
                        {s.enrollment_no}
                      </span>
                    </td>

                    {/* Department & Program */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#F1F5F9' }}>
                        {s.department_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {s.program_name || s.department_code}
                      </div>
                    </td>

                    {/* Semester */}
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#CBD5E1'
                      }}>
                        <GraduationCap size={15} color="#3B82F6" /> Sem {s.current_semester}
                      </span>
                    </td>

                    {/* Contact */}
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#F1F5F9' }}>{s.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.phone || '—'}</div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`status-badge status-${(s.status || 'Active').toLowerCase()}`}>
                        {s.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem' }}>
                        <button
                          onClick={() => onOpenProfileModal(s)}
                          className="btn-icon"
                          title="View Student Profile & Performance"
                          style={{ color: '#60A5FA' }}
                        >
                          <Eye size={16} />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => onOpenEditModal(s)}
                              className="btn-icon"
                              title="Edit Student Details"
                              style={{ color: '#94A3B8' }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => onOpenDeleteModal(s)}
                              className="btn-icon"
                              title="Delete Student Record"
                              style={{ color: '#F87171' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
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
