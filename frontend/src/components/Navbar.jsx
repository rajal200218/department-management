import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Terminal,
  Calendar,
  LogOut,
  ChevronDown,
  Check,
  Plus,
  Clock,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { canAccessLiveSql, isAdmin, isDean } from '../services/permissions';

export default function Navbar({
  user,
  onLogout,
  onOpenChangePassword,
  onToggleSqlDrawer,
  isSqlDrawerOpen,
  dbMode,
  activeSession = '2026–2027',
  onSelectSession,
  sessions = [],
  onOpenAddSession
}) {
  const showLiveSql = canAccessLiveSql(user);
  const canManageSession = isAdmin(user) || isDean(user);

  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSessionDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSessionObj = sessions.find(s => s.name === activeSession) || {
    name: activeSession,
    status: 'Active'
  };

  return (
    <header style={{
      height: '88px',
      minHeight: '88px',
      maxHeight: '88px',
      flexShrink: 0,
      boxSizing: 'border-box',
      background: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Left: Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFF',
          boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
          flexShrink: 0
        }}>
          <Building2 size={24} />
        </div>

        <div>
          <div style={{
            fontSize: '1.125rem',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '0.01em',
            lineHeight: 1.2
          }}>
            LJ UNIVERSITY
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#94A3B8',
            fontWeight: 500,
            marginTop: '2px'
          }}>
            Department Management System • LJ University
          </div>
        </div>
      </div>

      {/* Right: Controls, Academic Session Selector, Live SQL Toggle & Admin/Faculty Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        
        {/* Interactive Academic Session Selector */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#F1F5F9',
              padding: '0.45rem 0.85rem',
              background: isSessionDropdownOpen ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              border: isSessionDropdownOpen ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isSessionDropdownOpen ? '0 0 12px rgba(59, 130, 246, 0.25)' : 'none'
            }}
            title="Click to view or switch academic sessions (e.g. 2026–2027)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: currentSessionObj.status === 'Active' ? '#10B981' : '#64748B',
                boxShadow: currentSessionObj.status === 'Active' ? '0 0 6px rgba(16, 185, 129, 0.8)' : 'none'
              }} />
              <Calendar size={14} color="#60A5FA" />
            </div>

            <span>Session: {activeSession}</span>

            <span style={{
              fontSize: '0.625rem',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              fontWeight: 700,
              background: currentSessionObj.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
              color: currentSessionObj.status === 'Active' ? '#34D399' : '#94A3B8'
            }}>
              {currentSessionObj.status ? currentSessionObj.status.toUpperCase() : 'ACTIVE'}
            </span>

            <ChevronDown size={14} color="#94A3B8" style={{
              transform: isSessionDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} />
          </button>

          {/* Session Dropdown Popover */}
          {isSessionDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '320px',
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '14px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.55)',
              padding: '0.75rem',
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              animation: 'slideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              {/* Dropdown Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.35rem 0.5rem 0.6rem 0.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>
                    Academic Sessions
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                    Select active context or review history
                  </div>
                </div>

                <div style={{
                  fontSize: '0.6875rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60A5FA',
                  fontWeight: 600
                }}>
                  LJ ERP
                </div>
              </div>

              {/* Sessions List */}
              <div style={{
                maxHeight: '230px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '0.2rem 0'
              }}>
                {sessions.map((s) => {
                  const isSelected = s.name === activeSession;
                  return (
                    <div
                      key={s.id || s.name}
                      onClick={() => {
                        onSelectSession && onSelectSession(s.name);
                        setIsSessionDropdownOpen(false);
                      }}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(59, 130, 246, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#93C5FD' : '#E2E8F0' }}>
                            {s.name}
                          </span>
                          <span style={{
                            fontSize: '0.625rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: s.status === 'Active'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : s.status === 'Upcoming'
                              ? 'rgba(56, 189, 248, 0.2)'
                              : 'rgba(148, 163, 184, 0.2)',
                            color: s.status === 'Active'
                              ? '#34D399'
                              : s.status === 'Upcoming'
                              ? '#38BDF8'
                              : '#94A3B8'
                          }}>
                            {s.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                          {s.term || 'Fall & Spring (Full Year)'}
                        </div>
                      </div>

                      {isSelected && (
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#3B82F6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF'
                        }}>
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Admin / Dean Quick Action: Add Academic Session */}
              {canManageSession && (
                <div style={{
                  paddingTop: '0.5rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.07)'
                }}>
                  <button
                    onClick={() => {
                      setIsSessionDropdownOpen(false);
                      onOpenAddSession && onOpenAddSession();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px dashed rgba(59, 130, 246, 0.4)',
                      color: '#60A5FA',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    }}
                  >
                    <Plus size={14} />
                    <span>Add New Academic Session</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live SQL Toggle: Rendered ONLY for System Admin */}
        {showLiveSql && (
          <button
            onClick={onToggleSqlDrawer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.95rem',
              borderRadius: '10px',
              background: isSqlDrawerOpen ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: isSqlDrawerOpen ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
              color: isSqlDrawerOpen ? '#93C5FD' : '#E2E8F0',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Inspect live database queries executed on PostgreSQL (Admin only)"
          >
            <Terminal size={15} color={isSqlDrawerOpen ? '#60A5FA' : '#94A3B8'} />
            <span>Live SQL</span>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '6px',
              background: dbMode === 'POSTGRES' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
              color: dbMode === 'POSTGRES' ? '#34D399' : '#FBBF24',
              letterSpacing: '0.03em'
            }}>
              {dbMode === 'POSTGRES' ? 'POSTGRES' : 'ACTIVE'}
            </span>
          </button>
        )}

        {/* User Profile Pill with Role & Department */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.35rem 0.85rem 0.35rem 0.45rem',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '9999px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'}
            alt="User Avatar"
            style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFFFFF' }}>
              {user?.name || 'System Admin'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
              <span style={{
                fontSize: '0.6875rem',
                color: user?.role?.toLowerCase() === 'admin' ? '#34D399' : user?.role?.toLowerCase() === 'dean' ? '#60A5FA' : user?.role?.toLowerCase().includes('hod') ? '#A78BFA' : '#38BDF8',
                fontWeight: 700,
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                {user?.role || 'FACULTY'}
              </span>
              {user?.department_code && (
                <span style={{
                  fontSize: '0.625rem',
                  padding: '0.05rem 0.35rem',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  fontWeight: 600
                }}>
                  {user.department_code}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onOpenChangePassword}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '0.25rem',
              marginLeft: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#60A5FA'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
            title="Change Password"
          >
            <KeyRound size={15} />
          </button>

          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
