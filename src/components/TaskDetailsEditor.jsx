import { useState } from 'react';

export default function TaskDetailsEditor({
  task,
  isSubtask = false,
  handleUpdateDueDate,
  handleUpdateDueTime,
  handleAddTag,
  handleRemoveTag,
  getTagColor,
  isMobile
}) {
  const [tagInput, setTagInput] = useState('');

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      flexWrap: 'wrap',
      gap: '12px',
      paddingLeft: isMobile ? '16px' : '44px',
      paddingRight: '16px',
      paddingTop: isSubtask ? '4px' : '6px',
      paddingBottom: isSubtask ? '8px' : '12px',
      backgroundColor: 'rgba(0,0,0,0.01)',
      borderBottom: '1px solid rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isSubtask ? '3px' : '4px', alignItems: 'flex-start', width: isMobile ? '100%' : 'auto' }}>
        <label style={{ fontSize: isSubtask ? '10px' : '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Due Date</label>
        <input 
          type="date" 
          value={task.dueDate || ''}
          onChange={(e) => handleUpdateDueDate(task, e.target.value)}
          data-testid="due-date-input"
          style={{
            padding: isSubtask ? '3px 6px' : '4px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: isSubtask ? '11px' : '12.5px',
            outline: 'none',
            width: isMobile ? '100%' : 'auto'
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isSubtask ? '3px' : '4px', alignItems: 'flex-start', width: isMobile ? '100%' : 'auto' }}>
        <label style={{ fontSize: isSubtask ? '10px' : '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Due Time</label>
        <input 
          type="time" 
          value={task.dueTime || ''}
          onChange={(e) => handleUpdateDueTime(task, e.target.value)}
          data-testid="due-time-input"
          style={{
            padding: isSubtask ? '3px 6px' : '4px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: isSubtask ? '11px' : '12.5px',
            outline: 'none',
            width: isMobile ? '100%' : 'auto'
          }}
        />
      </div>
      {/* Tag Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isSubtask ? '3px' : '4px', alignItems: 'flex-start', flex: 1, width: isMobile ? '100%' : 'auto' }}>
        <label style={{ fontSize: isSubtask ? '10px' : '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Tags</label>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
          {task.tags && task.tags.map(t => {
            const colors = getTagColor(t);
            return (
              <span key={t} style={{
                fontSize: isSubtask ? '9px' : '10px',
                color: colors.text,
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                padding: isSubtask ? '1px 5px' : '1px 6px',
                borderRadius: isSubtask ? '8px' : '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: isSubtask ? '3px' : '4px'
              }}>
                {t}
                <button 
                  type="button" 
                  onClick={() => handleRemoveTag(task, t)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-tertiary)',
                    width: isSubtask ? '10px' : '12px',
                    height: isSubtask ? '10px' : '12px',
                    fontSize: isSubtask ? '8px' : '10px',
                    lineHeight: 1,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  &times;
                </button>
              </span>
            );
          })}
        </div>
        <input 
          type="text" 
          placeholder="Add a tag..."
          data-testid="tag-input"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTag(task, e.target.value);
              setTagInput('');
            }
          }}
          style={{
            padding: isSubtask ? '3px 6px' : '4px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontSize: isSubtask ? '11px' : '12.5px',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
      </div>
    </div>
  );
}
