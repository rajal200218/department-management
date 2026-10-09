import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Department',
  message = 'Are you sure you want to delete this record? This action will execute a live SQL DELETE in the database.',
  itemName = '',
  isDeleting = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#FFF' }}>{title}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Irreversible Database Action</p>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: '#CBD5E1', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.5 }}>
            {message}
          </p>

          {itemName && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              color: '#FCA5A5',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}>
              {itemName}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-danger"
            disabled={isDeleting}
            style={{ gap: '0.4rem' }}
          >
            <Trash2 size={16} />
            <span>{isDeleting ? 'Deleting from DB...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
