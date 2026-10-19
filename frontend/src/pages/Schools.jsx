import React, { useState, useMemo } from 'react';
import { School, Building, Mail, Phone, MapPin, Plus, Edit3, Trash2, Search, Download } from 'lucide-react';
import { canManageSchools } from '../services/permissions';
import { exportToExcel } from '../utils/excelExporter';

export default function Schools({
  schools = [],
  onSelectSchool,
  onAddSchool,
  onEditSchool,
  onDeleteSchool,
  user
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const canManage = canManageSchools(user);

  const filteredSchools = useMemo(() => {
    return schools.filter(s =>
      s.school_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.school_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dean_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schools, searchTerm]);

  // Export to Excel (.xlsx) function
  const handleExportExcel = () => {
    const exportData = filteredSchools.map(s => ({
      'ID': s.id,
      'School Code': s.school_code,
      'School Name': s.school_name,
      'Dean Name': s.dean_name || 'Not Assigned',
      'Contact Email': s.contact_email || '',
      'Contact Phone': s.contact_phone || '',
      'Building': s.building || '',
      'Departments Count': s.department_count || 0,
      'Status': s.status || 'Active'
    }));
    exportToExcel(exportData, 'LJU_Schools_Institutes', 'Schools');
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
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Schools & Institutes
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
              {filteredSchools.length} {filteredSchools.length === 1 ? 'School' : 'Schools'}
            </span>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Academic umbrella institutes of LJ University containing specialized departments
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary" title="Export schools list to Excel (.xlsx)">
            <Download size={15} />
            <span>Export Excel</span>
          </button>

          {canManage && (
            <button onClick={onAddSchool} className="btn btn-primary">
              <Plus size={16} />
              <span>Add School</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search schools by name, code, or dean..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Grid of Schools */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '1.5rem'
      }}>
        {filteredSchools.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3.5rem', color: '#64748B', fontSize: '0.875rem' }}>
            No schools found.
          </div>
        ) : (
          filteredSchools.map((school) => (
            <div key={school.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60A5FA',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.04em'
                }}>
                  {school.school_code}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${school.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                    {school.status || 'Active'}
                  </span>

                  {canManage && (
                    <>
                      <button
                        onClick={() => onEditSchool(school)}
                        className="btn-icon"
                        title="Edit School"
                        style={{ color: '#FBBF24' }}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={() => onDeleteSchool(school)}
                        className="btn-icon"
                        title="Delete School"
                        style={{ color: '#F87171' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', color: '#FFFFFF', lineHeight: 1.3, fontWeight: 700 }}>
                {school.school_name}
              </h3>

              <div style={{
                fontSize: '0.8125rem',
                color: '#A78BFA',
                fontWeight: 600,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span style={{ color: '#64748B' }}>Dean:</span>
                <span style={{ color: '#E2E8F0' }}>{school.dean_name || 'Not Assigned'}</span>
              </div>

              <div style={{
                marginTop: 'auto',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                fontSize: '0.78125rem',
                color: '#94A3B8'
              }}>
                {school.building && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <MapPin size={13} color="#F59E0B" />
                    <span>{school.building}</span>
                  </div>
                )}
                {school.contact_email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Mail size={13} color="#3B82F6" />
                    <span>{school.contact_email}</span>
                  </div>
                )}
                {school.contact_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Phone size={13} color="#10B981" />
                    <span>{school.contact_phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
