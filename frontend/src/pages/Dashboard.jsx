import React from 'react';
import { 
  Building2, 
  Users, 
  UserCheck, 
  UserX, 
  Activity, 
  School, 
  Plus, 
  ArrowRight,
  TrendingUp,
  FolderPlus,
  TableProperties,
  GraduationCap
} from 'lucide-react';
import { isAdmin, isDean, isHOD, canAddDepartment, canAddFaculty } from '../services/permissions';

export default function Dashboard({ stats, onNavigate, onOpenAddDepartment, user }) {
  const admin = isAdmin(user);
  const dean = isDean(user);
  const hod = isHOD(user);

  const summary = stats?.summary || {
    totalDepartments: 12,
    totalFaculty: 16,
    totalSchools: 5,
    totalPrograms: 10,
    departmentsWithHOD: 11,
    departmentsWithoutHOD: 1,
    activeDepartments: 11,
    inactiveDepartments: 1
  };

  const schoolDistribution = stats?.schoolDistribution || [];
  const recentDepartments = stats?.recentDepartments || [];

  const statCards = (admin || dean) ? [
    {
      title: 'Total Departments',
      value: summary.totalDepartments,
      subtitle: `${summary.activeDepartments} Active • ${summary.inactiveDepartments} Proposed`,
      icon: Building2,
      color: '#3B82F6',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      onClick: () => onNavigate('departments')
    },
    {
      title: 'Total Faculty Members',
      value: summary.totalFaculty,
      subtitle: 'Across all academic faculties',
      icon: Users,
      color: '#10B981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      onClick: () => onNavigate('faculty')
    },
    {
      title: 'HOD Assigned',
      value: summary.departmentsWithHOD,
      subtitle: 'Departments with Head of Dept',
      icon: UserCheck,
      color: '#8B5CF6',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      onClick: () => onNavigate('departments')
    },
    {
      title: 'Departments Without HOD',
      value: summary.departmentsWithoutHOD,
      subtitle: summary.departmentsWithoutHOD > 0 ? 'Requires attention / Assignment' : 'All positions filled',
      icon: UserX,
      color: summary.departmentsWithoutHOD > 0 ? '#F59E0B' : '#10B981',
      bgGlow: summary.departmentsWithoutHOD > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
      onClick: () => onNavigate('departments')
    }
  ] : [
    {
      title: 'My Department',
      value: user?.department_code || 'DEPT',
      subtitle: user?.department_name || summary.department_name || 'Academic Department',
      icon: Building2,
      color: '#3B82F6',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      onClick: () => onNavigate('departments')
    },
    {
      title: 'Department Faculty',
      value: summary.totalFaculty,
      subtitle: 'Colleagues in department roster',
      icon: Users,
      color: '#10B981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      onClick: () => onNavigate('faculty')
    },
    {
      title: 'Academic Programs',
      value: summary.totalPrograms,
      subtitle: 'Undergraduate & Graduate programs',
      icon: GraduationCap,
      color: '#8B5CF6',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      onClick: () => onNavigate('programs')
    },
    {
      title: 'My Role & Status',
      value: user?.role ? user.role.toUpperCase() : 'ACTIVE',
      subtitle: 'Navrachana University Faculty',
      icon: UserCheck,
      color: '#34D399',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      onClick: () => onNavigate('departments')
    }
  ];

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
            {admin ? 'Academic Structure Dashboard' : hod ? `Department Head Portal • ${user?.department_name || ''}` : 'Faculty Academic Portal'}
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            {admin 
              ? 'Navrachana University (NUV) • Department Management System live analytics & operations'
              : `Logged in as ${user?.name} (${user?.role}) • Scoped Department View`}
          </p>
        </div>

        {canAddDepartment(user) && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onOpenAddDepartment} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}>
              <Plus size={18} />
              <span>Add Department</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="glass-card"
              onClick={card.onClick}
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100px',
                height: '100px',
                background: card.bgGlow,
                borderRadius: '50%',
                filter: 'blur(28px)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {card.title}
                </span>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: card.bgGlow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color
                }}>
                  <Icon size={20} />
                </div>
              </div>

              <div style={{ fontSize: '2.125rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                {card.value}
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>{card.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid: School Distribution & Key Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: (admin || dean) ? '1.3fr 1fr' : '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* School-wise Breakdown / Department Information */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <School size={18} color="#3B82F6" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                {admin || dean ? 'School-wise Department Allocation' : 'Assigned Academic School'}
              </h3>
            </div>
            {(admin || dean) && (
              <button
                onClick={() => onNavigate('schools')}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {schoolDistribution.map((school) => {
              const percentage = summary.totalDepartments > 0 
                ? Math.round((school.department_count / summary.totalDepartments) * 100) 
                : 100;

              return (
                <div key={school.school_id} style={{
                  padding: '0.9rem 1.1rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F1F5F9' }}>
                        {school.school_name}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                        Code: <span style={{ color: '#94A3B8' }}>{school.school_code}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#60A5FA' }}>
                        {school.department_count}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: '#64748B', marginLeft: '0.25rem' }}>
                        Depts
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '9999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.max(percentage, 20)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Operations & Recent Departments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions Panel */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFFFFF' }}>
              <Activity size={18} color="#10B981" />
              <span>Key Operations</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={() => onNavigate('departments')}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  padding: '0.85rem 1rem',
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderColor: 'rgba(59, 130, 246, 0.2)'
                }}
              >
                <TableProperties size={18} color="#3B82F6" />
                <div style={{ textAlign: 'left', marginLeft: '0.25rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFFFFF' }}>
                    {admin ? 'Departments' : 'My Department'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                    {admin ? 'Full CRUD Directory' : 'Profile & Roster'}
                  </div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('faculty')}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  padding: '0.85rem 1rem',
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderColor: 'rgba(16, 185, 129, 0.2)'
                }}
              >
                <Users size={18} color="#10B981" />
                <div style={{ textAlign: 'left', marginLeft: '0.25rem' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFFFFF' }}>
                    {admin ? 'Faculty Directory' : 'Department Faculty'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                    {admin ? 'All Faculties' : 'Academic Colleagues'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Scoped Departments List */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                {admin || dean ? 'Recent Departments' : 'Department Profile'}
              </h3>
              <button
                onClick={() => onNavigate('departments')}
                style={{ background: 'transparent', border: 'none', color: '#60A5FA', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {admin || dean ? 'View full table →' : 'View details →'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentDepartments.slice(0, 4).map((dept) => (
                <div
                  key={dept.id}
                  onClick={() => onNavigate('departments', dept.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{
                      padding: '0.2rem 0.45rem',
                      background: 'rgba(59, 130, 246, 0.15)',
                      borderRadius: '5px',
                      color: '#60A5FA',
                      fontWeight: 700,
                      fontSize: '0.725rem'
                    }}>
                      {dept.department_code}
                    </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#E2E8F0' }}>
                      {dept.department_name}
                    </span>
                  </div>

                  <span className={`badge ${dept.status === 'Active' ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: '0.6875rem' }}>
                    {dept.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
