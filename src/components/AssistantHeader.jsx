import { Sparkles, Moon, Sun } from 'lucide-react';

export default function AssistantHeader({ theme, toggleTheme }) {
  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #4285f4, #9b72f8, #f06292)',
          borderRadius: '8px',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <Sparkles size={18} />
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>Feature Assistant</span>
          <span style={{ fontSize: '10px', color: 'var(--color-brand)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>Active Session</span>
        </div>
      </div>

      {/* Theme toggler */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button 
          onClick={toggleTheme}
          style={{
            padding: '8px',
            borderRadius: '50%',
            color: 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </div>
  );
}
