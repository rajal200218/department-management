import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  Download, 
  Mail,
  UserX,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { 
  isAdmin, 
  isDean, 
  canAddDepartment, 
  canEditDepartment, 
  canDeleteDepartment, 
  canSyncDb 
} from '../services/permissions';
import { exportToExcel } from '../utils/excelExporter';

import MultiSelectDropdown from '../components/MultiSelectDropdown';
import Pagination from '../components/Pagination';

export default function Departments({
  departments = [],
  schools = [],
  loading = false,
  onRefresh,
  onViewProfile,
  onAddDepartment,
  onEditDepartment,
  onDeleteDepartment,
  user
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedHodStatuses, setSelectedHodStatuses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const adminOrDean = isAdmin(user) || isDean(user);
  const showAddDept = canAddDepartment(user);
  const showSyncDb = canSyncDb(user);

  // Filtered department list with multi-select support
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const matchesSearch = 
        dept.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.department_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.hod_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.school_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSchool = 
        selectedSchools.length === 0 || selectedSchools.includes(dept.school_id);
      
      const matchesStatus = 
        selectedStatuses.length === 0 || selectedStatuses.includes(dept.status);
      
      const matchesHod = 
        selectedHodStatuses.length === 0 ? true :
        (selectedHodStatuses.includes('with_hod') && Boolean(dept.hod_id || dept.hod_name)) ||
        (selectedHodStatuses.includes('no_hod') && !Boolean(dept.hod_id || dept.hod_name));

      return matchesSearch && matchesSchool && matchesStatus && matchesHod;
    });
  }, [departments, searchTerm, selectedSchools, selectedStatuses, selectedHodStatuses]);

  // Reset to page 1 on filter/search change
  const totalPages = Math.max(1, Math.ceil(filteredDepartments.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedDepartments = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredDepartments.slice(start, start + pageSize);
  }, [filteredDepartments, validCurrentPage, pageSize]);

  // Export to Excel (.xlsx) function
  const handleExportExcel = () => {
    const exportData = filteredDepartments.map(d => ({
      'ID': d.id,
      'Department Code': d.department_code,
      'Department Name': d.department_name,
      'School / Institute': d.school_name || 'N/A',
      'Head of Dept (HOD)': d.hod_name || 'Not Assigned',
      'HOD Designation': d.hod_designation || '',
      'HOD Email': d.hod_email || '',
      'HOD Phone': d.hod_phone || '',
      'Faculty Count': d.faculty_count || 0,
      'Department Email': d.email || '',
      'Department Phone': d.phone || '',
      'Building': d.building || '',
      'Room No': d.room_no || '',
      'Established Year': d.established_year || '',
      'Status': d.status
    }));

    exportToExcel(exportData, 'LJU_Departments', 'Departments');
  };

  const schoolOptions = schools.map(s => ({
    value: s.id,
    label: s.school_name,
    badge: s.school_code
  }));

  const hodOptions = [
    { value: 'with_hod', label: 'With HOD Assigned', badge: 'ASSIGNED' },
    { value: 'no_hod', label: 'Without HOD (Vacant)', badge: 'VACANT' }
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active', badge: 'ACTIVE' },
    { value: 'Inactive', label: 'Inactive / Proposed', badge: 'INACTIVE' }
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
              {adminOrDean ? 'Departments Directory' : 'My Department'}
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
              {filteredDepartments.length} {filteredDepartments.length === 1 ? 'Department' : 'Departments'}
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            {adminOrDean
              ? 'Manage academic departments, assign Heads of Department (HOD), and configure profiles'
              : `Viewing assigned academic department details for ${user?.name}`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {showSyncDb && (
            <button onClick={onRefresh} className="btn btn-secondary" title="Sync with PostgreSQL">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Sync DB</span>
            </button>
          )}

          <button onClick={handleExportExcel} className="btn btn-secondary" title="Export current list to Excel (.xlsx)">
            <Download size={15} />
            <span>Export Excel</span>
          </button>

          {showAddDept && (
            <button onClick={onAddDepartment} className="btn btn-primary">
              <Plus size={16} />
              <span>Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar (shown only when multiple departments exist) */}
      {adminOrDean && (
        <div className="glass-card filter-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', position: 'relative', zIndex: 30, overflow: 'visible' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 1.1fr 1fr', gap: '0.85rem', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search by dept name, code, or HOD name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            {/* School Multi-Select Filter */}
            <div>
              <MultiSelectDropdown
                options={schoolOptions}
                selectedValues={selectedSchools}
                onChange={setSelectedSchools}
                placeholder="All Schools"
                label="Schools"
              />
            </div>

            {/* HOD Status Multi-Select Filter */}
            <div>
              <MultiSelectDropdown
                options={hodOptions}
                selectedValues={selectedHodStatuses}
                onChange={setSelectedHodStatuses}
                placeholder="All HOD Status"
                label="HOD"
                searchable={false}
                alignRight={true}
              />
            </div>

            {/* Status Multi-Select Filter */}
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
      )}

      {/* Main Departments Table */}
      <div className="glass-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '110px', minWidth: '100px', whiteSpace: 'nowrap' }}>Code</th>
                <th>Department Name</th>
                <th>School / Institute</th>
                <th>Head of Department (HOD)</th>
                <th style={{ textAlign: 'center' }}>Faculty Count</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDepartments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem', color: '#64748B', fontSize: '0.875rem' }}>
                    {loading ? 'Loading departments from database...' : 'No department record found for your account.'}
                  </td>
                </tr>
              ) : (
                paginatedDepartments.map((dept) => {
                  const canEditThisDept = canEditDepartment(user, dept.id);
                  const canDeleteThisDept = canDeleteDepartment(user);

                  return (
                    <tr key={dept.id}>
                      {/* Code */}
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
                          {dept.department_code}
                        </span>
                      </td>

                      {/* Name & Contact */}
                      <td>
                        <div>
                          <div
                            onClick={() => onViewProfile(dept.id)}
                            style={{
                              fontWeight: 600,
                              color: '#FFFFFF',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              display: 'inline-block'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#60A5FA'}
                            onMouseLeave={(e) => e.target.style.color = '#FFFFFF'}
                          >
                            {dept.department_name}
                          </div>
                          {dept.email && (
                            <div style={{ fontSize: '0.725rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                              <Mail size={12} />
                              <span>{dept.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* School */}
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                          {dept.school_name || 'School of Engineering & Technology'}
                        </span>
                      </td>

                      {/* HOD */}
                      <td>
                        {dept.hod_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'rgba(139, 92, 246, 0.2)',
                              color: '#A78BFA',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {dept.hod_name.replace('Dr. ', '').replace('Prof. ', '').charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#E2E8F0' }}>
                                {dept.hod_name}
                              </div>
                              <div style={{ fontSize: '0.6875rem', color: '#A78BFA' }}>
                                {dept.hod_designation || 'HOD'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span style={{
                            fontSize: '0.725rem',
                            color: '#F59E0B',
                            background: 'rgba(245, 158, 11, 0.1)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 500
                          }}>
                            <UserX size={12} />
                            <span>Not Assigned</span>
                          </span>
                        )}
                      </td>

                      {/* Faculty Count */}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          color: '#34D399',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.1)'
                        }}>
                          {dept.faculty_count || 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${dept.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                          {dept.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button
                            onClick={() => onViewProfile(dept.id)}
                            className="btn-icon"
                            title="View Complete Department Profile"
                            style={{ color: '#60A5FA' }}
                          >
                            <Eye size={16} />
                          </button>

                          {canEditThisDept && (
                            <button
                              onClick={() => onEditDepartment(dept)}
                              className="btn-icon"
                              title="Edit Department"
                              style={{ color: '#FBBF24' }}
                            >
                              <Edit3 size={16} />
                            </button>
                          )}

                          {canDeleteThisDept && (
                            <button
                              onClick={() => onDeleteDepartment(dept)}
                              className="btn-icon"
                              title="Delete Department"
                              style={{ color: '#F87171' }}
                            >
                              <Trash2 size={16} />
                            </button>
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
          totalItems={filteredDepartments.length}
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
