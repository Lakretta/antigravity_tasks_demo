import { X, Bell, AlertTriangle } from 'lucide-react';

export function ReminderPopup({ activeReminder, onDismiss, onComplete }) {
  if (!activeReminder) return null;

  return (
    <div 
      data-testid="reminder-popup"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: '380px',
        backgroundColor: 'var(--bg-primary)',
        border: '2px solid var(--color-brand)',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 9999,
        animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{
          backgroundColor: 'var(--color-brand-light)',
          padding: '6px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-brand)',
          flexShrink: 0
        }}>
          <Bell size={18} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'left' }}>
            Task Reminder
          </h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', lineHeight: '1.4', color: 'var(--text-secondary)', textAlign: 'left' }}>
            The task <strong>"{activeReminder.title}"</strong> is due: <strong>{activeReminder.dueText}</strong>.
          </p>
        </div>
        <button 
          data-testid="dismiss-reminder-btn"
          onClick={() => onDismiss(activeReminder.id)} 
          style={{ color: 'var(--text-secondary)', marginLeft: 'auto', padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
        <button 
          data-testid="dismiss-reminder-btn"
          onClick={() => onDismiss(activeReminder.id)}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Dismiss
        </button>
        <button 
          onClick={async () => {
            await onComplete(activeReminder.id);
            onDismiss(activeReminder.id);
          }}
          style={{
            backgroundColor: 'var(--color-brand)',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Complete Task
        </button>
      </div>
    </div>
  );
}

export function BlockerWarning({ blockerWarning, onClose }) {
  if (!blockerWarning || !blockerWarning.show) return null;

  return (
    <div 
      data-testid="blocker-warning"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '480px',
        backgroundColor: 'rgba(217, 48, 37, 0.15)', // Glassmorphic translucent red
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(217, 48, 37, 0.35)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 99999,
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div style={{
        backgroundColor: 'rgba(217, 48, 37, 0.25)',
        padding: '6px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-danger)',
        flexShrink: 0
      }}>
        <AlertTriangle size={18} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'left' }}>
          Completion Blocked
        </span>
        <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', lineHeight: '1.4', color: 'var(--text-secondary)', textAlign: 'left' }}>
          Cannot complete <strong>"{blockerWarning.parentTitle}"</strong>: Please complete all subtasks first!
        </p>
      </div>
      <button 
        onClick={onClose} 
        style={{ color: 'var(--text-secondary)', marginLeft: 'auto', padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
