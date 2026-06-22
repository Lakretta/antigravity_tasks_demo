import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';

export default function TaskInput({ onAddTask }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef(null);

  const onSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const success = await onAddTask(newTaskTitle.trim());
    if (success) {
      setNewTaskTitle('');
    }
  };

  const handlePlusClick = (e) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onSubmit(e);
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={onSubmit} style={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      padding: '10px 14px',
      gap: '12px',
      marginBottom: '24px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <button 
        type="button"
        onClick={handlePlusClick}
        className={`add-task-plus-btn ${newTaskTitle.trim() ? 'active' : ''}`}
        title="Add task"
      >
        <Plus size={20} />
      </button>
      <input 
        type="text" 
        placeholder="Add a task" 
        ref={inputRef}
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
    </form>
  );
}
