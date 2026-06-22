import { useState } from 'react';
import { 
  Circle, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Calendar, 
  Trash2, 
  Clock, 
  Check 
} from 'lucide-react';
import TaskDetailsEditor from './TaskDetailsEditor';

export default function TaskItem({
  task,
  subtasks = [],
  isSubtask = false,
  handleToggleTask,
  handleDeleteTask,
  handleUpdateDueDate,
  handleUpdateDueTime,
  handleAddTag,
  handleRemoveTag,
  handleAddSubtask,
  getTagColor,
  selectedTagFilter,
  isMobile
}) {
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');

  const isOverdue = (() => {
    if (!task.dueDate || !task.dueTime) return false;
    const [y, m, d] = task.dueDate.split('-').map(Number);
    const [h, min] = task.dueTime.split(':').map(Number);
    const due = new Date(y, m - 1, d, h, min);
    return new Date() > due;
  })();

  const totalSubtasks = subtasks.length;
  const hasIncompleteSubtasks = !isSubtask && subtasks.some(s => !s.completed);

  const onAddSubtaskSubmit = async (e) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    const success = await handleAddSubtask(task.id, subtaskTitle.trim());
    if (success) {
      setSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: isSubtask ? (isMobile ? '20px' : '36px') : '0' }}>
      {/* Main Task Item */}
      <div 
        data-testid="task-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? (isSubtask ? '8px 8px' : '12px 8px') : (isSubtask ? '8px 16px' : '12px 16px'),
          borderRadius: '8px',
          backgroundColor: 'transparent',
          gap: isMobile ? '8px' : '12px',
          borderBottom: isSubtask ? '1px solid rgba(0,0,0,0.02)' : '1px solid rgba(0,0,0,0.04)'
        }}
      >
        <button 
          onClick={() => handleToggleTask(task)}
          style={{ 
            color: isSubtask 
              ? (task.completed ? 'var(--color-brand)' : 'var(--text-secondary)')
              : (hasIncompleteSubtasks ? 'var(--text-tertiary)' : 'var(--text-secondary)'),
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          {isSubtask ? (
            task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />
          ) : (
            hasIncompleteSubtasks ? (
              <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} title="Blocked by incomplete subtasks" />
            ) : (
              task.completed ? <CheckCircle2 size={20} style={{ color: 'var(--color-brand)' }} /> : <Circle size={20} />
            )
          )}
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
          <span style={{ 
            fontSize: isSubtask ? '14px' : '15px', 
            color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)', 
            textAlign: 'left',
            textDecoration: task.completed ? 'line-through' : 'none',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere'
          }}>
            {task.title}
          </span>
          <div style={{ display: 'flex', gap: isSubtask ? '6px' : '8px', flexWrap: 'wrap' }}>
            {task.dueDate && (
              <span style={{ 
                fontSize: isSubtask ? '10px' : '11px', 
                color: isOverdue ? '#ea4335' : 'var(--text-secondary)',
                backgroundColor: isOverdue ? 'rgba(234, 67, 53, 0.1)' : 'var(--bg-secondary)',
                padding: isSubtask ? '1px 6px' : '2px 8px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: isSubtask ? '3px' : '4px',
                marginTop: '4px',
                fontWeight: isOverdue ? '600' : '400'
              }}>
                {isOverdue ? <AlertTriangle size={isSubtask ? 8 : 10} /> : <Clock size={isSubtask ? 8 : 10} />}
                {isOverdue ? 'Overdue' : 'Due'}: {task.dueDate} {task.dueTime && `at ${task.dueTime}`}
              </span>
            )}
            {!isSubtask && totalSubtasks > 0 && (
              <span style={{ 
                fontSize: '11px', 
                color: hasIncompleteSubtasks ? 'var(--color-danger)' : 'var(--color-success)',
                backgroundColor: hasIncompleteSubtasks ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '4px',
                fontWeight: '600'
              }}>
                {hasIncompleteSubtasks ? <AlertTriangle size={10} /> : <Check size={10} />}
                {subtasks.filter(s => s.completed).length}/{totalSubtasks} subtasks
              </span>
            )}
            {task.tags && task.tags.map(tag => {
              const colors = getTagColor(tag);
              return (
                <span key={tag} style={{
                  fontSize: isSubtask ? '10px' : '11px',
                  color: colors.text,
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  padding: isSubtask ? '1px 6px' : '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginTop: '4px',
                  fontWeight: '500'
                }}>
                  {tag}
                </span>
              );
            })}
          </div>
        </div>
        
        {/* Add Subtask button (parent only) */}
        {!isSubtask && (
          <button 
            data-testid="add-subtask-btn"
            onClick={() => setIsAddingSubtask(!isAddingSubtask)}
            style={{ 
              color: 'var(--text-secondary)', 
              padding: '4px', 
              borderRadius: '50%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0
            }}
            title="Add subtask"
          >
            <Plus size={16} />
          </button>
        )}

        {/* Edit details button */}
        <button 
          data-testid="edit-details-btn"
          onClick={() => setIsEditingDetails(!isEditingDetails)}
          style={{ 
            color: 'var(--text-secondary)', 
            padding: '4px', 
            borderRadius: '50%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0
          }}
          title="Edit due date/time"
        >
          <Calendar size={isSubtask ? 14 : 16} />
        </button>

        {/* Delete button */}
        <button 
          data-testid="delete-task-btn"
          onClick={() => handleDeleteTask(task.id)}
          style={{ 
            color: 'var(--text-tertiary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            flexShrink: 0
          }}
        >
          <Trash2 size={isSubtask ? 14 : 16} />
        </button>
      </div>

      {/* Collapsible Details Edit Tray */}
      {isEditingDetails && (
        <TaskDetailsEditor
          task={task}
          isSubtask={isSubtask}
          handleUpdateDueDate={handleUpdateDueDate}
          handleUpdateDueTime={handleUpdateDueTime}
          handleAddTag={handleAddTag}
          handleRemoveTag={handleRemoveTag}
          getTagColor={getTagColor}
          isMobile={isMobile}
        />
      )}

      {/* Render subtasks recursively (only for parent tasks) */}
      {!isSubtask && subtasks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
          {subtasks.map(subtask => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              isSubtask={true}
              handleToggleTask={handleToggleTask}
              handleDeleteTask={handleDeleteTask}
              handleUpdateDueDate={handleUpdateDueDate}
              handleUpdateDueTime={handleUpdateDueTime}
              handleAddTag={handleAddTag}
              handleRemoveTag={handleRemoveTag}
              getTagColor={getTagColor}
              selectedTagFilter={selectedTagFilter}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}

      {/* Inline Subtask Entry Form (only for parent tasks) */}
      {!isSubtask && isAddingSubtask && (
        <form 
          onSubmit={onAddSubtaskSubmit}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            paddingLeft: '52px', 
            paddingRight: '16px',
            paddingTop: '6px',
            paddingBottom: '6px',
            gap: '8px' 
          }}
        >
          <Plus size={16} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Add a subtask" 
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              borderBottom: '1px solid var(--color-brand)',
              backgroundColor: 'transparent',
              fontSize: '14.5px',
              color: 'var(--text-primary)',
              outline: 'none',
              padding: '4px 0'
            }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              type="button" 
              onClick={() => {
                setIsAddingSubtask(false);
                setSubtaskTitle('');
              }}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: '4px',
                backgroundColor: 'var(--color-brand)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
