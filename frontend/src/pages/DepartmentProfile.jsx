import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Users, 
  GraduationCap, 
  UserCheck, 
  UserPlus, 
  Edit2,
  Edit3, 
  Trash2, 
  Award,
  BookOpen,
  Briefcase,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { canEditDepartment, canAddFaculty, canEditFaculty, canDeleteFaculty } from '../services/permissions';
import { exportToExcel } from '../utils/excelExporter';

export default function DepartmentProfile({
  departmentId,
  onBack,
  onEdit,
  onAddFaculty,
  onEditFaculty,
  onDeleteFaculty,
  user
}) {
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('faculty'); // 'faculty' or 'programs'

  const loadDepartment = async () => {
    setLoading(true);
    try {
      const res = await api.getDepartmentById(departmentId);
      if (res.success) {
        setDepartment(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch department profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (departmentId) {
      loadDepartment();
    }
  }, [departmentId]);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Department Profile from PostgreSQL...</p>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="page-container">
        <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Departments</span>
        </button>
        <div style={{ color: '#F87171' }}>{error || 'Department not found'}</div>
      </div>
    );
  }

  const showEditProfile = canEditDepartment(user, department.id);
  const showAddFaculty = canAddFaculty(user, department.id);

  const handleExportExcel = () => {
    if (activeTab === 'faculty') {
      const exportData = (department.faculty_members || []).map(f => ({
        'ID': f.id,
        'Faculty Name': f.name,
        'Department': department.department_name,
        'Designation': f.designation || '',
        'Qualification': f.qualification || '',
        'Specialization': f.specialization || '',
        'Email': f.email || '',
        'Phone': f.phone || '',
        'Experience (Years)': f.experience_years || 0,
        'Is Current HOD': f.id === department.hod_id ? 'Yes' : 'No',
        'Status': f.status || 'Active'
      }));
      exportToExcel(exportData, `NUV_${department.department_code}_Faculty_Roster`, 'Faculty Roster');
    } else {
      const exportData = (department.programs || []).map(p => ({
        'ID': p.id,
        'Program Code': p.program_code,
        'Program Name': p.program_name,
        'Department': department.department_name,
        'Degree Level': p.degree_level || '',
        'Intake Capacity (Seats)': p.intake_capacity || 0,
        'Duration (Years)': p.duration_years || 0,
        'Status': p.status || 'Active'
      }));
      exportToExcel(exportData, `NUV_${department.department_code}_Programs`, 'Programs');
    }
  };

  return (
    <div className="page-container">
      {/* Back Button & Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Directory</span>
        </button>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportExcel} className="btn btn-secondary" title="Export current tab data to Excel (.xlsx)">
            <Download size={15} />
            <span>Export {activeTab === 'faculty' ? 'Faculty Roster' : 'Programs'} (Excel)</span>
          </button>

          {showEditProfile && (
            <button onClick={() => onEdit(department)} className="btn btn-secondary">
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          )}

          {showAddFaculty && (
            <button onClick={() => onAddFaculty(department.id)} className="btn btn-primary">
              <UserPlus size={16} />
              <span>Add Faculty</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner Card */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', position: 'relative' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          {/* Left: Department Identity */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontSize: '1.5rem',
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)'
            }}>
              {department.department_code}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <h1 style={{ fontSize: '1.75rem' }}>{department.department_name}</h1>
                <span className={`badge ${department.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                  {department.status}
                </span>
              </div>
              <p style={{ color: '#93C5FD', fontSize: '0.95rem', fontWeight: 500 }}>
                {department.school_name}
              </p>
            </div>
          </div>

          {/* Right: Key Stats Quick Pills */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34D399' }}>
                {department.faculty_members?.length || department.faculty_count || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Faculty Roster
              </div>
            </div>

            <div style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#60A5FA' }}>
                {department.programs?.length || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Programs
              </div>
            </div>

            <div style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FBBF24' }}>
                {department.established_year || '2015'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Established
              </div>
            </div>
          </div>
        </div>

        {/* Contact Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          {department.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={15} color="#3B82F6" />
              <span>{department.email}</span>
            </div>
          )}

          {department.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={15} color="#10B981" />
              <span>{department.phone}</span>
            </div>
          )}

          {(department.building || department.room_no) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={15} color="#F59E0B" />
              <span>{department.building} {department.room_no ? `• ${department.room_no}` : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: HOD Spotlight Card & Description */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* HOD Card */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#A78BFA',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <UserCheck size={16} />
            <span>Head of Department (HOD)</span>
          </div>

          {department.hod_name ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  boxShadow: '0 6px 18px rgba(139, 92, 246, 0.35)'
                }}>
                  {department.hod_name.replace('Dr. ', '').replace('Prof. ', '').charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#FFF' }}>{department.hod_name}</h3>
                  <div style={{ fontSize: '0.825rem', color: '#A78BFA', fontWeight: 600 }}>
                    {department.hod_designation || 'HOD & Professor'}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                fontSize: '0.825rem',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '1rem',
                borderRadius: '8px'
              }}>
                {department.hod_qualification && (
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Qualification: </span>
                    <strong style={{ color: '#CBD5E1' }}>{department.hod_qualification}</strong>
                  </div>
                )}
                {department.hod_specialization && (
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Specialization: </span>
                    <strong style={{ color: '#CBD5E1' }}>{department.hod_specialization}</strong>
                  </div>
                )}
                {department.hod_email && (
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Email: </span>
                    <span style={{ color: '#93C5FD' }}>{department.hod_email}</span>
                  </div>
                )}
                {department.hod_phone && (
                  <div>
                    <span style={{ color: 'var(--text-dim)' }}>Phone: </span>
                    <span style={{ color: '#E2E8F0' }}>{department.hod_phone}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              background: 'rgba(245, 158, 11, 0.05)',
              borderRadius: '8px',
              border: '1px dashed rgba(245, 158, 11, 0.3)'
            }}>
              <p style={{ color: '#FBBF24', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                No Head of Department (HOD) Assigned
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {showEditProfile ? 'You can assign an HOD by clicking "Edit Profile".' : 'Position currently vacant.'}
              </p>
              {showEditProfile && (
                <button onClick={() => onEdit(department)} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                  Assign HOD Now
                </button>
              )}
            </div>
          )}
        </div>

        {/* Department About & Vision */}
        <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="#3B82F6" />
            <span>Academic Overview & Facilities</span>
          </h3>

          <div style={{
            fontSize: '0.9rem',
            color: '#CBD5E1',
            lineHeight: 1.7,
            flex: 1,
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '1.25rem',
            borderRadius: '10px'
          }}>
            {department.description || 'The department is equipped with state-of-the-art computer labs, high performance computing clusters, modern smart classrooms, and dedicated research facilities for undergraduate and postgraduate students.'}
          </div>
        </div>
      </div>

      {/* Tabs: Faculty Members Roster & Academic Programs */}
      <div className="glass-card">
        {/* Tab Buttons */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 1.5rem'
        }}>
          <button
            onClick={() => setActiveTab('faculty')}
            style={{
              padding: '1rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'faculty' ? '2px solid #3B82F6' : '2px solid transparent',
              color: activeTab === 'faculty' ? '#60A5FA' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Users size={16} />
            <span>Faculty Members ({department.faculty_members?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('programs')}
            style={{
              padding: '1rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'programs' ? '2px solid #3B82F6' : '2px solid transparent',
              color: activeTab === 'programs' ? '#60A5FA' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <GraduationCap size={16} />
            <span>Academic Programs ({department.programs?.length || 0})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'faculty' ? (
            <div>
              {department.faculty_members && department.faculty_members.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Faculty Name</th>
                        <th>Designation</th>
                        <th>Qualification & Specialization</th>
                        <th>Email & Phone</th>
                        <th>Experience</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {department.faculty_members.map((f) => {
                        const canDeleteThisFaculty = canDeleteFaculty(user, f);

                        return (
                          <tr key={f.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: '#FFF' }}>{f.name}</div>
                              {f.id === department.hod_id && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  background: 'rgba(139, 92, 246, 0.2)',
                                  color: '#C4B5FD',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  fontWeight: 700
                                }}>
                                  Current HOD
                                </span>
                              )}
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem', color: '#93C5FD' }}>{f.designation}</span>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.825rem', color: '#E2E8F0' }}>{f.qualification || 'N/A'}</div>
                              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{f.specialization || ''}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>{f.email}</div>
                              <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{f.phone}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem' }}>{f.experience_years || 0} yrs</span>
                            </td>
                            <td>
                              <span className={`badge ${f.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                                {f.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
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

                                {canDeleteThisFaculty ? (
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
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  No faculty records found in this department.
                </div>
              )}
            </div>
          ) : (
            <div>
              {department.programs && department.programs.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '140px', minWidth: '130px', whiteSpace: 'nowrap' }}>Program Code</th>
                        <th>Program Name</th>
                        <th>Degree Level</th>
                        <th>Intake Capacity</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {department.programs.map((p) => (
                        <tr key={p.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '0.3rem 0.65rem',
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#60A5FA',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              letterSpacing: '0.04em',
                              whiteSpace: 'nowrap',
                              display: 'inline-block'
                            }}>
                              {p.program_code}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#FFF' }}>{p.program_name}</td>
                          <td><span style={{ color: '#CBD5E1' }}>{p.degree_level}</span></td>
                          <td><strong>{p.intake_capacity} seats</strong></td>
                          <td>{p.duration_years} Years</td>
                          <td>
                            <span className={`badge ${p.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  No programs linked to this department yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
