import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  GraduationCap, 
  School,
  Database
} from 'lucide-react';
import { isAdmin, isDean, isHOD } from '../services/permissions';

export default function Sidebar({ currentView, setCurrentView, user }) {
  const adminOrDean = isAdmin(user) || isDean(user);
  const hod = isHOD(user);

  // Main menu items tailored to user role
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'departments', 
      label: adminOrDean ? 'Departments' : 'My Department', 
      icon: Building2 
    },
    { 
      id: 'faculty', 
      label: adminOrDean ? 'Faculty & HODs' : hod ? 'Department Faculty' : 'Faculty Directory', 
      icon: Users 
    },
  ];

  // Academic structure navigation items
  const academicNavItems = [
    ...(adminOrDean ? [{ id: 'schools', label: 'Schools & Institutes', icon: School }] : []),
    { 
      id: 'programs', 
      label: adminOrDean ? 'Academic Programs' : 'Degree Programs', 
      icon: GraduationCap 
    },
  ];

  return (
    <aside style={{
      width: '290px',
      background: '#0B1120',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
      userSelect: 'none'
    }}>
      {/* Sidebar Header */}
      <div style={{
        height: '88px',
        minHeight: '88px',
        maxHeight: '88px',
        flexShrink: 0,
        boxSizing: 'border-box',
        padding: '0 1.75rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#64748B',
          marginBottom: '0.25rem'
        }}>
          {adminOrDean ? 'ACADEMIC PORTAL' : hod ? 'HOD PORTAL' : 'FACULTY PORTAL'}
        </div>
        <div style={{
          fontSize: '1rem',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.01em'
        }}>
          Department Management
        </div>
      </div>

      {/* Navigation Sections */}
      <div style={{
        flex: 1,
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.6rem',
        overflowY: 'auto'
      }}>
        {/* Section 1: Main Menu */}
        <div>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#475569',
            padding: '0 0.85rem 0.6rem 0.85rem'
          }}>
            Main Menu
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.95rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.1) 100%)' : 'transparent',
                    border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                    color: isActive ? '#60A5FA' : '#94A3B8',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94A3B8';
                    }
                  }}
                >
                  <Icon size={19} color={isActive ? '#3B82F6' : '#64748B'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Academic Structure */}
        {academicNavItems.length > 0 && (
          <div>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#475569',
              padding: '0 0.85rem 0.6rem 0.85rem'
            }}>
              Academic Structure
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {academicNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.95rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.1) 100%)' : 'transparent',
                      border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                      color: isActive ? '#60A5FA' : '#94A3B8',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94A3B8';
                      }
                    }}
                  >
                    <Icon size={19} color={isActive ? '#3B82F6' : '#64748B'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Database Connection Status Card */}
      <div style={{
        padding: '1.1rem 1.25rem',
        margin: '1rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10B981',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
          }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#F1F5F9' }}>
            PostgreSQL Connected
          </span>
        </div>
        <div style={{ fontSize: '0.725rem', color: '#64748B', lineHeight: 1.3 }}>
          Database: <span style={{ color: '#94A3B8' }}>nuv_department_db</span>
        </div>
      </div>
    </aside>
  );
}
