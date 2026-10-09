import React, { useState, useEffect } from 'react';
import { Terminal, Database, X, RefreshCw, CheckCircle, Clock, Server } from 'lucide-react';
import { api } from '../services/api';

export default function SqlInspector({ isOpen, onClose, dbMode }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getQueryLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load SQL logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '290px',
      right: 0,
      height: '340px',
      background: '#090D16',
      borderTop: '2px solid #3B82F6',
      boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.7)',
      zIndex: 500,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1.5rem',
        background: '#0F172A',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Terminal size={18} color="#60A5FA" />
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>
              Database Live Query Stream & SQL Inspector
            </span>
            <span style={{
              marginLeft: '0.75rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              background: dbMode === 'POSTGRES' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              color: dbMode === 'POSTGRES' ? '#34D399' : '#60A5FA'
            }}>
              Engine: {dbMode || 'POSTGRESQL'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={fetchLogs}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', gap: '0.3rem' }}
          >
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ color: '#94A3B8' }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Query Log Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem 1.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>
            No SQL queries executed yet. Perform an action like "Add Department" or search to inspect live SQL!
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: '0.65rem 0.9rem',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.725rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#34D399', fontWeight: 600 }}>SQL EXEC</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {log.rowCount !== null && <span>Rows: <strong style={{ color: '#FFF' }}>{log.rowCount}</strong></span>}
                  <span style={{ color: '#FBBF24' }}>{log.durationMs}ms</span>
                </div>
              </div>

              <div style={{ color: '#93C5FD', wordBreak: 'break-all', lineHeight: 1.4 }}>
                {log.sql}
              </div>

              {log.params && log.params.length > 0 && (
                <div style={{ color: '#A78BFA', fontSize: '0.725rem' }}>
                  Params: [{log.params.map(p => typeof p === 'string' ? `"${p}"` : p).join(', ')}]
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
