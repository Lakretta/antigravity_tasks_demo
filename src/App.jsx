import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Plus, 
  Sun, 
  Moon, 
  Sparkles, 
  Database, 
  AlertTriangle, 
  X, 
  Check, 
  ListTodo,
  Lightbulb,
  Calendar,
  Clock,
  Bell
} from 'lucide-react';
import { 
  subscribeToLists, 
  saveList, 
  deleteList, 
  subscribeToTasks, 
  saveTask, 
  deleteTask, 
  subscribeToQuestions, 
  subscribeToAnswers,
  submitAnswer, 
  dbMode 
} from './firebase';

function App() {
  // Theme state
  const [theme, setTheme] = useState('light');

  // Database lists and tasks states
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState('default');
  const [tasks, setTasks] = useState([]);
  
  // UI inputs
  const [newListTitle, setNewListTitle] = useState('');
  const [showAddList, setShowAddList] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // AI Panel states
  const [aiQuestions, setAiQuestions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [answers, setAnswers] = useState(null);
  const [customProposal, setCustomProposal] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Reminder states
  const [editingTaskDetailsId, setEditingTaskDetailsId] = useState(null);
  const [activeReminder, setActiveReminder] = useState(null);
  const [dismissedReminders, setDismissedReminders] = useState(new Set());

  // Subtask & Blocker Warning states
  const [activeSubtaskInputTaskId, setActiveSubtaskInputTaskId] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [blockerWarning, setBlockerWarning] = useState({ parentTitle: '', show: false });

  // Tag states
  const [selectedTagFilter, setSelectedTagFilter] = useState(null);
  const [newTagInputs, setNewTagInputs] = useState({});

  // Initialize theme
  useEffect(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(systemTheme);
    document.documentElement.setAttribute('data-theme', systemTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    
    // Also toggle the body style
    if (nextTheme === 'dark') {
      document.body.style.backgroundColor = '#131314';
      document.body.style.color = '#e3e3e3';
    } else {
      document.body.style.backgroundColor = '#f0f4f9';
      document.body.style.color = '#1f1f1f';
    }
  };

  // Subscribe to lists
  useEffect(() => {
    return subscribeToLists((data) => {
      setLists(data);
      if (data.length > 0 && !data.find(l => l.id === activeListId)) {
        setActiveListId(data[0].id);
      }
    });
  }, [activeListId]);

  // Subscribe to tasks for active list
  useEffect(() => {
    if (!activeListId) return;
    return subscribeToTasks(activeListId, (data) => {
      setTasks(data);
    });
  }, [activeListId]);

  // Subscribe to AI Sidebar questions
  useEffect(() => {
    const unsubscribeQuestions = subscribeToQuestions((data) => {
      setAiQuestions(data);
      setSelectedOption(null); // Reset selection on question change
      setSubmittingAnswer(false);
    });
    return () => unsubscribeQuestions();
  }, []);

  // Subscribe to answers for active question
  useEffect(() => {
    const activeQuestion = aiQuestions[0];
    if (!activeQuestion) {
      setAnswers([]);
      setHasVoted(false);
      return;
    }

    // Check if user has already voted on this question in local storage
    const votedKey = 'voted_' + activeQuestion.id;
    setHasVoted(!!localStorage.getItem(votedKey));

    const unsubscribeAnswers = subscribeToAnswers(activeQuestion.id, (data) => {
      setAnswers(data || []);
    });
    return () => unsubscribeAnswers();
  }, [aiQuestions]);

  // Self-healing: if answers are loaded, length is 0, but hasVoted is true, clear the stale localStorage cache
  useEffect(() => {
    const activeQuestion = aiQuestions[0];
    if (activeQuestion && answers !== null && answers.length === 0 && hasVoted) {
      const votedKey = 'voted_' + activeQuestion.id;
      localStorage.removeItem(votedKey);
      setHasVoted(false);
    }
  }, [answers, aiQuestions, hasVoted]);

  // Background reminder checker engine
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const activeTasksWithDue = tasks.filter(t => !t.completed && t.dueDate && t.dueTime);
      
      for (const task of activeTasksWithDue) {
        const [year, month, day] = task.dueDate.split('-').map(Number);
        const [hours, minutes] = task.dueTime.split(':').map(Number);
        const dueDateTime = new Date(year, month - 1, day, hours, minutes, 0);
        
        if (now >= dueDateTime && !dismissedReminders.has(task.id)) {
          setActiveReminder({
            id: task.id,
            title: task.title,
            dueText: `${task.dueDate} at ${task.dueTime}`
          });
          break;
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [tasks, dismissedReminders]);

  const handleUpdateDueDate = async (task, dueDate) => {
    try {
      await saveTask({
        ...task,
        dueDate
      });
    } catch (err) {
      console.error('Failed to update due date:', err);
    }
  };

  const handleUpdateDueTime = async (task, dueTime) => {
    try {
      await saveTask({
        ...task,
        dueTime
      });
    } catch (err) {
      console.error('Failed to update due time:', err);
    }
  };

  const handleDismissReminder = (taskId) => {
    setDismissedReminders(prev => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
    setActiveReminder(null);
  };

  // Task Handlers
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    try {
      await saveTask({
        listId: activeListId,
        title: newTaskTitle.trim(),
        completed: false,
        dueDate: '',
        createdAt: Date.now()
      });
      setNewTaskTitle('');
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const handleAddSubtask = async (parentTaskId, e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    
    try {
      await saveTask({
        listId: activeListId,
        parentId: parentTaskId,
        title: newSubtaskTitle.trim(),
        completed: false,
        dueDate: '',
        createdAt: Date.now()
      });
      setNewSubtaskTitle('');
      setActiveSubtaskInputTaskId(null);
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleToggleTask = async (task) => {
    // If completing a task with no parent (meaning it's a parent task)
    if (!task.completed && !task.parentId) {
      const incompleteSubtasks = tasks.filter(t => t.parentId === task.id && !t.completed);
      if (incompleteSubtasks.length > 0) {
        setBlockerWarning({
          parentTitle: task.title,
          show: true
        });
        setTimeout(() => {
          setBlockerWarning(prev => {
            if (prev.parentTitle === task.id || prev.parentTitle === task.title) {
              return { ...prev, show: false };
            }
            return prev;
          });
        }, 4000);
        return;
      }
    }

    try {
      await saveTask({
        ...task,
        completed: !task.completed
      });
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      // Cascade delete subtasks
      const childTasks = tasks.filter(t => t.parentId === taskId);
      for (const child of childTasks) {
        await deleteTask(child.id);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Dynamic HSL Tag Color Generator
  const getTagColor = (tagName) => {
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return {
      bg: `hsl(${h}, 70%, 94%)`,
      text: `hsl(${h}, 70%, 25%)`,
      border: `hsl(${h}, 70%, 82%)`
    };
  };

  const handleAddTag = async (task, tagName) => {
    if (!tagName.trim()) return;
    const cleanTag = tagName.trim();
    const currentTags = task.tags || [];
    if (currentTags.includes(cleanTag)) return;
    
    try {
      await saveTask({
        ...task,
        tags: [...currentTags, cleanTag]
      });
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  };

  const handleRemoveTag = async (task, tagName) => {
    const currentTags = task.tags || [];
    try {
      await saveTask({
        ...task,
        tags: currentTags.filter(t => t !== tagName)
      });
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  // List Handlers
  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    const newListId = 'list_' + Date.now();
    try {
      await saveList({
        id: newListId,
        name: newListTitle.trim()
      });
      setNewListTitle('');
      setShowAddList(false);
      setActiveListId(newListId);
    } catch (err) {
      console.error('Failed to add list:', err);
    }
  };

  const handleDeleteList = async (listId) => {
    if (lists.length <= 1) {
      alert('You must keep at least one task list.');
      return;
    }
    if (confirm('Are you sure you want to delete this list and all its tasks?')) {
      try {
        await deleteList(listId);
      } catch (err) {
        console.error('Failed to delete list:', err);
      }
    }
  };

  // AI Sidebar handler
  const handleAnswerSubmit = async () => {
    if (selectedOption === null || !aiQuestions[0]) return;
    setSubmittingAnswer(true);
    const question = aiQuestions[0];
    const optionText = question.options[selectedOption];
    
    try {
      await submitAnswer(question.id, selectedOption, optionText);
      localStorage.setItem('voted_' + question.id, 'true');
      setHasVoted(true);
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Custom Feature Proposal handler
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customProposal.trim() || !aiQuestions[0]) return;
    setSubmittingAnswer(true);
    const question = aiQuestions[0];
    const customText = customProposal.trim();
    
    try {
      await submitAnswer(question.id, -1, customText);
      localStorage.setItem('voted_' + question.id, 'true');
      setHasVoted(true);
      setCustomProposal('');
      setShowCustomInput(false);
    } catch (err) {
      console.error('Failed to submit custom suggestion:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const allTagsInList = Array.from(new Set(tasks.flatMap(t => t.tags || []))).sort();

  const activeParentTasks = tasks.filter(t => !t.completed && (!t.parentId || !tasks.some(p => p.id === t.parentId)));
  const completedParentTasks = tasks.filter(t => t.completed && (!t.parentId || !tasks.some(p => p.id === t.parentId)));

  const filteredActiveParentTasks = activeParentTasks.filter(task => {
    if (!selectedTagFilter) return true;
    const hasTag = task.tags && task.tags.includes(selectedTagFilter);
    const subtasks = tasks.filter(t => t.parentId === task.id);
    const subtaskHasTag = subtasks.some(s => s.tags && s.tags.includes(selectedTagFilter));
    return hasTag || subtaskHasTag;
  });

  const filteredCompletedParentTasks = completedParentTasks.filter(task => {
    if (!selectedTagFilter) return true;
    const hasTag = task.tags && task.tags.includes(selectedTagFilter);
    const subtasks = tasks.filter(t => t.parentId === task.id);
    const subtaskHasTag = subtasks.some(s => s.tags && s.tags.includes(selectedTagFilter));
    return hasTag || subtaskHasTag;
  });

  const activeList = lists.find(l => l.id === activeListId);

  // AI Sidebar computations
  const activeQuestion = aiQuestions[0];
  const totalVotes = answers ? answers.length : 0;
  
  // Calculate results if user has voted
  const voteResults = (activeQuestion && answers) ? activeQuestion.options.map((option, idx) => {
    const votesCount = answers.filter(a => a.selectedOptionIndex === idx).length;
    const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
    return {
      text: option,
      votes: votesCount,
      percent: percentage
    };
  }) : [];

  // Extract custom ideas from answers
  const customIdeas = answers ? answers.filter(a => a.selectedOptionIndex === -1) : [];

  // Find what option active user voted for in the current session
  const myAnswer = (activeQuestion && answers) ? answers.find(a => a.questionId === activeQuestion.id && (a.id === 'session' || a.submittedAt > Date.now() - 3600000)) : null; // estimation
  const processedOrPendingText = (activeQuestion && answers && answers.length > 0) ? answers[answers.length - 1].selectedOptionText : '';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* LEFT PANEL: Task Lists Selector */}
      <aside style={{
        width: '260px',
        backgroundColor: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 8px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px 16px 8px', borderBottom: '1px solid var(--border-color)' }}>
          <ListTodo size={24} color="var(--color-brand)" />
          <span style={{ fontSize: '18px', fontWeight: '500', letterSpacing: '-0.2px' }}>Google Tasks</span>
        </div>

        {/* List items */}
        <nav style={{ flex: 1, overflowY: 'auto', marginTop: '16px' }} className="scroller">
          {lists.map(list => (
            <div 
              key={list.id} 
              onClick={() => setActiveListId(list.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
                cursor: 'pointer',
                backgroundColor: list.id === activeListId ? 'var(--color-brand-light)' : 'transparent',
                color: list.id === activeListId ? 'var(--color-brand)' : 'var(--text-primary)',
                fontWeight: list.id === activeListId ? '500' : '400',
              }}
              className="transition-all"
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                {list.name}
              </span>
              {list.id !== 'default' && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList(list.id);
                  }}
                  style={{
                    opacity: list.id === activeListId ? 0.7 : 0,
                    color: 'var(--color-danger)',
                    padding: '2px'
                  }}
                  className="list-delete-btn transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}

          {/* Add List input toggler */}
          {showAddList ? (
            <form onSubmit={handleAddList} style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="New list title" 
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-brand)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '14px'
                }}
              />
              <div style={{ display: 'flex', gap: '4px', alignSelf: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddList(false)}
                  style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', backgroundColor: 'var(--color-brand)', color: '#fff' }}
                >
                  Create
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setShowAddList(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                width: '100%',
                marginTop: '8px',
                fontSize: '14px',
                textAlign: 'left'
              }}
            >
              <Plus size={16} />
              <span>Create new list</span>
            </button>
          )}
        </nav>

        {/* Database status config */}
        <div style={{
          padding: '12px 8px 4px 8px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={12} color={dbMode === 'firebase' ? 'var(--color-success)' : 'var(--text-tertiary)'} />
            <span>Mode: <strong>{dbMode === 'firebase' ? 'Firebase Sync' : 'Offline Demo'}</strong></span>
          </div>
          {dbMode === 'local' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '4px', 
              backgroundColor: 'var(--color-brand-light)', 
              padding: '6px 8px', 
              borderRadius: '6px', 
              fontSize: '10px', 
              lineHeight: '1.3' 
            }}>
              <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-brand)' }} />
              <span>Running locally. Setup Firestore details in <code>.env</code> to sync.</span>
            </div>
          )}
        </div>
      </aside>

      {/* CENTER PANEL: Google Tasks Board */}
      <main style={{
        flex: 1,
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 32px',
        height: '100%',
        overflowY: 'auto'
      }} className="scroller">
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px'
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: '400', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {activeList?.name || 'My Tasks'}
          </h1>
        </div>

        {/* Tag Filter Bar */}
        {allTagsInList.length > 0 && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              overflowX: 'auto',
              paddingBottom: '6px',
              flexWrap: 'wrap'
            }} 
            className="scroller"
          >
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Filter by tag:</span>
            <button
              data-testid="tag-filter-All"
              onClick={() => setSelectedTagFilter(null)}
              style={{
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '16px',
                backgroundColor: selectedTagFilter === null ? 'var(--color-brand)' : 'var(--bg-tertiary)',
                color: selectedTagFilter === null ? '#fff' : 'var(--text-primary)',
                fontWeight: '500',
                border: '1px solid ' + (selectedTagFilter === null ? 'var(--color-brand)' : 'var(--border-color)'),
                cursor: 'pointer'
              }}
            >
              All
            </button>
            {allTagsInList.map(tag => {
              const colors = getTagColor(tag);
              const isSelected = selectedTagFilter === tag;
              return (
                <button
                  key={tag}
                  data-testid={`tag-filter-${tag}`}
                  onClick={() => setSelectedTagFilter(isSelected ? null : tag)}
                  style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    backgroundColor: isSelected ? 'var(--color-brand)' : colors.bg,
                    color: isSelected ? '#fff' : colors.text,
                    border: '1px solid ' + (isSelected ? 'var(--color-brand)' : colors.border),
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {/* New Task Entry */}
        <form onSubmit={handleAddTask} style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '12px 16px',
          gap: '12px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Plus size={20} color="var(--text-secondary)" />
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
                fontWeight: '500'
              }}
            >
              Save
            </button>
          )}
        </form>

        {/* Active Tasks Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '32px' }}>
          {filteredActiveParentTasks.map(task => {
            const isOverdue = (() => {
              if (!task.dueDate || !task.dueTime) return false;
              const [y, m, d] = task.dueDate.split('-').map(Number);
              const [h, min] = task.dueTime.split(':').map(Number);
              const due = new Date(y, m - 1, d, h, min);
              return new Date() > due;
            })();

            const parentSubtasks = tasks.filter(t => t.parentId === task.id && (!selectedTagFilter || (t.tags && t.tags.includes(selectedTagFilter)) || (task.tags && task.tags.includes(selectedTagFilter))));
            const unfilteredSubtasks = tasks.filter(t => t.parentId === task.id);
            const totalSubtasks = unfilteredSubtasks.length;
            const completedSubtasksCount = unfilteredSubtasks.filter(s => s.completed).length;
            const hasIncompleteSubtasks = unfilteredSubtasks.some(s => !s.completed);

            return (
              <div key={task.id} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Main Task Item */}
                <div 
                  data-testid="task-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    gap: '12px',
                    borderBottom: '1px solid rgba(0,0,0,0.04)'
                  }}
                >
                  <button 
                    onClick={() => handleToggleTask(task)}
                    style={{ color: hasIncompleteSubtasks ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
                  >
                    {hasIncompleteSubtasks ? (
                      <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} title="Blocked by incomplete subtasks" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '15px', color: 'var(--text-primary)', textAlign: 'left' }}>
                      {task.title}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {task.dueDate && (
                        <span style={{ 
                          fontSize: '11px', 
                          color: isOverdue ? '#ea4335' : 'var(--text-secondary)',
                          backgroundColor: isOverdue ? 'rgba(234, 67, 53, 0.1)' : 'var(--bg-secondary)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '4px',
                          fontWeight: isOverdue ? '600' : '400'
                        }}>
                          {isOverdue ? <AlertTriangle size={10} /> : <Clock size={10} />}
                          {isOverdue ? 'Overdue' : 'Due'}: {task.dueDate} {task.dueTime && `at ${task.dueTime}`}
                        </span>
                      )}
                      {totalSubtasks > 0 && (
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
                        </span>
                      )}
                      {task.tags && task.tags.map(tag => {
                        const colors = getTagColor(tag);
                        return (
                          <span key={tag} style={{
                            fontSize: '11px',
                            color: colors.text,
                            backgroundColor: colors.bg,
                            border: `1px solid ${colors.border}`,
                            padding: '2px 8px',
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
                  
                  {/* Add Subtask button */}
                  <button 
                    data-testid="add-subtask-btn"
                    onClick={() => setActiveSubtaskInputTaskId(activeSubtaskInputTaskId === task.id ? null : task.id)}
                    style={{ color: 'var(--text-secondary)', padding: '4px', borderRadius: '50%' }}
                    title="Add subtask"
                  >
                    <Plus size={16} />
                  </button>

                  {/* Edit details button */}
                  <button 
                    data-testid="edit-details-btn"
                    onClick={() => setEditingTaskDetailsId(editingTaskDetailsId === task.id ? null : task.id)}
                    style={{ color: 'var(--text-secondary)', padding: '4px', borderRadius: '50%' }}
                    title="Edit due date/time"
                  >
                    <Calendar size={16} />
                  </button>

                  <button 
                    data-testid="delete-task-btn"
                    onClick={() => handleDeleteTask(task.id)}
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Collapsible Details Edit Tray */}
                {editingTaskDetailsId === task.id && (
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    paddingLeft: '44px',
                    paddingRight: '16px',
                    paddingTop: '6px',
                    paddingBottom: '12px',
                    backgroundColor: 'rgba(0,0,0,0.01)',
                    borderBottom: '1px solid rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Due Date</label>
                      <input 
                        type="date" 
                        value={task.dueDate || ''}
                        onChange={(e) => handleUpdateDueDate(task, e.target.value)}
                        data-testid="due-date-input"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '12.5px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Due Time</label>
                      <input 
                        type="time" 
                        value={task.dueTime || ''}
                        onChange={(e) => handleUpdateDueTime(task, e.target.value)}
                        data-testid="due-time-input"
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '12.5px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    {/* Tag Editor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', flex: 1 }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Tags</label>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        {task.tags && task.tags.map(t => {
                          const colors = getTagColor(t);
                          return (
                            <span key={t} style={{
                              fontSize: '10px',
                              color: colors.text,
                              backgroundColor: colors.bg,
                              border: `1px solid ${colors.border}`,
                              padding: '1px 6px',
                              borderRadius: '10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
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
                                  width: '12px',
                                  height: '12px',
                                  fontSize: '10px',
                                  lineHeight: 1
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
                        value={newTagInputs[task.id] || ''}
                        onChange={(e) => setNewTagInputs({ ...newTagInputs, [task.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(task, e.target.value);
                            setNewTagInputs({ ...newTagInputs, [task.id]: '' });
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '12.5px',
                          outline: 'none',
                          width: '100%'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Subtasks rendering */}
                {parentSubtasks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                    {parentSubtasks.map(subtask => {
                      const isSubtaskOverdue = (() => {
                        if (!subtask.dueDate || !subtask.dueTime) return false;
                        const [y, m, d] = subtask.dueDate.split('-').map(Number);
                        const [h, min] = subtask.dueTime.split(':').map(Number);
                        const due = new Date(y, m - 1, d, h, min);
                        return new Date() > due;
                      })();

                      return (
                        <div key={subtask.id} style={{ display: 'flex', flexDirection: 'column', paddingLeft: '36px' }}>
                          <div 
                            data-testid="task-row"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              backgroundColor: 'transparent',
                              gap: '12px',
                              borderBottom: '1px solid rgba(0,0,0,0.02)'
                            }}
                          >
                            <button 
                              onClick={() => handleToggleTask(subtask)}
                              style={{ color: subtask.completed ? 'var(--color-brand)' : 'var(--text-secondary)' }}
                            >
                              {subtask.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </button>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span style={{ 
                                fontSize: '14px', 
                                color: subtask.completed ? 'var(--text-secondary)' : 'var(--text-primary)', 
                                textAlign: 'left',
                                textDecoration: subtask.completed ? 'line-through' : 'none'
                              }}>
                                {subtask.title}
                              </span>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {subtask.dueDate && (
                                  <span style={{ 
                                    fontSize: '10px', 
                                    color: isSubtaskOverdue ? '#ea4335' : 'var(--text-secondary)',
                                    backgroundColor: isSubtaskOverdue ? 'rgba(234, 67, 53, 0.1)' : 'var(--bg-secondary)',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    marginTop: '2px',
                                    fontWeight: isSubtaskOverdue ? '600' : '400'
                                  }}>
                                    {isSubtaskOverdue ? <AlertTriangle size={8} /> : <Clock size={8} />}
                                    {isSubtaskOverdue ? 'Overdue' : 'Due'}: {subtask.dueDate} {subtask.dueTime && `at ${subtask.dueTime}`}
                                  </span>
                                )}
                                {subtask.tags && subtask.tags.map(tag => {
                                  const colors = getTagColor(tag);
                                  return (
                                    <span key={tag} style={{
                                      fontSize: '10px',
                                      color: colors.text,
                                      backgroundColor: colors.bg,
                                      border: `1px solid ${colors.border}`,
                                      padding: '1px 6px',
                                      borderRadius: '10px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      marginTop: '2px',
                                      fontWeight: '500'
                                    }}>
                                      {tag}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            
                            <button 
                              data-testid="edit-details-btn"
                              onClick={() => setEditingTaskDetailsId(editingTaskDetailsId === subtask.id ? null : subtask.id)}
                              style={{ color: 'var(--text-secondary)', padding: '4px', borderRadius: '50%' }}
                              title="Edit due date/time"
                            >
                              <Calendar size={14} />
                            </button>

                            <button 
                              data-testid="delete-task-btn"
                              onClick={() => handleDeleteTask(subtask.id)}
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Collapsible Details Edit Tray for Subtask */}
                          {editingTaskDetailsId === subtask.id && (
                            <div style={{
                              display: 'flex',
                              gap: '12px',
                              paddingLeft: '44px',
                              paddingRight: '16px',
                              paddingTop: '4px',
                              paddingBottom: '8px',
                              backgroundColor: 'rgba(0,0,0,0.01)',
                              borderBottom: '1px solid rgba(0,0,0,0.02)'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500' }}>Due Date</label>
                                <input 
                                  type="date" 
                                  value={subtask.dueDate || ''}
                                  onChange={(e) => handleUpdateDueDate(subtask, e.target.value)}
                                  data-testid="due-date-input"
                                  style={{
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '11px',
                                    outline: 'none'
                                  }}
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500' }}>Due Time</label>
                                <input 
                                  type="time" 
                                  value={subtask.dueTime || ''}
                                  onChange={(e) => handleUpdateDueTime(subtask, e.target.value)}
                                  data-testid="due-time-input"
                                  style={{
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '11px',
                                    outline: 'none'
                                  }}
                                />
                              </div>
                              {/* Tag Editor for Subtask */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start', flex: 1 }}>
                                <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500' }}>Tags</label>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                  {subtask.tags && subtask.tags.map(t => {
                                    const colors = getTagColor(t);
                                    return (
                                      <span key={t} style={{
                                        fontSize: '9px',
                                        color: colors.text,
                                        backgroundColor: colors.bg,
                                        border: `1px solid ${colors.border}`,
                                        padding: '1px 5px',
                                        borderRadius: '8px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}>
                                        {t}
                                        <button 
                                          type="button" 
                                          onClick={() => handleRemoveTag(subtask, t)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-tertiary)',
                                            width: '10px',
                                            height: '10px',
                                            fontSize: '8px',
                                            lineHeight: 1
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
                                  value={newTagInputs[subtask.id] || ''}
                                  onChange={(e) => setNewTagInputs({ ...newTagInputs, [subtask.id]: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddTag(subtask, e.target.value);
                                      setNewTagInputs({ ...newTagInputs, [subtask.id]: '' });
                                    }
                                  }}
                                  style={{
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '11px',
                                    outline: 'none',
                                    width: '100%'
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline Subtask Entry Form */}
                {activeSubtaskInputTaskId === task.id && (
                  <form 
                    onSubmit={(e) => handleAddSubtask(task.id, e)}
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
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
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
                          setActiveSubtaskInputTaskId(null);
                          setNewSubtaskTitle('');
                        }}
                        style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', backgroundColor: 'var(--color-brand)', color: '#fff' }}
                      >
                        Add
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}

          {tasks.filter(t => !t.completed).length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '14px' }}>
              No active tasks. Add a task to get started!
            </div>
          )}
        </div>

        {/* Completed Tasks Section */}
        {completedParentTasks.length > 0 && (
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '12px',
              textAlign: 'left'
            }}>
              Completed ({tasks.filter(t => t.completed).length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredCompletedParentTasks.map(task => {
                const completedSubtasks = tasks.filter(t => t.parentId === task.id && t.completed && (!selectedTagFilter || (t.tags && t.tags.includes(selectedTagFilter)) || (task.tags && task.tags.includes(selectedTagFilter))));
                return (
                  <div key={task.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div 
                      data-testid="task-row"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        gap: '12px',
                        opacity: 0.65
                      }}
                    >
                      <button 
                        onClick={() => handleToggleTask(task)}
                        style={{ color: 'var(--color-brand)' }}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ 
                          textAlign: 'left', 
                          textDecoration: 'line-through', 
                          fontSize: '15px', 
                          color: 'var(--text-secondary)' 
                        }}>
                          {task.title}
                        </span>
                        {task.tags && task.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                            {task.tags.map(tag => {
                              const colors = getTagColor(tag);
                              return (
                                <span key={tag} style={{
                                  fontSize: '10px',
                                  color: colors.text,
                                  backgroundColor: colors.bg,
                                  border: `1px solid ${colors.border}`,
                                  padding: '1px 6px',
                                  borderRadius: '10px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  fontWeight: '500'
                                }}>
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <button 
                        data-testid="delete-task-btn"
                        onClick={() => handleDeleteTask(task.id)}
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Completed Subtasks rendering */}
                    {completedSubtasks.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                        {completedSubtasks.map(subtask => (
                          <div 
                            key={subtask.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px 16px',
                              paddingLeft: '48px',
                              borderRadius: '8px',
                              gap: '12px',
                              opacity: 0.55
                            }}
                            data-testid="task-row"
                          >
                            <button 
                              onClick={() => handleToggleTask(subtask)}
                              style={{ color: 'var(--color-brand)' }}
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span style={{ 
                                textAlign: 'left', 
                                textDecoration: 'line-through', 
                                fontSize: '14px', 
                                color: 'var(--text-secondary)' 
                              }}>
                                {subtask.title}
                              </span>
                              {subtask.tags && subtask.tags.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                                  {subtask.tags.map(tag => {
                                    const colors = getTagColor(tag);
                                    return (
                                      <span key={tag} style={{
                                        fontSize: '9px',
                                        color: colors.text,
                                        backgroundColor: colors.bg,
                                        border: `1px solid ${colors.border}`,
                                        padding: '1px 5px',
                                        borderRadius: '8px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        fontWeight: '500'
                                      }}>
                                        {tag}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <button 
                              data-testid="delete-task-btn"
                              onClick={() => handleDeleteTask(subtask.id)}
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* RIGHT PANEL: Gemini AI feedback sidebar */}
      <section style={{
        width: '360px',
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%'
      }}>
        {/* Gemini Header */}
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
              <span style={{ display: 'block', fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>Antigravity Assistant</span>
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
                color: 'var(--text-secondary)'
              }}
              title="Toggle Light/Dark Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>

        {/* Content body */}
        <div style={{ flex: 1, padding: '24px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="scroller">
          
          {activeQuestion ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              
              {/* Question Card */}
              <div style={{ 
                backgroundColor: 'var(--bg-primary)', 
                borderRadius: '12px', 
                padding: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <Sparkles size={16} color="var(--color-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '14px', lineHeight: '1.45', fontWeight: '500', color: 'var(--text-primary)', textAlign: 'left' }}>
                    {activeQuestion.question}
                  </p>
                </div>
                
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  {hasVoted 
                    ? "Thank you for voting! Antigravity agent is reviewing options in real-time."
                    : "Select a suggested feature or suggest a custom idea below to let the Antigravity agent implement it."}
                </span>
              </div>

              {/* Options Section: Show Results if Voted, otherwise Show Choices */}
              {hasVoted ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Poll Results ({totalVotes} votes)
                  </span>

                  {/* Standard Option Results with progress bar backgrounds */}
                  {voteResults.map((result, idx) => (
                    <div 
                      key={idx}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        overflow: 'hidden',
                        textAlign: 'left'
                      }}
                    >
                      {/* Glassmorphic progress bar background */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: `${result.percent}%`,
                        backgroundColor: 'var(--color-brand-light)',
                        opacity: 0.8,
                        zIndex: 1,
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                      
                      <span style={{ zIndex: 2, fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: '500', flex: 1, paddingRight: '8px' }}>
                        {result.text}
                      </span>
                      <span style={{ zIndex: 2, fontSize: '12.5px', color: 'var(--color-brand)', fontWeight: '600', flexShrink: 0 }}>
                        {result.votes} {result.votes === 1 ? 'vote' : 'votes'} ({result.percent}%)
                      </span>
                    </div>
                  ))}

                  {/* Custom Ideas Static List */}
                  {customIdeas.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Lightbulb size={14} color="var(--color-brand)" />
                        <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Custom Ideas Suggested
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {customIdeas.map((idea, idx) => (
                          <div 
                            key={idx}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--bg-primary)',
                              border: '1px dashed var(--border-color)',
                              fontSize: '13px',
                              textAlign: 'left',
                              color: 'var(--text-primary)',
                              lineHeight: '1.4'
                            }}
                          >
                            "{idea.selectedOptionText}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending loop indicator */}
                  <div style={{
                    marginTop: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '24px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    gap: '12px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(155, 114, 248, 0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-brand)',
                      animation: 'pulse 2s infinite ease-in-out'
                    }}>
                      <Sparkles size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        Choice Submitted!
                      </span>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                        The Antigravity Agent has detected the choice: <strong>"{processedOrPendingText}"</strong>. It will now generate components, run validation tests, and update the app.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Selectable Standard Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeQuestion.options.map((option, idx) => (
                      <div 
                        key={idx}
                        onClick={() => { setSelectedOption(idx); setShowCustomInput(false); }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '14px 16px',
                          borderRadius: '10px',
                          border: '2px solid ' + (selectedOption === idx ? 'var(--color-brand)' : 'var(--border-color)'),
                          backgroundColor: selectedOption === idx ? 'var(--color-brand-light)' : 'var(--bg-primary)',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        className="transition-all"
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '2px solid ' + (selectedOption === idx ? 'var(--color-brand)' : 'var(--text-tertiary)'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                          backgroundColor: selectedOption === idx ? 'var(--color-brand)' : 'transparent'
                        }}>
                          {selectedOption === idx && <Check size={10} color="#fff" />}
                        </div>
                        <span style={{ 
                          fontSize: '13.5px', 
                          lineHeight: '1.4', 
                          color: selectedOption === idx ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontWeight: selectedOption === idx ? '500' : '400'
                        }}>
                          {option}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Custom Suggestion toggle link */}
                  {!showCustomInput && (
                    <button
                      type="button"
                      onClick={() => { setShowCustomInput(true); setSelectedOption(null); }}
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-brand)',
                        fontWeight: '500',
                        alignSelf: 'flex-start',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}
                      className="hover:bg-brand-light"
                    >
                      + Suggest a custom feature...
                    </button>
                  )}

                  {/* Custom Suggestion Input Form */}
                  {showCustomInput && (
                    <form onSubmit={handleCustomSubmit} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px dashed var(--color-brand)',
                      padding: '12px',
                      borderRadius: '10px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-brand)' }}>Custom Proposal</span>
                        <button type="button" onClick={() => setShowCustomInput(false)} style={{ color: 'var(--text-secondary)' }}>
                          <X size={14} />
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Describe your custom feature idea..."
                        value={customProposal}
                        onChange={(e) => setCustomProposal(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-secondary)',
                          fontSize: '13px',
                          color: 'var(--text-primary)',
                          resize: 'none',
                          outline: 'none'
                        }}
                        required
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!customProposal.trim() || submittingAnswer}
                        style={{
                          backgroundColor: (!customProposal.trim() || submittingAnswer) ? 'var(--border-color)' : 'var(--color-brand)',
                          color: (!customProposal.trim() || submittingAnswer) ? 'var(--text-tertiary)' : '#fff',
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: (!customProposal.trim() || submittingAnswer) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Submit Custom Suggestion
                      </button>
                    </form>
                  )}

                  {/* Standard Option Submit Button */}
                  {!showCustomInput && (
                    <button 
                      onClick={handleAnswerSubmit}
                      disabled={selectedOption === null || submittingAnswer}
                      style={{
                        backgroundColor: (selectedOption === null || submittingAnswer) ? 'var(--border-color)' : 'var(--color-brand)',
                        color: (selectedOption === null || submittingAnswer) ? 'var(--text-tertiary)' : '#fff',
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginTop: '10px',
                        cursor: (selectedOption === null || submittingAnswer) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Submit Choice to Antigravity
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Fallback Idle state if no questions are configured
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '18px', 
              flex: 1, 
              textAlign: 'center',
              padding: '40px 10px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(155, 114, 248, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-brand)',
                animation: 'pulse 2s infinite ease-in-out'
              }}>
                <Sparkles size={32} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  Awaiting Active Session
                </span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', maxWidth: '260px' }}>
                  There are currently no active design questions. Use the Antigravity agent CLI tool to seed a question into Firestore.
                </p>
              </div>
            </div>
          )}

          {/* Real-time Code Agent State Logger */}
          <div style={{
            marginTop: 'auto',
            width: '100%',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            textAlign: 'left',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--color-brand)' }}>agent_state.log</span>
              <span style={{ opacity: 0.6 }}>ACTIVE</span>
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&gt; git status --porcelain</div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-success)' }}>&gt; [A] src/App.jsx (modified)</div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hasVoted ? '> Processing user choice: ' + processedOrPendingText : '> Ready. Waiting for response...'}
            </div>
          </div>
        </div>
      </section>

      {/* Embedded CSS animations */}
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(138, 180, 248, 0.4);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 12px rgba(138, 180, 248, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(138, 180, 248, 0);
          }
        }
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Reminder Popup Alert Banner */}
      {activeReminder && (
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
              onClick={() => handleDismissReminder(activeReminder.id)} 
              style={{ color: 'var(--text-secondary)', marginLeft: 'auto', padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
            <button 
              data-testid="dismiss-reminder-btn"
              onClick={() => handleDismissReminder(activeReminder.id)}
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
                const t = tasks.find(x => x.id === activeReminder.id);
                if (t) {
                  await handleToggleTask(t);
                }
                handleDismissReminder(activeReminder.id);
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
      )}

      {/* Blocker Warning Popup Alert Banner */}
      {blockerWarning && blockerWarning.show && (
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
            onClick={() => setBlockerWarning({ ...blockerWarning, show: false })} 
            style={{ color: 'var(--text-secondary)', marginLeft: 'auto', padding: '2px', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

    </div>
  );
}

export default App;
