import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function TaskInput({ onAddTask }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const success = await onAddTask(newTaskTitle.trim());
    if (success) {
      setNewTaskTitle('');
    }
  };

  return (
    <form onSubmit={onSubmit} style={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      padding: '12px 16px',
      gap: '12px',
      marginBottom: '24px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <button 
        type="submit"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: newTaskTitle.trim() ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none'
        }}
        disabled={!newTaskTitle.trim()}
      >
        <Plus size={20} color={newTaskTitle.trim() ? "var(--color-brand)" : "var(--text-secondary)"} />
      </button>
      <input 
        type="text" 
        placeholder="Add a task" 
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        style={{
          flex: 1,
          border: 'none',
          backgroundColor: 'transparent',
          fontSize: '16px',
          color: 'var(--text-primary)',
          outline: 'none'
        }}
      />
      {newTaskTitle.trim() && (
        <button 
          type="submit"
          style={{
            backgroundColor: 'var(--color-brand)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Save
        </button>
      )}
    </form>
  );
}
