import React, { useState, useMemo } from 'react';
import { GraduationCap, Search, Plus, Edit3, Trash2, Download } from 'lucide-react';
import { 
  isAdmin, 
  isDean, 
  isHOD, 
  canAddProgram, 
  canEditProgram, 
  canDeleteProgram 
} from '../services/permissions';
import { exportToExcel } from '../utils/excelExporter';

import MultiSelectDropdown from '../components/MultiSelectDropdown';
import Pagination from '../components/Pagination';

export default function Programs({
  programs = [],
  departments = [],
  loading = false,
  onAddProgram,
  onEditProgram,
  onDeleteProgram,
  user
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedDegreeLevels, setSelectedDegreeLevels] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const adminOrDean = isAdmin(user) || isDean(user);
  const showAddProgram = canAddProgram(user);

  const filtered = useMemo(() => {
    return programs.filter(p => {
      const matchesSearch = 
        p.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.program_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.degree_level?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDept = 
        selectedDepts.length === 0 || selectedDepts.includes(p.department_id);

      const matchesLevel = 
        selectedDegreeLevels.length === 0 || selectedDegreeLevels.includes(p.degree_level);

      const matchesStatus = 
        selectedStatuses.length === 0 || selectedStatuses.includes(p.status);

      return matchesSearch && matchesDept && matchesLevel && matchesStatus;
    });
  }, [programs, searchTerm, selectedDepts, selectedDegreeLevels, selectedStatuses]);

  // Reset to page 1 on filter/search change
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginated = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, validCurrentPage, pageSize]);

  // Export to Excel (.xlsx) function
  const handleExportExcel = () => {
    const exportData = filtered.map(p => ({
      'ID': p.id,
      'Program Code': p.program_code,
      'Program Title': p.program_name,
      'Department Name': p.department_name || '',
      'Degree Level': p.degree_level || '',
      'Intake Capacity (Seats)': p.intake_capacity || 0,
      'Duration (Years)': p.duration_years || 0,
      'Status': p.status || 'Active'
    }));
    exportToExcel(exportData, 'NUV_Academic_Programs', 'Academic Programs');
  };

  const departmentOptions = departments.map(d => ({
    value: d.id,
    label: d.department_name,
    badge: d.department_code
  }));

  const degreeLevelOptions = [
    { value: 'Undergraduate (B.Tech)', label: 'Undergraduate (B.Tech)', badge: 'B.TECH' },
    { value: 'Postgraduate (M.Tech)', label: 'Postgraduate (M.Tech)', badge: 'M.TECH' },
    { value: 'Postgraduate (MCA)', label: 'Postgraduate (MCA)', badge: 'MCA' },
    { value: 'Undergraduate (BCA)', label: 'Undergraduate (BCA)', badge: 'BCA' },
    { value: 'Postgraduate (MBA)', label: 'Postgraduate (MBA)', badge: 'MBA' },
    { value: 'Undergraduate (BBA)', label: 'Undergraduate (BBA)', badge: 'BBA' },
    { value: 'Undergraduate (B.Arch)', label: 'Undergraduate (B.Arch)', badge: 'B.ARCH' },
    { value: 'Doctorate (Ph.D)', label: 'Doctorate (Ph.D)', badge: 'PH.D' }
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active', badge: 'ACTIVE' },
    { value: 'Inactive', label: 'Inactive / Suspended', badge: 'INACTIVE' }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Academic Programs
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60A5FA'
            }}>
              {filtered.length} {filtered.length === 1 ? 'Program' : 'Programs'}
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            {adminOrDean
              ? 'Degree courses and intake capacity structured under respective departments'
              : `Degree courses offering under ${user?.department_name || 'your department'}`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary" title="Export programs list to Excel (.xlsx)">
            <Download size={15} />
            <span>Export Excel</span>
          </button>

          {showAddProgram && (
            <button onClick={() => onAddProgram(user?.department_id)} className="btn btn-primary">
              <Plus size={16} />
              <span>Add Program</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card filter-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', position: 'relative', zIndex: 30, overflow: 'visible' }}>
        <div style={{ display: 'grid', gridTemplateColumns: adminOrDean ? '1.8fr 1.3fr 1.3fr 1fr' : '2fr 1.4fr 1fr', gap: '0.85rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search programs by title, code, or degree level..."
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
              options={degreeLevelOptions}
              selectedValues={selectedDegreeLevels}
              onChange={setSelectedDegreeLevels}
              placeholder="All Degree Levels"
              label="Level"
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

      {/* Table */}
      <div className="glass-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '140px', minWidth: '130px', whiteSpace: 'nowrap' }}>Code</th>
                <th>Program Title</th>
                <th>Department</th>
                <th>Degree Level</th>
                <th style={{ textAlign: 'center' }}>Intake</th>
                <th>Duration</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem', color: '#64748B', fontSize: '0.875rem' }}>
                    {loading ? 'Loading academic programs...' : 'No degree programs found.'}
                  </td>
                </tr>
              ) : (
                paginated.map(p => {
                  const canEditThis = canEditProgram(user, p);
                  const canDeleteThis = canDeleteProgram(user, p);

                  return (
                    <tr key={p.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60A5FA',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                          display: 'inline-block'
                        }}>
                          {p.program_code}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.875rem' }}>{p.program_name}</td>
                      <td><span style={{ color: '#CBD5E1', fontSize: '0.8125rem' }}>{p.department_name}</span></td>
                      <td><span style={{ color: '#93C5FD', fontSize: '0.8125rem' }}>{p.degree_level}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ color: '#34D399', fontSize: '0.875rem' }}>{p.intake_capacity} seats</strong>
                      </td>
                      <td><span style={{ fontSize: '0.8125rem' }}>{p.duration_years} Years</span></td>
                      <td>
                        <span className={`badge ${p.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          {canEditThis && (
                            <button
                              onClick={() => onEditProgram(p)}
                              className="btn-icon"
                              title="Edit Program"
                              style={{ color: '#FBBF24' }}
                            >
                              <Edit3 size={16} />
                            </button>
                          )}

                          {canDeleteThis && (
                            <button
                              onClick={() => onDeleteProgram(p)}
                              className="btn-icon"
                              title="Delete Program"
                              style={{ color: '#F87171' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          {!canEditThis && !canDeleteThis && (
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>—</span>
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
          totalItems={filtered.length}
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
