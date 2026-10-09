import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search, CheckSquare, Square } from 'lucide-react';

/**
 * Universal Glassmorphic Multi-Select Dropdown Component
 */
export default function MultiSelectDropdown({
  options = [],
  selectedValues = [],
  onChange,
  placeholder = 'Select options...',
  label = null,
  icon: Icon = null,
  searchable = true,
  badgeColor = '#3B82F6',
  maxDisplayTags = 2,
  alignRight = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Normalize options format
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.id,
        label: opt.label || opt.name || opt.school_name || opt.department_name || String(opt.value),
        badge: opt.badge || opt.code || opt.school_code || opt.department_code || null,
        subtitle: opt.subtitle || null
      };
    }
    return { value: opt, label: String(opt), badge: null, subtitle: null };
  });

  // Filter options by search query
  const filteredOptions = normalizedOptions.filter((opt) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.badge && opt.badge.toLowerCase().includes(q)) ||
      (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
    );
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (val) => {
    const isSelected = selectedValues.includes(val);
    let updated;
    if (isSelected) {
      updated = selectedValues.filter((v) => v !== val);
    } else {
      updated = [...selectedValues, val];
    }
    onChange(updated);
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    const allValues = normalizedOptions.map((o) => o.value);
    onChange(allValues);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const isAllSelected = normalizedOptions.length > 0 && selectedValues.length === normalizedOptions.length;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          minHeight: '42px',
          padding: '0.45rem 0.85rem',
          background: isOpen ? 'rgba(30, 41, 59, 0.95)' : 'rgba(30, 41, 59, 0.7)',
          border: isOpen ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: '#F8FAFC',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1, overflow: 'hidden', flexWrap: 'wrap' }}>
          {Icon && <Icon size={15} color="#94A3B8" style={{ flexShrink: 0 }} />}

          {label && (
            <span style={{ color: '#94A3B8', fontSize: '0.775rem', fontWeight: 600, marginRight: '0.2rem', flexShrink: 0 }}>
              {label}:
            </span>
          )}

          {selectedValues.length === 0 ? (
            <span style={{ color: '#64748B', fontSize: '0.8125rem' }}>{placeholder}</span>
          ) : isAllSelected ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.15rem 0.5rem',
              borderRadius: '5px',
              background: 'rgba(59, 130, 246, 0.18)',
              color: '#93C5FD',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              All Selected ({normalizedOptions.length})
            </span>
          ) : (
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {selectedValues.slice(0, maxDisplayTags).map((val) => {
                const opt = normalizedOptions.find((o) => o.value === val);
                const tagLabel = opt ? (opt.badge || opt.label) : String(val);

                return (
                  <span
                    key={val}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '5px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      color: '#93C5FD',
                      fontSize: '0.725rem',
                      fontWeight: 600
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleOption(val);
                    }}
                    title="Click to remove"
                  >
                    <span>{tagLabel}</span>
                    <X size={11} color="#93C5FD" />
                  </span>
                );
              })}

              {selectedValues.length > maxDisplayTags && (
                <span style={{
                  padding: '0.15rem 0.4rem',
                  borderRadius: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  fontSize: '0.725rem',
                  fontWeight: 600
                }}>
                  +{selectedValues.length - maxDisplayTags} more
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {selectedValues.length > 0 && (
            <span
              onClick={handleClearAll}
              style={{
                fontSize: '0.6875rem',
                color: '#94A3B8',
                padding: '0.1rem 0.3rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title="Clear selection"
            >
              Clear
            </span>
          )}
          <ChevronDown
            size={15}
            color="#94A3B8"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: alignRight ? 'auto' : 0,
            right: alignRight ? 0 : 'auto',
            width: '100%',
            minWidth: '260px',
            background: '#0B132B',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '10px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Search bar inside dropdown */}
          {searchable && (
            <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Filter options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem 0.35rem 1.9rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: '#FFF',
                    fontSize: '0.78125rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          {/* Quick Action Header: Select All / Clear All */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.45rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.725rem',
            fontWeight: 600
          }}>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#60A5FA',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.725rem'
              }}
            >
              <CheckSquare size={13} />
              <span>Select All</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.725rem'
              }}
            >
              <Square size={13} />
              <span>Clear All</span>
            </button>
          </div>

          {/* Options List */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '0.35rem' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#64748B', fontSize: '0.78125rem' }}>
                No options match '{searchQuery}'
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggleOption(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      marginBottom: '2px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        border: isSelected ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.2)',
                        background: isSelected ? '#3B82F6' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.8125rem',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? '#FFFFFF' : '#CBD5E1',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {opt.label}
                        </div>
                        {opt.subtitle && (
                          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>{opt.subtitle}</div>
                        )}
                      </div>
                    </div>

                    {opt.badge && (
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#94A3B8',
                        flexShrink: 0,
                        marginLeft: '0.5rem'
                      }}>
                        {opt.badge}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer showing count */}
          <div style={{
            padding: '0.4rem 0.75rem',
            background: 'rgba(0, 0, 0, 0.25)',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.6875rem',
            color: '#64748B'
          }}>
            <span>{filteredOptions.length} available</span>
            <span>{selectedValues.length} selected</span>
          </div>
        </div>
      )}
    </div>
  );
}
