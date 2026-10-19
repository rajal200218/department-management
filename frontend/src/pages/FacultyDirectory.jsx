import React, { useState, useMemo } from 'react';
import { Users, Search, Plus, Trash2, Edit2, Mail, Phone, Award, Briefcase, GraduationCap, Download } from 'lucide-react';
import { isAdmin, isDean, isHOD, canAddFaculty, canEditFaculty, canDeleteFaculty } from '../services/permissions';
import { exportToExcel } from '../utils/excelExporter';

import MultiSelectDropdown from '../components/MultiSelectDropdown';
import Pagination from '../components/Pagination';

export default function FacultyDirectory({
  facultyList = [],
  departments = [],
  loading = false,
  onAddFaculty,
  onEditFaculty,
  onDeleteFaculty,
  user
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedDesignations, setSelectedDesignations] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const adminOrDean = isAdmin(user) || isDean(user);
  const showAddFaculty = canAddFaculty(user);

  const filteredFaculty = useMemo(() => {
    return facultyList.filter((f) => {
      const matchesSearch = 
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.designation?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = 
        selectedDepts.length === 0 || selectedDepts.includes(f.department_id);

      const matchesDesignation = 
        selectedDesignations.length === 0 || selectedDesignations.includes(f.designation);

      const matchesStatus = 
        selectedStatuses.length === 0 || selectedStatuses.includes(f.status);

      return matchesSearch && matchesDept && matchesDesignation && matchesStatus;
    });
  }, [facultyList, searchTerm, selectedDepts, selectedDesignations, selectedStatuses]);

  // Reset to page 1 on filter/search change
  const totalPages = Math.max(1, Math.ceil(filteredFaculty.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedFaculty = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredFaculty.slice(start, start + pageSize);
  }, [filteredFaculty, validCurrentPage, pageSize]);

  // Export to Excel (.xlsx) function
  const handleExportExcel = () => {
    const exportData = filteredFaculty.map(f => ({
      'ID': f.id,
      'Faculty Name': f.name,
      'Department Code': f.department_code || '',
      'Department Name': f.department_name || '',
      'Designation': f.designation || '',
      'Qualification': f.qualification || '',
      'Specialization': f.specialization || '',
      'Email': f.email || '',
      'Phone': f.phone || '',
      'Experience (Years)': f.experience_years || 0,
      'Joining Date': f.joining_date ? f.joining_date.toString().split('T')[0] : '',
      'Is HOD': f.is_current_hod ? 'Yes' : 'No',
      'Status': f.status || 'Active'
    }));
    exportToExcel(exportData, 'LJU_Faculty_Roster', 'Faculty Roster');
  };

  const departmentOptions = departments.map(d => ({
    value: d.id,
    label: d.department_name,
    badge: d.department_code
  }));

  const designationOptions = [
    { value: 'HOD & Professor', label: 'HOD & Professor', badge: 'HOD' },
    { value: 'HOD & Associate Professor', label: 'HOD & Associate Professor', badge: 'HOD' },
    { value: 'Professor', label: 'Professor', badge: 'PROF' },
    { value: 'Associate Professor', label: 'Associate Professor', badge: 'ASSOC' },
    { value: 'Assistant Professor', label: 'Assistant Professor', badge: 'ASST' }
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active', badge: 'ACTIVE' },
    { value: 'Inactive', label: 'Inactive / On Leave', badge: 'INACTIVE' }
  ];

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem' }}>
              {adminOrDean ? 'Faculty & HOD Directory' : 'Department Faculty'}
            </h1>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34D399'
            }}>
              {filteredFaculty.length} Faculty Members
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {adminOrDean
              ? 'Browse professors, assistant professors, and assigned Heads of Departments across all disciplines'
              : `Faculty members and colleagues in ${user?.department_name || 'your department'}`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary" title="Export faculty list to Excel (.xlsx)">
            <Download size={15} />
            <span>Export Excel</span>
          </button>

          {showAddFaculty && (
            <button onClick={() => onAddFaculty(user?.department_id)} className="btn btn-primary">
              <Plus size={16} />
              <span>Add Faculty</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card filter-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', position: 'relative', zIndex: 30, overflow: 'visible' }}>
        <div style={{ display: 'grid', gridTemplateColumns: adminOrDean ? '1.8fr 1.3fr 1.2fr 1fr' : '2fr 1.3fr 1fr', gap: '0.85rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search faculty by name, specialization, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {adminOrDean && (
            <div>
              <MultiSelectDropdown
                options={departmentOptions}
                selectedValues={selectedDepts}
                onChange={setSelectedDepts}
                placeholder="All Departments"
                label="Departments"
              />
            </div>
          )}

          <div>
            <MultiSelectDropdown
              options={designationOptions}
              selectedValues={selectedDesignations}
              onChange={setSelectedDesignations}
              placeholder="All Designations"
              label="Designation"
              alignRight={!adminOrDean}
            />
          </div>

          <div>
            <MultiSelectDropdown
              options={statusOptions}
              selectedValues={selectedStatuses}
              onChange={setSelectedStatuses}
              placeholder="All Status"
              label="Status"
              searchable={false}
              alignRight={true}
            />
          </div>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="glass-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Faculty Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Qualification</th>
                <th>Specialization</th>
                <th>Email & Phone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFaculty.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    {loading ? 'Loading faculty directory...' : 'No faculty members found.'}
                  </td>
                </tr>
              ) : (
                paginatedFaculty.map((f) => {
                  const canDeleteThis = canDeleteFaculty(user, f);

                  return (
                    <tr key={f.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: f.is_current_hod ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                            color: f.is_current_hod ? '#C4B5FD' : '#60A5FA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}>
                            {f.name.replace('Dr. ', '').replace('Prof. ', '').charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#FFF', fontSize: '0.9rem' }}>{f.name}</div>
                            {f.is_current_hod && (
                              <span style={{
                                fontSize: '0.65rem',
                                background: 'rgba(139, 92, 246, 0.25)',
                                color: '#A78BFA',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                fontWeight: 700
                              }}>
                                ⭐ HOD
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          fontSize: '0.8rem',
                          color: '#CBD5E1'
                        }}>
                          {f.department_code || 'Dept'}
                        </span>
                      </td>

                      <td><span style={{ color: '#93C5FD', fontSize: '0.85rem' }}>{f.designation}</span></td>
                      <td><span style={{ color: '#E2E8F0', fontSize: '0.825rem' }}>{f.qualification || 'N/A'}</span></td>
                      <td><span style={{ color: 'var(--text-dim)', fontSize: '0.825rem' }}>{f.specialization || 'General'}</span></td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>{f.email}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{f.phone}</div>
                      </td>
                      <td>
                        <span className={`badge ${f.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                          {f.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {canEditFaculty(user, f) && onEditFaculty && (
                            <button
                              onClick={() => onEditFaculty(f)}
                              className="btn-icon"
                              style={{ color: '#60A5FA' }}
                              title="Edit Faculty & Password"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}

                          {canDeleteThis ? (
                            <button
                              onClick={() => onDeleteFaculty(f)}
                              className="btn-icon"
                              style={{ color: '#F87171' }}
                              title="Delete Faculty Member"
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            !canEditFaculty(user, f) && <span style={{ fontSize: '0.75rem', color: '#64748B' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={validCurrentPage}
          totalPages={totalPages}
          totalItems={filteredFaculty.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
